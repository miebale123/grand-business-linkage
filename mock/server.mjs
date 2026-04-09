import http from 'node:http'
import crypto from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, 'db.json')
const PORT = 3001

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function makeToken(userId) {
  return `mock.${userId}`
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
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
  return url.pathname === prefix || url.pathname.startsWith(prefix + '/')
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost')

    if (req.method === 'OPTIONS') {
      return noContent(res)
    }

    // Auth
    if (req.method === 'POST' && url.pathname === '/auth/login') {
      const payload = (await readBody(req)) || {}
      const email = normalizeText(payload.email)
      const password = String(payload.password || '')
      const db = await readDb()

      const user = db.users.find((record) => normalizeText(record.email) === email)
      if (!user || user.password !== password) {
        return unauthorized(res, 'Invalid email or password.')
      }

      return json(res, 200, { token: makeToken(user.id) })
    }

    if (req.method === 'GET' && url.pathname === '/auth/me') {
      const userId = getUserIdFromAuth(req)
      if (!userId) return unauthorized(res)

      const db = await readDb()
      const user = db.users.find((record) => record.id === userId)
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
      const existing = db.users.find((record) => normalizeText(record.email) === email)
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
        const existingMerchant = db.merchants.find((record) => record.ownerId === user.id)
        if (!existingMerchant) {
          const area = String(user.location || 'Addis Ababa').split(',')[0]?.trim() || 'Addis Ababa'
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
      }

      await writeDb(db)
      return json(res, 200, { token: makeToken(user.id) })
    }

    // Catalog
    if (req.method === 'GET' && url.pathname === '/catalog/metadata') {
      const db = await readDb()
      return json(res, 200, db.catalogMetadata || { categories: [], availabilityOptions: [] })
    }

    // Products
    if (req.method === 'GET' && url.pathname === '/products/featured') {
      const db = await readDb()
      return json(res, 200, db.products.filter((product) => product.featured))
    }

    if (req.method === 'GET' && url.pathname === '/products') {
      const db = await readDb()
      const search = String(url.searchParams.get('search') || '').trim()
      const category = String(url.searchParams.get('category') || '').trim()
      const availability = String(url.searchParams.get('availability') || '').trim()
      const area = String(url.searchParams.get('area') || '').trim()
      const merchantById = Object.fromEntries(db.merchants.map((merchant) => [merchant.id, merchant]))

      const products = db.products.filter((product) => {
        const merchant = merchantById[product.merchantId]

        if (search) {
          const matchesSearch =
            includesText(product.name, search) ||
            includesText(product.category, search) ||
            includesText(product.shortDescription, search) ||
            includesText(product.description, search) ||
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

        return true
      })

      return json(res, 200, products)
    }

    if (req.method === 'GET' && matchesPath(url, '/products')) {
      const [, , productId] = url.pathname.split('/')
      if (!productId) return notFound(res)
      const db = await readDb()
      const product = db.products.find((record) => record.id === productId)
      if (!product) return notFound(res, 'Product not found.')
      return json(res, 200, product)
    }

    // Merchants
    if (req.method === 'GET' && url.pathname === '/merchants') {
      const db = await readDb()
      return json(res, 200, db.merchants)
    }

    if (req.method === 'GET' && matchesPath(url, '/merchants/by-owner')) {
      const ownerId = url.pathname.split('/')[3] || ''
      const db = await readDb()
      const merchant = db.merchants.find((record) => record.ownerId === ownerId)
      if (!merchant) return notFound(res, 'Merchant profile not found.')
      return json(res, 200, merchant)
    }

    if (req.method === 'GET' && matchesPath(url, '/merchants')) {
      const [, , merchantId, sub] = url.pathname.split('/')
      if (!merchantId) return notFound(res)
      const db = await readDb()

      if (sub === 'products' || sub === 'catalog') {
        return json(res, 200, db.products.filter((product) => product.merchantId === merchantId))
      }

      const merchant = db.merchants.find((record) => record.id === merchantId)
      if (!merchant) return notFound(res, 'Merchant not found.')
      return json(res, 200, merchant)
    }

    // Marketplace
    if (req.method === 'GET' && url.pathname === '/marketplace/areas') {
      const db = await readDb()
      return json(res, 200, db.marketplaceAreas || [])
    }

    if (req.method === 'GET' && url.pathname === '/marketplace/merchants/by-area') {
      const area = String(url.searchParams.get('area') || '').trim()
      const limit = Number(url.searchParams.get('limit') || 0)
      const excludeMerchantId = String(url.searchParams.get('excludeMerchantId') || '').trim()

      const db = await readDb()
      let matches = db.merchants.filter((merchant) => merchant.area === area)
      if (excludeMerchantId) matches = matches.filter((merchant) => merchant.id !== excludeMerchantId)
      if (limit > 0) matches = matches.slice(0, limit)
      return json(res, 200, matches)
    }

    // Inquiries
    if (req.method === 'GET' && url.pathname === '/inquiries') {
      const db = await readDb()
      return json(res, 200, db.inquiries)
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

    if (req.method === 'GET' && matchesPath(url, '/merchants/by-owner') && url.pathname.endsWith('/inquiries')) {
      const ownerId = url.pathname.split('/')[3] || ''
      const db = await readDb()
      const merchant = db.merchants.find((record) => record.ownerId === ownerId)
      if (!merchant) return json(res, 200, [])
      return json(res, 200, db.inquiries.filter((inquiry) => inquiry.merchantId === merchant.id))
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

    // Merchant product writes (owner-scoped)
    if (req.method === 'POST' && matchesPath(url, '/merchants/by-owner') && url.pathname.endsWith('/products')) {
      const ownerId = url.pathname.split('/')[3] || ''
      const payload = (await readBody(req)) || {}
      const db = await readDb()
      const merchant = db.merchants.find((record) => record.ownerId === ownerId)
      if (!merchant) return notFound(res, 'Merchant profile not found.')

      const product = { id: makeId('product'), merchantId: merchant.id, ...payload }
      db.products.unshift(product)
      await writeDb(db)
      return json(res, 200, product)
    }

    if (
      req.method === 'PATCH' &&
      matchesPath(url, '/merchants/by-owner') &&
      url.pathname.includes('/products/')
    ) {
      const parts = url.pathname.split('/')
      const ownerId = parts[3] || ''
      const productId = parts[6] || ''
      const payload = (await readBody(req)) || {}
      const db = await readDb()
      const merchant = db.merchants.find((record) => record.ownerId === ownerId)
      if (!merchant) return notFound(res, 'Merchant profile not found.')

      const product = db.products.find((record) => record.id === productId && record.merchantId === merchant.id)
      if (!product) return notFound(res, 'Product not found for this merchant.')

      Object.assign(product, payload)
      await writeDb(db)
      return json(res, 200, product)
    }

    if (
      req.method === 'DELETE' &&
      matchesPath(url, '/merchants/by-owner') &&
      url.pathname.includes('/products/')
    ) {
      const parts = url.pathname.split('/')
      const ownerId = parts[3] || ''
      const productId = parts[6] || ''
      const db = await readDb()
      const merchant = db.merchants.find((record) => record.ownerId === ownerId)
      if (!merchant) return notFound(res, 'Merchant profile not found.')

      const before = db.products.length
      db.products = db.products.filter((record) => !(record.id === productId && record.merchantId === merchant.id))
      if (db.products.length === before) return notFound(res, 'Product not found for this merchant.')

      await writeDb(db)
      return noContent(res)
    }

    // Admin
    if (req.method === 'GET' && url.pathname === '/admin/dashboard-analytics') {
      const db = await readDb()
      return json(res, 200, db.adminDashboardAnalytics || { marketplaceMomentum: { labels: [], series: [] }, supplyReadiness: { labels: [], series: [] } })
    }

    if (req.method === 'GET' && url.pathname === '/admin/insights') {
      const db = await readDb()
      return json(res, 200, db.adminInsights || {
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
      })
    }

    if (req.method === 'GET' && url.pathname === '/admin/summary') {
      const db = await readDb()
      return json(res, 200, db.adminSummary || {
        totalUsers: 0,
        totalMerchants: 0,
        verifiedMerchants: 0,
        totalProducts: 0,
        totalInquiries: 0,
        latestMerchants: [],
      })
    }

    if (req.method === 'GET' && url.pathname === '/admin/users') {
      const role = String(url.searchParams.get('role') || '').trim()
      const db = await readDb()
      return json(res, 200, role ? db.users.filter((user) => user.role === role) : db.users)
    }

    return notFound(res)
  } catch (err) {
    json(res, 500, { message: err instanceof Error ? err.message : 'Server error.' })
  }
})

server.listen(PORT, () => {
   
  console.log(`Mock API server running at http://localhost:${PORT}`)
})
