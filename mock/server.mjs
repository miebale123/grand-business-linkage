import crypto from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, 'db.json')
const PORT = 3001
const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'
const PRODUCT_STATUSES = new Set(['pending', 'approved', 'rejected'])
const PRODUCT_CONDITIONS = new Set(['New', 'Used'])
const PRODUCT_AVAILABILITY = new Set(['In Stock', 'Low Stock', 'Out of Stock'])

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function makeToken(userId) {
  return `mock.${userId}`
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function includesText(value, query) {
  return normalizeText(value).includes(normalizeText(query))
}

async function readDb() {
  const raw = await readFile(DB_PATH, 'utf8')
  return JSON.parse(raw)
}

async function writeDb(db) {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2) + '\n', 'utf8')
}

function json(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  })
  res.end(body)
}

function noContent(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  })
  res.end()
}

function badRequest(res, message) {
  json(res, 400, { message })
}

function unauthorized(res, message = 'Unauthorized.') {
  json(res, 401, { message })
}

function notFound(res, message = 'Not found.') {
  json(res, 404, { message })
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return null

  const text = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function getUserIdFromAuth(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  if (!token.startsWith('mock.')) return ''
  return token.slice('mock.'.length).trim()
}

function matchesPath(url, prefix) {
  return url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
}

function normalizeStatus(value, fallback = 'pending') {
  const next = String(value ?? '').trim()
  return PRODUCT_STATUSES.has(next) ? next : fallback
}

function normalizeCondition(value) {
  const next = String(value ?? '').trim()
  return PRODUCT_CONDITIONS.has(next) ? next : 'New'
}

function normalizeAvailability(value, fallback = 'In Stock') {
  const next = String(value ?? '').trim()
  return PRODUCT_AVAILABILITY.has(next) ? next : fallback
}

function normalizeNumber(value, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry) => String(entry ?? '').trim()).filter(Boolean)
}

function buildMaps(db) {
  return {
    merchantById: Object.fromEntries(
      (db.merchants || []).map((merchant) => [merchant.id, merchant]),
    ),
    userById: Object.fromEntries((db.users || []).map((user) => [user.id, user])),
  }
}

function hydrateMerchant(merchant) {
  return {
    ...merchant,
    verificationLevel: merchant.verified ? 'verified' : 'pending',
  }
}

function hydrateProduct(product, db) {
  const { merchantById, userById } = buildMaps(db)
  const merchant = merchantById[product.merchantId]
  const owner = merchant ? userById[merchant.ownerId] : null
  const explicitImages = normalizeStringArray(product.images)
  const image =
    String(product.image || explicitImages[0] || DEFAULT_PRODUCT_IMAGE).trim() ||
    DEFAULT_PRODUCT_IMAGE
  const images = Array.from(new Set([image, ...explicitImages].filter(Boolean)))
  const createdAtCandidate = String(product.createdAt || '').trim()

  return {
    ...product,
    image,
    images,
    featured: Boolean(product.featured),
    condition: normalizeCondition(product.condition),
    location: String(product.location || merchant?.location || '').trim(),
    phone: String(product.phone || owner?.phone || '').trim(),
    createdAt: createdAtCandidate || new Date().toISOString(),
    status: normalizeStatus(product.status, merchant?.verified ? 'approved' : 'pending'),
  }
}

function listProducts(db) {
  return (db.products || [])
    .map((product) => hydrateProduct(product, db))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
}

function listMerchants(db) {
  return (db.merchants || []).map(hydrateMerchant)
}

function buildMarketplaceAreas(db) {
  const merchantById = Object.fromEntries(
    (db.merchants || []).map((merchant) => [merchant.id, merchant]),
  )
  const approvedProducts = listProducts(db).filter((product) => product.status === 'approved')
  const areaMap = new Map()

  approvedProducts.forEach((product) => {
    const merchant = merchantById[product.merchantId]
    if (!merchant) {
      return
    }

    const entry = areaMap.get(merchant.area) || {
      area: merchant.area,
      city: merchant.city,
      merchantIds: new Set(),
      productCount: 0,
    }

    entry.merchantIds.add(merchant.id)
    entry.productCount += 1
    areaMap.set(merchant.area, entry)
  })

  return [...areaMap.values()]
    .map((entry) => ({
      area: entry.area,
      city: entry.city,
      merchantCount: entry.merchantIds.size,
      productCount: entry.productCount,
    }))
    .sort(
      (left, right) =>
        right.productCount - left.productCount || left.area.localeCompare(right.area),
    )
}

function filterProducts(products, db, options = {}) {
  const merchantById = Object.fromEntries(
    (db.merchants || []).map((merchant) => [merchant.id, merchant]),
  )
  const search = String(options.q || options.search || '').trim()
  const category = String(options.category || '').trim()
  const availability = String(options.availability || '').trim()
  const area = String(options.area || '').trim()
  const merchantId = String(options.merchantId || '').trim()
  const condition = String(options.condition || '').trim()
  const status = String(options.status || '').trim()
  const minPrice = options.minPrice == null ? null : Number(options.minPrice)
  const maxPrice = options.maxPrice == null ? null : Number(options.maxPrice)

  return products.filter((product) => {
    const merchant = merchantById[product.merchantId]

    if (search) {
      const matchesSearch =
        includesText(product.name, search) ||
        includesText(product.category, search) ||
        includesText(product.shortDescription, search) ||
        includesText(product.description, search) ||
        includesText(product.location, search) ||
        includesText(merchant?.businessName, search) ||
        includesText(merchant?.location, search) ||
        includesText(merchant?.area, search)

      if (!matchesSearch) {
        return false
      }
    }

    if (category && product.category !== category) {
      return false
    }

    if (availability && product.availability !== availability) {
      return false
    }

    if (area && merchant?.area !== area) {
      return false
    }

    if (merchantId && product.merchantId !== merchantId) {
      return false
    }

    if (condition && product.condition !== condition) {
      return false
    }

    if (status && product.status !== status) {
      return false
    }

    if (Number.isFinite(minPrice) && product.price < minPrice) {
      return false
    }

    if (Number.isFinite(maxPrice) && product.price > maxPrice) {
      return false
    }

    return true
  })
}

function paginateProducts(products, page, pageSize) {
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 0
  const normalizedPageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 0

  if (!normalizedPage || !normalizedPageSize) {
    return products
  }

  const start = (normalizedPage - 1) * normalizedPageSize
  return products.slice(start, start + normalizedPageSize)
}

function buildProductPayload(payload, merchant, owner, existingProduct) {
  const source = {
    ...existingProduct,
    ...payload,
  }
  const explicitImages = normalizeStringArray(source.images)
  const image =
    String(
      source.image || explicitImages[0] || existingProduct?.image || DEFAULT_PRODUCT_IMAGE,
    ).trim() || DEFAULT_PRODUCT_IMAGE
  const images = Array.from(new Set([image, ...explicitImages].filter(Boolean)))
  const createdAtCandidate = String(existingProduct?.createdAt || source.createdAt || '').trim()

  return {
    merchantId: merchant.id,
    name: String(source.name || '').trim(),
    category: String(source.category || '').trim(),
    price: normalizeNumber(source.price, existingProduct?.price ?? 0),
    availability: normalizeAvailability(
      source.availability,
      existingProduct?.availability || 'In Stock',
    ),
    shortDescription: String(source.shortDescription || '').trim(),
    description: String(source.description || '').trim(),
    image,
    images,
    featured: Boolean(source.featured),
    condition: normalizeCondition(source.condition),
    location: String(
      source.location || existingProduct?.location || merchant.location || '',
    ).trim(),
    phone: String(source.phone || existingProduct?.phone || owner?.phone || '').trim(),
    createdAt: createdAtCandidate || new Date().toISOString(),
    status: merchant.verified ? 'approved' : 'pending',
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost')
    url.pathname = url.pathname.replace(/^\/api/, '') || '/'

    if (req.method === 'OPTIONS') {
      return noContent(res)
    }

    if (req.method === 'POST' && url.pathname === '/auth/login') {
      const payload = (await readBody(req)) || {}
      const email = normalizeText(payload.email)
      const password = String(payload.password || '')
      const db = await readDb()

      const user = (db.users || []).find((record) => normalizeText(record.email) === email)
      if (!user || user.password !== password) {
        return unauthorized(res, 'Invalid email or password.')
      }

      return json(res, 200, { token: makeToken(user.id) })
    }

    if (req.method === 'GET' && url.pathname === '/auth/me') {
      const userId = getUserIdFromAuth(req)
      if (!userId) return unauthorized(res)

      const db = await readDb()
      const user = (db.users || []).find((record) => record.id === userId)
      if (!user) return unauthorized(res, 'Invalid session.')

      return json(res, 200, user)
    }

    if (req.method === 'POST' && url.pathname === '/auth/register') {
      const payload = (await readBody(req)) || {}
      const email = normalizeText(payload.email)
      const password = String(payload.password || '')
      const name = String(payload.name || '').trim()

      if (!email || !password || !name) {
        return badRequest(res, 'Missing required fields.')
      }

      const db = await readDb()
      const existing = (db.users || []).find((record) => normalizeText(record.email) === email)
      if (existing) {
        return badRequest(res, 'An account with this email already exists.')
      }

      const role = payload.role === 'merchant' || payload.role === 'admin' ? payload.role : 'user'
      const user = {
        id: makeId('user'),
        name,
        email,
        password,
        role,
        businessName: payload.businessName ? String(payload.businessName).trim() : undefined,
        phone: payload.phone ? String(payload.phone).trim() : undefined,
        location: payload.location ? String(payload.location).trim() : undefined,
        faydaPhoto: payload.faydaPhoto || undefined,
        tradeLicensePhoto: payload.tradeLicensePhoto || undefined,
      }

      db.users.push(user)

      if (role === 'merchant') {
        const area =
          String(user.location || 'Addis Ababa')
            .split(',')[0]
            ?.trim() || 'Addis Ababa'
        db.merchants.push({
          id: makeId('merchant'),
          ownerId: user.id,
          businessName: user.businessName || `${user.name} Store`,
          category: 'General Merchandise',
          location: user.location || `${area}, Addis Ababa`,
          area,
          city: 'Addis Ababa',
          coordinates: { lat: 9.0222, lng: 38.7468 },
          deliveryAreas: [area],
          description:
            'Freshly onboarded seller. Add a strong description so shoppers immediately understand what your business offers.',
          verified: false,
        })
      }

      await writeDb(db)
      return json(res, 200, { token: makeToken(user.id) })
    }

    if (req.method === 'GET' && url.pathname === '/catalog/metadata') {
      const db = await readDb()
      return json(res, 200, db.catalogMetadata || { categories: [], availabilityOptions: [] })
    }

    if (req.method === 'GET' && url.pathname.startsWith('/products')) {
      const db = await readDb()

      if (url.pathname === '/products/featured') {
        const featuredProducts = listProducts(db).filter(
          (product) => product.featured && product.status === 'approved',
        )
        return json(res, 200, featuredProducts)
      }

      const isPendingEndpoint = url.pathname === '/admin/products/pending'
      if (isPendingEndpoint) {
        const pendingProducts = listProducts(db).filter((product) => product.status === 'pending')
        return json(res, 200, pendingProducts)
      }

      const page = Number(url.searchParams.get('_page') || 0)
      const pageSize = Number(url.searchParams.get('_limit') || 0)

      const products = filterProducts(listProducts(db), db, {
        q: url.searchParams.get('q'),
        category: url.searchParams.get('category'),
        availability: url.searchParams.get('availability'),
        area: url.searchParams.get('area'),
        minPrice: url.searchParams.get('minPrice'),
        maxPrice: url.searchParams.get('maxPrice'),
        condition: url.searchParams.get('condition'),
        status: url.searchParams.get('status'),
        merchantId: url.searchParams.get('merchantId'),
      })

      return json(res, 200, paginateProducts(products, page, pageSize))
    }

    if (req.method === 'GET' && matchesPath(url, '/products')) {
      const [, , productId] = url.pathname.split('/')
      if (!productId) return notFound(res)

      const db = await readDb()
      const product = (db.products || []).find((record) => record.id === productId)
      if (!product) return notFound(res, 'Product not found.')

      return json(res, 200, hydrateProduct(product, db))
    }

    if (req.method === 'GET' && url.pathname === '/merchants') {
      const db = await readDb()
      return json(res, 200, listMerchants(db))
    }

    if (req.method === 'GET' && matchesPath(url, '/merchants/by-owner')) {
      const ownerId = url.pathname.split('/')[3] || ''
      const db = await readDb()
      const merchant = (db.merchants || []).find((record) => record.ownerId === ownerId)
      if (!merchant) return notFound(res, 'Merchant profile not found.')
      return json(res, 200, hydrateMerchant(merchant))
    }

    if (req.method === 'GET' && matchesPath(url, '/merchants')) {
      const [, , merchantId, sub] = url.pathname.split('/')
      if (!merchantId) return notFound(res)
      const db = await readDb()

      if (sub === 'products') {
        const merchantProducts = listProducts(db).filter(
          (product) => product.merchantId === merchantId,
        )
        return json(res, 200, merchantProducts)
      }

      if (sub === 'catalog') {
        const merchantProducts = listProducts(db).filter(
          (product) => product.merchantId === merchantId && product.status === 'approved',
        )
        return json(res, 200, merchantProducts)
      }

      const merchant = (db.merchants || []).find((record) => record.id === merchantId)
      if (!merchant) return notFound(res, 'Merchant not found.')
      return json(res, 200, hydrateMerchant(merchant))
    }

    if (req.method === 'GET' && url.pathname === '/marketplace/areas') {
      const db = await readDb()
      return json(res, 200, buildMarketplaceAreas(db))
    }

    if (req.method === 'GET' && url.pathname === '/marketplace/merchants/by-area') {
      const area = String(url.searchParams.get('area') || '').trim()
      const limit = Number(url.searchParams.get('limit') || 0)
      const excludeMerchantId = String(url.searchParams.get('excludeMerchantId') || '').trim()
      const db = await readDb()
      const approvedMerchantIds = new Set(
        listProducts(db)
          .filter((product) => product.status === 'approved')
          .map((product) => product.merchantId),
      )

      let matches = listMerchants(db).filter(
        (merchant) => merchant.area === area && approvedMerchantIds.has(merchant.id),
      )

      if (excludeMerchantId) {
        matches = matches.filter((merchant) => merchant.id !== excludeMerchantId)
      }

      if (limit > 0) {
        matches = matches.slice(0, limit)
      }

      return json(res, 200, matches)
    }

    if (req.method === 'GET' && url.pathname === '/inquiries') {
      const db = await readDb()
      return json(res, 200, db.inquiries || [])
    }

    if (req.method === 'POST' && url.pathname === '/inquiries') {
      const payload = (await readBody(req)) || {}
      const message = String(payload.message || '').trim()
      if (message.length < 10) {
        return badRequest(res, 'Write a little more so the merchant knows exactly what you need.')
      }

      const inquiry = {
        id: makeId('inquiry'),
        productId: String(payload.productId || ''),
        merchantId: String(payload.merchantId || ''),
        userId: String(payload.userId || ''),
        customerName: String(payload.customerName || ''),
        message,
        createdAt: new Date().toISOString(),
      }

      const db = await readDb()
      db.inquiries.unshift(inquiry)
      await writeDb(db)
      return json(res, 200, inquiry)
    }

    if (
      req.method === 'GET' &&
      matchesPath(url, '/merchants/by-owner') &&
      url.pathname.endsWith('/inquiries')
    ) {
      const ownerId = url.pathname.split('/')[3] || ''
      const db = await readDb()
      const merchant = (db.merchants || []).find((record) => record.ownerId === ownerId)
      if (!merchant) return json(res, 200, [])
      return json(
        res,
        200,
        (db.inquiries || []).filter((inquiry) => inquiry.merchantId === merchant.id),
      )
    }

    if (
      req.method === 'GET' &&
      matchesPath(url, '/merchants/by-owner') &&
      url.pathname.endsWith('/dashboard-analytics')
    ) {
      const ownerId = url.pathname.split('/')[3] || ''
      const db = await readDb()
      const entry = (db.merchantDashboardAnalytics || []).find((record) => record.id === ownerId)
      return json(
        res,
        200,
        entry?.data || { reach: { labels: [], series: [] }, demand: { labels: [], series: [] } },
      )
    }

    if (
      req.method === 'POST' &&
      matchesPath(url, '/merchants/by-owner') &&
      url.pathname.endsWith('/products')
    ) {
      const ownerId = url.pathname.split('/')[3] || ''
      const payload = (await readBody(req)) || {}
      const db = await readDb()
      const merchant = (db.merchants || []).find((record) => record.ownerId === ownerId)
      const owner = (db.users || []).find((record) => record.id === ownerId)
      if (!merchant) return notFound(res, 'Merchant profile not found.')

      const product = {
        id: makeId('product'),
        ...buildProductPayload(payload, merchant, owner),
      }

      db.products.unshift(product)
      await writeDb(db)
      return json(res, 200, hydrateProduct(product, db))
    }

    if (
      req.method === 'PATCH' &&
      matchesPath(url, '/merchants/by-owner') &&
      url.pathname.includes('/products/')
    ) {
      const parts = url.pathname.split('/')
      const ownerId = parts[3] || ''
      const productId = parts[5] || ''
      const payload = (await readBody(req)) || {}
      const db = await readDb()
      const merchant = (db.merchants || []).find((record) => record.ownerId === ownerId)
      const owner = (db.users || []).find((record) => record.id === ownerId)
      if (!merchant) return notFound(res, 'Merchant profile not found.')

      const productIndex = (db.products || []).findIndex(
        (record) => record.id === productId && record.merchantId === merchant.id,
      )
      if (productIndex < 0) {
        return notFound(res, 'Product not found for this merchant.')
      }

      const existingProduct = db.products[productIndex]
      db.products[productIndex] = {
        ...existingProduct,
        ...buildProductPayload(payload, merchant, owner, existingProduct),
      }

      await writeDb(db)
      return json(res, 200, hydrateProduct(db.products[productIndex], db))
    }

    if (
      req.method === 'DELETE' &&
      matchesPath(url, '/merchants/by-owner') &&
      url.pathname.includes('/products/')
    ) {
      const parts = url.pathname.split('/')
      const ownerId = parts[3] || ''
      const productId = parts[5] || ''
      const db = await readDb()
      const merchant = (db.merchants || []).find((record) => record.ownerId === ownerId)
      if (!merchant) return notFound(res, 'Merchant profile not found.')

      const before = db.products.length
      db.products = db.products.filter(
        (record) => !(record.id === productId && record.merchantId === merchant.id),
      )
      if (db.products.length === before)
        return notFound(res, 'Product not found for this merchant.')

      await writeDb(db)
      return noContent(res)
    }

    if (req.method === 'GET' && url.pathname === '/admin/products/pending') {
      const db = await readDb()
      const pendingProducts = listProducts(db).filter((product) => product.status === 'pending')
      return json(res, 200, pendingProducts)
    }

    if (
      req.method === 'PATCH' &&
      matchesPath(url, '/admin/products') &&
      url.pathname.endsWith('/status')
    ) {
      const db = await readDb()
      const productId = url.pathname.split('/')[3] || ''
      const payload = (await readBody(req)) || {}
      const nextStatus = normalizeStatus(payload.status, '')
      if (!nextStatus) {
        return badRequest(res, 'A valid status is required.')
      }

      const product = (db.products || []).find((record) => record.id === productId)
      if (!product) {
        return notFound(res, 'Product not found.')
      }

      product.status = nextStatus
      await writeDb(db)
      return json(res, 200, hydrateProduct(product, db))
    }

    if (req.method === 'GET' && url.pathname === '/admin/dashboard-analytics') {
      const db = await readDb()
      return json(
        res,
        200,
        db.adminDashboardAnalytics || {
          marketplaceMomentum: { labels: [], series: [] },
        },
      )
    }

    if (req.method === 'GET' && url.pathname === '/admin/insights') {
      const db = await readDb()
      return json(
        res,
        200,
        db.adminInsights || {
          stockCounts: { inStock: 0, lowStock: 0, outOfStock: 0, featured: 0 },
          uniqueMerchantsWithInquiries: 0,
          merchantDemandRate: 0,
          pendingMerchants: [],
          recentInquiries: [],
          latestAccounts: [],
          topArea: null,
          topCategory: null,
          executiveMetrics: [],
          stockHealth: [],
          demandMetrics: [],
          areaPerformance: [],
          merchantPerformance: [],
          demandProducts: [],
          categoryMix: [],
        },
      )
    }

    if (req.method === 'GET' && url.pathname === '/admin/summary') {
      const db = await readDb()
      const merchants = listMerchants(db)
      return json(res, 200, {
        totalUsers: (db.users || []).length,
        totalMerchants: merchants.length,
        verifiedMerchants: merchants.filter((merchant) => merchant.verified).length,
        totalProducts: (db.products || []).length,
        totalInquiries: (db.inquiries || []).length,
        latestMerchants: [...merchants].reverse().slice(0, 4),
      })
    }

    if (req.method === 'GET' && url.pathname === '/admin/users') {
      const role = String(url.searchParams.get('role') || '').trim()
      const db = await readDb()
      return json(res, 200, role ? db.users.filter((user) => user.role === role) : db.users)
    }

    if (
      req.method === 'PATCH' &&
      matchesPath(url, '/admin/merchants') &&
      url.pathname.endsWith('/verification')
    ) {
      const merchantId = url.pathname.split('/')[3] || ''
      const payload = (await readBody(req)) || {}
      const db = await readDb()
      const merchant = (db.merchants || []).find((record) => record.id === merchantId)
      if (!merchant) {
        return notFound(res, 'Merchant not found.')
      }

      merchant.verified = Boolean(payload.verified)
      await writeDb(db)
      return json(res, 200, hydrateMerchant(merchant))
    }

    return notFound(res)
  } catch (err) {
    json(res, 500, { message: err instanceof Error ? err.message : 'Server error.' })
  }
})

server.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`)
})
