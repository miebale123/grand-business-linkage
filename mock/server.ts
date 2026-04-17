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

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function makeToken(userId: string): string {
  return `mock.${userId}`
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function includesText(value: unknown, query: unknown): boolean {
  return normalizeText(value).includes(normalizeText(query))
}

interface DbData {
  users: unknown[]
  merchants: unknown[]
  products: unknown[]
  inquiries: unknown[]
  categories?: string[]
  catalogMetadata?: { categories: string[]; availabilityOptions: string[] }
  marketplaceConfig?: Record<string, unknown>
}

async function readDb(): Promise<DbData> {
  const raw = await readFile(DB_PATH, 'utf8')
  const db = JSON.parse(raw) as DbData

  if (synchronizeMarketplaceUsers(db)) {
    await writeDb(db)
  }

  return db
}

async function writeDb(db: DbData): Promise<void> {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2) + '\n', 'utf8')
}

function json(res: http.ServerResponse, status: number, data: unknown): void {
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

function noContent(res: http.ServerResponse): void {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  })
  res.end()
}

function badRequest(res: http.ServerResponse, message: string): void {
  json(res, 400, { message })
}

function unauthorized(res: http.ServerResponse, message = 'Unauthorized.'): void {
  json(res, 401, { message })
}

function notFound(res: http.ServerResponse, message = 'Not found.'): void {
  json(res, 404, { message })
}

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (!chunks.length) return null

  const text = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function getUserIdFromAuth(req: http.IncomingMessage): string {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  if (!token.startsWith('mock.')) return ''
  return token.slice('mock.'.length).trim()
}

function matchesPath(url: URL, prefix: string): boolean {
  return url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
}

function normalizeStatus(value: unknown, fallback = 'pending'): string {
  const next = String(value ?? '').trim()
  return PRODUCT_STATUSES.has(next) ? next : fallback
}

function normalizeCondition(value: unknown): string {
  const next = String(value ?? '').trim()
  return PRODUCT_CONDITIONS.has(next) ? next : 'New'
}

function normalizeAvailability(value: unknown, fallback = 'In Stock'): string {
  const next = String(value ?? '').trim()
  return PRODUCT_AVAILABILITY.has(next) ? next : fallback
}

function normalizeNumber(value: unknown, fallback = 0): number {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry) => String(entry ?? '').trim()).filter(Boolean)
}

interface Merchant {
  id: string
  ownerId: string
  businessName: string
  category: string
  location: string
  area: string
  city: string
  coordinates: { lat: number; lng: number }
  deliveryAreas: string[]
  description: string
  verified: boolean
}

interface User {
  id: string
  name: string
  email: string
  password: string
  role: string
  roles?: string[]
  verificationRequestStatus?: string
  verificationRequestedAt?: string
  businessName?: string
  phone?: string
  location?: string
  merchantLicenseId?: string
  faydaPhoto?: string
  tradeLicensePhoto?: string
}

interface Product {
  id: string
  merchantId: string
  name: string
  category: string
  price: number
  salePrice?: number
  availability: string
  shortDescription: string
  description: string
  image: string
  images: string[]
  featured: boolean
  condition: string
  location: string
  phone: string
  createdAt: string
  status: string
}

interface DbMaps {
  merchantById: Record<string, Merchant>
  userById: Record<string, User>
}

function buildMaps(db: DbData): DbMaps {
  return {
    merchantById: Object.fromEntries(
      ((db.merchants as Merchant[]) || []).map((merchant) => [merchant.id, merchant]),
    ),
    userById: Object.fromEntries(((db.users as User[]) || []).map((user) => [user.id, user])),
  }
}

function hydrateMerchant(merchant: Merchant): Merchant & { verificationLevel: string } {
  return {
    ...merchant,
    verificationLevel: merchant.verified ? 'verified' : 'pending',
  }
}

function getUserRoles(user: User | null | undefined): string[] {
  if (!user) {
    return []
  }

  const roles = new Set(
    [user.role, ...(Array.isArray(user.roles) ? user.roles : [])]
      .map((role) => String(role || '').trim())
      .filter(Boolean),
  )

  return Array.from(roles)
}

function userHasRole(user: User | null | undefined, role: string): boolean {
  return getUserRoles(user).includes(role)
}

function setUserRoles(user: User, roles: string[]): void {
  const nextRoles = Array.from(
    new Set(roles.map((role) => String(role || '').trim()).filter(Boolean)),
  )

  user.roles = nextRoles

  if (nextRoles.includes('admin')) {
    user.role = 'admin'
    return
  }

  if (nextRoles.includes('merchant')) {
    user.role = 'merchant'
    return
  }

  if (nextRoles.includes('basic_merchant')) {
    user.role = 'basic_merchant'
    return
  }

  user.role = nextRoles[0] || 'user'
}

function hydrateProduct(product: Product, db: DbData): Product {
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
    status: normalizeStatus(
      product.status,
      merchant?.verified || userHasRole(owner, 'merchant') ? 'approved' : 'pending',
    ),
  }
}

function listProducts(db: DbData): Product[] {
  return ((db.products as Product[]) || [])
    .map((product) => hydrateProduct(product, db))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
}

function listMerchants(db: DbData): Merchant[] {
  return ((db.merchants as Merchant[]) || []).map((merchant) => merchant)
}

function buildMerchantRecord(user: User, db: DbData): Merchant {
  return {
    id: makeId('merchant'),
    ownerId: user.id,
    businessName: String(user.businessName || '').trim(),
    category: '',
    location: String(user.location || '').trim(),
    area:
      String(user.location || '')
        .split(',')[0]
        ?.trim() || '',
    city: '',
    coordinates: { lat: 9.0222, lng: 38.7468 },
    deliveryAreas: [],
    description: '',
    verified: false,
  }
}

function ensureMerchantForOwner(db: DbData, owner: User | null): Merchant | null {
  if (!owner) {
    return null
  }

  const existingMerchant = ((db.merchants as Merchant[]) || []).find(
    (record) => record.ownerId === owner.id,
  )
  if (existingMerchant) {
    return existingMerchant
  }

  if (!userHasRole(owner, 'basic_merchant') && !userHasRole(owner, 'merchant')) {
    setUserRoles(owner, [...getUserRoles(owner), 'user', 'basic_merchant'])
  }

  const merchant = buildMerchantRecord(owner, db)
  db.merchants.push(merchant)
  return merchant
}

function synchronizeMarketplaceUsers(db: DbData): boolean {
  let changed = false

  for (const user of (db.users as User[]) || []) {
    if (!user || user.role === 'admin' || userHasRole(user, 'admin')) {
      continue
    }

    const previousRole = user.role
    const previousRoles = JSON.stringify(user.roles || [])
    const existingMerchant = ((db.merchants as Merchant[]) || []).find(
      (record) => record.ownerId === user.id,
    )

    if (existingMerchant?.verified) {
      setUserRoles(user, ['user', 'merchant'])
    } else {
      setUserRoles(user, ['user', 'basic_merchant'])
    }

    if (!existingMerchant) {
      db.merchants.push(buildMerchantRecord(user, db))
      changed = true
    } else if (!existingMerchant.verified) {
      const nextBusinessName = String(user.businessName || '').trim()
      const nextLocation = String(user.location || '').trim()
      const nextArea = nextLocation.split(',')[0]?.trim() || ''

      if (existingMerchant.businessName !== nextBusinessName) {
        existingMerchant.businessName = nextBusinessName
        changed = true
      }

      if (existingMerchant.location !== nextLocation) {
        existingMerchant.location = nextLocation
        changed = true
      }

      if (existingMerchant.area !== nextArea) {
        existingMerchant.area = nextArea
        changed = true
      }

      if (existingMerchant.category !== '') {
        existingMerchant.category = ''
        changed = true
      }

      if (existingMerchant.city !== '') {
        existingMerchant.city = ''
        changed = true
      }

      if (existingMerchant.description !== '') {
        existingMerchant.description = ''
        changed = true
      }

      if (existingMerchant.deliveryAreas.length !== 0) {
        existingMerchant.deliveryAreas = []
        changed = true
      }
    }

    if (user.role !== previousRole || JSON.stringify(user.roles || []) !== previousRoles) {
      changed = true
    }
  }

  return changed
}

function buildMarketplaceAreas(db: DbData) {
  const merchantById: Record<string, Merchant> = Object.fromEntries(
    ((db.merchants as Merchant[]) || []).map((merchant) => [merchant.id, merchant]),
  )
  const approvedProducts = listProducts(db).filter((product) => product.status === 'approved')
  const areaMap = new Map<
    string,
    { area: string; city: string; merchantIds: Set<string>; productCount: number }
  >()

  approvedProducts.forEach((product) => {
    const merchant = merchantById[product.merchantId]
    if (!merchant) {
      return
    }

    const entry = areaMap.get(merchant.area) || {
      area: merchant.area,
      city: merchant.city,
      merchantIds: new Set<string>(),
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

interface FilterOptions {
  q?: string
  search?: string
  category?: string
  availability?: string
  area?: string
  merchantId?: string
  condition?: string
  status?: string
  minPrice?: number
  maxPrice?: number
}

function filterProducts(products: Product[], db: DbData, options: FilterOptions = {}): Product[] {
  const merchantById: Record<string, Merchant> = Object.fromEntries(
    ((db.merchants as Merchant[]) || []).map((merchant) => [merchant.id, merchant]),
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

    if (minPrice !== null && Number.isFinite(minPrice) && product.price < minPrice) {
      return false
    }

    if (maxPrice !== null && Number.isFinite(maxPrice) && product.price > maxPrice) {
      return false
    }

    return true
  })
}

function paginateProducts(products: Product[], page: number, pageSize: number): Product[] {
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 0
  const normalizedPageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 0

  if (!normalizedPage || !normalizedPageSize) {
    return products
  }

  const start = (normalizedPage - 1) * normalizedPageSize
  return products.slice(start, start + normalizedPageSize)
}

interface ProductPayload {
  merchantId?: string
  name?: string
  category?: string
  price?: number
  availability?: string
  shortDescription?: string
  description?: string
  image?: string
  images?: unknown[]
  featured?: boolean
  condition?: string
  location?: string
  phone?: string
  createdAt?: string
  status?: string
}

interface VerificationRequestPayload {
  phone?: string
  businessName?: string
  location?: string
  merchantLicenseId?: string
  faydaPhoto?: string
  tradeLicensePhoto?: string
}

function buildProductPayload(
  payload: ProductPayload,
  merchant: Merchant,
  owner: User | null,
  existingProduct?: Product,
): ProductPayload {
  const source: ProductPayload = {
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
      const payload = ((await readBody(req)) as Record<string, unknown>) || {}
      const email = normalizeText(payload.email)
      const password = String(payload.password || '')
      const db = await readDb()

      const user = ((db.users as User[]) || []).find(
        (record) => normalizeText(record.email) === email,
      )
      if (!user || user.password !== password) {
        return unauthorized(res, 'Invalid email or password.')
      }

      return json(res, 200, { token: makeToken(user.id) })
    }

    if (req.method === 'GET' && url.pathname === '/auth/me') {
      const userId = getUserIdFromAuth(req)
      if (!userId) return unauthorized(res)

      const db = await readDb()
      const user = ((db.users as User[]) || []).find((record) => record.id === userId)
      if (!user) return unauthorized(res, 'Invalid session.')

      return json(res, 200, user)
    }

    if (req.method === 'POST' && url.pathname === '/auth/register') {
      const payload = ((await readBody(req)) as Record<string, unknown>) || {}
      const email = normalizeText(payload.email)
      const password = String(payload.password || '')
      const name = String(payload.name || '').trim()

      if (!email || !password || !name) {
        return badRequest(res, 'Missing required fields.')
      }

      const db = await readDb()
      const existing = ((db.users as User[]) || []).find(
        (record) => normalizeText(record.email) === email,
      )
      if (existing) {
        return badRequest(res, 'An account with this email already exists.')
      }

      const role =
        payload.role === 'merchant' || payload.role === 'basic_merchant' || payload.role === 'admin'
          ? String(payload.role)
          : 'user'
      const user: User = {
        id: makeId('user'),
        name,
        email,
        password,
        role,
        businessName: payload.businessName ? String(payload.businessName).trim() : undefined,
        phone: payload.phone ? String(payload.phone).trim() : undefined,
        location: payload.location ? String(payload.location).trim() : undefined,
        merchantLicenseId: payload.merchantLicenseId
          ? String(payload.merchantLicenseId).trim()
          : undefined,
        faydaPhoto: (payload.faydaPhoto as string) || undefined,
        tradeLicensePhoto: (payload.tradeLicensePhoto as string) || undefined,
      }
      if (role === 'admin') {
        setUserRoles(user, ['admin'])
      } else if (role === 'merchant') {
        setUserRoles(user, ['user', 'merchant'])
      } else {
        setUserRoles(user, ['user', 'basic_merchant'])
      }

      db.users.push(user)

      if (role !== 'admin') {
        db.merchants.push(buildMerchantRecord(user, db))
      }

      await writeDb(db)
      return json(res, 200, { token: makeToken(user.id) })
    }

    if (req.method === 'GET' && url.pathname === '/categories') {
      const db = await readDb()
      return json(res, 200, db.categories || [])
    }

    if (req.method === 'GET' && url.pathname === '/catalog/metadata') {
      const db = await readDb()
      return json(
        res,
        200,
        db.catalogMetadata || { categories: db.categories || [], availabilityOptions: [] },
      )
    }

    if (req.method === 'GET' && matchesPath(url, '/products')) {
      const [, , productId] = url.pathname.split('/')
      if (productId) {
        const db = await readDb()
        const product = ((db.products as Product[]) || []).find((record) => record.id === productId)
        if (!product) return notFound(res, 'Product not found.')
        return json(res, 200, hydrateProduct(product, db))
      }
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
        q: url.searchParams.get('q') || undefined,
        category: url.searchParams.get('category') || undefined,
        availability: url.searchParams.get('availability') || undefined,
        area: url.searchParams.get('area') || undefined,
        minPrice: url.searchParams.get('minPrice')
          ? Number(url.searchParams.get('minPrice'))!
          : undefined,
        maxPrice: url.searchParams.get('maxPrice')
          ? Number(url.searchParams.get('maxPrice'))!
          : undefined,
        condition: url.searchParams.get('condition') || undefined,
        status: url.searchParams.get('status') || undefined,
        merchantId: url.searchParams.get('merchantId') || undefined,
      })

      return json(res, 200, paginateProducts(products, page, pageSize))
    }

    if (req.method === 'GET' && url.pathname === '/merchants') {
      const db = await readDb()
      return json(res, 200, listMerchants(db))
    }

    if (req.method === 'GET' && matchesPath(url, '/merchants/by-owner')) {
      const ownerId = url.pathname.split('/')[3] || ''
      const db = await readDb()
      const owner = ((db.users as User[]) || []).find((record) => record.id === ownerId) ?? null
      const merchant = ensureMerchantForOwner(db, owner)
      if (!merchant) return notFound(res, 'Merchant profile not found.')
      await writeDb(db)
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

      const merchant = ((db.merchants as Merchant[]) || []).find(
        (record) => record.id === merchantId,
      )
      if (!merchant) return notFound(res, 'Merchant not found.')
      return json(res, 200, hydrateMerchant(merchant))
    }

    if (req.method === 'GET' && url.pathname === '/marketplace/areas') {
      const db = await readDb()
      return json(res, 200, buildMarketplaceAreas(db))
    }

    if (req.method === 'GET' && url.pathname === '/marketplace/config') {
      const db = await readDb()
      const config = db.marketplaceConfig || {
        defaultArea: 'Addis Ababa',
        popularSearchTags: [],
        sortOptions: [],
        categories: db.categories || [],
        sellerWorkflowRules: {},
        merchantOnboardingDefaults: {},
      }
      return json(res, 200, config)
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
      const payload = ((await readBody(req)) as Record<string, unknown>) || {}
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
      const merchant = ((db.merchants as Merchant[]) || []).find(
        (record) => record.ownerId === ownerId,
      )
      if (!merchant) return json(res, 200, [])
      return json(
        res,
        200,
        ((db.inquiries as Record<string, unknown>[]) || []).filter(
          (inquiry) => inquiry.merchantId === merchant.id,
        ),
      )
    }

    if (
      req.method === 'POST' &&
      matchesPath(url, '/merchants/by-owner') &&
      url.pathname.endsWith('/products')
    ) {
      const ownerId = url.pathname.split('/')[3] || ''
      const payload = ((await readBody(req)) as ProductPayload) || {}
      const db = await readDb()
      const owner = ((db.users as User[]) || []).find((record) => record.id === ownerId) ?? null
      const merchant = ensureMerchantForOwner(db, owner)
      if (!merchant) return notFound(res, 'Merchant profile not found.')

      const product: Product = {
        id: makeId('product'),
        ...buildProductPayload(payload, merchant, owner ?? null),
      } as Product

      db.products.unshift(product)
      await writeDb(db)
      return json(res, 200, hydrateProduct(product, db))
    }

    if (
      req.method === 'PATCH' &&
      matchesPath(url, '/merchants/by-owner') &&
      url.pathname.endsWith('/verification-request')
    ) {
      const ownerId = url.pathname.split('/')[3] || ''
      const payload = ((await readBody(req)) as VerificationRequestPayload) || {}
      const db = await readDb()
      const owner = ((db.users as User[]) || []).find((record) => record.id === ownerId) ?? null
      const merchant = ensureMerchantForOwner(db, owner)

      if (!owner || !merchant) {
        return notFound(res, 'Merchant profile not found.')
      }

      owner.phone = String(payload.phone || owner.phone || '').trim() || undefined
      owner.businessName =
        String(payload.businessName || owner.businessName || '').trim() || undefined
      owner.location = String(payload.location || owner.location || '').trim() || undefined
      owner.merchantLicenseId =
        String(payload.merchantLicenseId || owner.merchantLicenseId || '').trim() || undefined
      owner.faydaPhoto = (payload.faydaPhoto as string) || owner.faydaPhoto || undefined
      owner.tradeLicensePhoto =
        (payload.tradeLicensePhoto as string) || owner.tradeLicensePhoto || undefined
      owner.verificationRequestStatus = 'pending'
      owner.verificationRequestedAt = new Date().toISOString()

      merchant.businessName = owner.businessName || merchant.businessName
      merchant.location = owner.location || merchant.location
      merchant.area =
        String(owner.location || merchant.area)
          .split(',')[0]
          ?.trim() || merchant.area
      merchant.verified = false

      if (!userHasRole(owner, 'basic_merchant') && !userHasRole(owner, 'merchant')) {
        setUserRoles(owner, [...getUserRoles(owner), 'user', 'basic_merchant'])
      }

      await writeDb(db)
      return json(res, 200, owner)
    }

    if (
      req.method === 'PATCH' &&
      matchesPath(url, '/merchants/by-owner') &&
      url.pathname.includes('/products/')
    ) {
      const parts = url.pathname.split('/')
      const ownerId = parts[3] || ''
      const productId = parts[5] || ''
      const payload = ((await readBody(req)) as ProductPayload) || {}
      const db = await readDb()
      const owner = ((db.users as User[]) || []).find((record) => record.id === ownerId) ?? null
      const merchant = ensureMerchantForOwner(db, owner)
      if (!merchant) return notFound(res, 'Merchant profile not found.')

      const productIndex = ((db.products as Product[]) || []).findIndex(
        (record) => record.id === productId && record.merchantId === merchant.id,
      )
      if (productIndex < 0) {
        return notFound(res, 'Product not found for this merchant.')
      }

      const existingProduct = db.products[productIndex] as Product
      db.products[productIndex] = {
        ...existingProduct,
        ...buildProductPayload(payload, merchant, owner ?? null, existingProduct),
      }

      await writeDb(db)
      return json(res, 200, hydrateProduct(db.products[productIndex] as Product, db))
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
      const merchant = ((db.merchants as Merchant[]) || []).find(
        (record) => record.ownerId === ownerId,
      )
      if (!merchant) return notFound(res, 'Merchant profile not found.')

      const before = db.products.length
      db.products = ((db.products as Product[]) || []).filter(
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
      const payload = ((await readBody(req)) as Record<string, unknown>) || {}
      const nextStatus = normalizeStatus(payload.status, '')
      if (!nextStatus) {
        return badRequest(res, 'A valid status is required.')
      }

      const product = ((db.products as Product[]) || []).find((record) => record.id === productId)
      if (!product) {
        return notFound(res, 'Product not found.')
      }

      product.status = nextStatus
      await writeDb(db)
      return json(res, 200, hydrateProduct(product, db))
    }

    if (req.method === 'GET' && url.pathname === '/admin/users') {
      const role = String(url.searchParams.get('role') || '').trim()
      const db = await readDb()
      return json(
        res,
        200,
        role
          ? (db.users as User[]).filter((user) =>
              role === 'merchant'
                ? userHasRole(user, 'merchant') || userHasRole(user, 'basic_merchant')
                : userHasRole(user, role),
            )
          : db.users,
      )
    }

    if (
      req.method === 'PATCH' &&
      matchesPath(url, '/admin/merchants') &&
      url.pathname.endsWith('/verification')
    ) {
      const merchantId = url.pathname.split('/')[3] || ''
      const payload = ((await readBody(req)) as Record<string, unknown>) || {}
      const db = await readDb()
      const merchant = ((db.merchants as Merchant[]) || []).find(
        (record) => record.id === merchantId,
      )
      if (!merchant) {
        return notFound(res, 'Merchant not found.')
      }

      merchant.verified = Boolean(payload.verified)
      const owner = ((db.users as User[]) || []).find((record) => record.id === merchant.ownerId)

      if (owner) {
        const baseRoles = getUserRoles(owner).filter(
          (role) => role !== 'merchant' && role !== 'basic_merchant',
        )
        setUserRoles(
          owner,
          merchant.verified
            ? [...baseRoles, 'user', 'merchant']
            : [...baseRoles, 'user', 'basic_merchant'],
        )
        owner.verificationRequestStatus = merchant.verified ? 'approved' : 'rejected'
      }

      if (merchant.verified) {
        ;((db.products as Product[]) || []).forEach((product) => {
          if (product.merchantId === merchant.id) {
            product.status = 'approved'
          }
        })
      }

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
