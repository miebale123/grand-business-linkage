import { initialDatabase } from '@/mock/data'
import type {
  InquiryRecord,
  LoginPayload,
  MerchantRecord,
  MockDatabase,
  ProductPayload,
  ProductRecord,
  RegisterPayload,
  Role,
  UserRecord,
} from '@/types'

const DB_KEY = 'business-linkage-db'

function sleep(ms = 320) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function loadDatabase(): MockDatabase {
  const raw = window.localStorage.getItem(DB_KEY)
  if (!raw) {
    const seeded = clone(initialDatabase)
    window.localStorage.setItem(DB_KEY, JSON.stringify(seeded))
    return seeded
  }

  return JSON.parse(raw) as MockDatabase
}

function saveDatabase(db: MockDatabase) {
  window.localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function findMerchantByOwner(db: MockDatabase, ownerId: string) {
  return db.merchants.find((merchant) => merchant.ownerId === ownerId)
}

export async function login(payload: LoginPayload): Promise<UserRecord> {
  await sleep()
  const db = loadDatabase()
  const user = db.users.find(
    (record) => record.email.toLowerCase() === payload.email.toLowerCase().trim(),
  )

  if (!user || user.password !== payload.password) {
    throw new Error('Invalid email or password.')
  }

  return clone(user)
}

export async function register(payload: RegisterPayload): Promise<UserRecord> {
  await sleep()
  const db = loadDatabase()
  const email = payload.email.toLowerCase().trim()

  if (db.users.some((record) => record.email.toLowerCase() === email)) {
    throw new Error('An account with this email already exists.')
  }

  const user: UserRecord = {
    id: makeId('user'),
    name: payload.name.trim(),
    email,
    password: payload.password,
    role: payload.role,
    businessName: payload.businessName?.trim(),
    location: payload.location?.trim(),
  }

  db.users.push(user)

  if (payload.role === 'merchant') {
    const merchant: MerchantRecord = {
      id: makeId('merchant'),
      ownerId: user.id,
      businessName: payload.businessName?.trim() || `${payload.name.trim()} Store`,
      category: 'General Merchant',
      location: payload.location?.trim() || 'Location pending',
      description:
        'New merchant profile created during MVP testing. Business description can be refined later.',
      verified: false,
    }

    db.merchants.push(merchant)
  }

  saveDatabase(db)

  return clone(user)
}

export async function fetchProducts(filters?: {
  search?: string
  category?: string
  availability?: string
}): Promise<ProductRecord[]> {
  await sleep(220)
  const db = loadDatabase()
  let products = [...db.products]

  if (filters?.search) {
    const query = filters.search.toLowerCase().trim()
    products = products.filter((product) =>
      [product.name, product.shortDescription, product.description, product.category].some((text) =>
        text.toLowerCase().includes(query),
      ),
    )
  }

  if (filters?.category && filters.category !== 'All') {
    products = products.filter((product) => product.category === filters.category)
  }

  if (filters?.availability && filters.availability !== 'All') {
    products = products.filter((product) => product.availability === filters.availability)
  }

  return clone(products)
}

export async function fetchFeaturedProducts() {
  await sleep(180)
  const db = loadDatabase()
  return clone(db.products.filter((product) => product.featured))
}

export async function fetchProductById(productId: string) {
  await sleep(180)
  const db = loadDatabase()
  const product = db.products.find((record) => record.id === productId)
  if (!product) {
    throw new Error('Product not found.')
  }
  return clone(product)
}

export async function fetchMerchantById(merchantId: string) {
  await sleep(180)
  const db = loadDatabase()
  const merchant = db.merchants.find((record) => record.id === merchantId)
  if (!merchant) {
    throw new Error('Merchant not found.')
  }
  return clone(merchant)
}

export async function fetchMerchants() {
  await sleep(180)
  const db = loadDatabase()
  return clone(db.merchants)
}

export async function fetchMerchantByOwner(ownerId: string) {
  await sleep(180)
  const db = loadDatabase()
  const merchant = findMerchantByOwner(db, ownerId)
  if (!merchant) {
    throw new Error('Merchant profile not found.')
  }
  return clone(merchant)
}

export async function fetchMerchantProducts(merchantId: string) {
  await sleep(220)
  const db = loadDatabase()
  return clone(db.products.filter((product) => product.merchantId === merchantId))
}

export async function createInquiry(payload: {
  productId: string
  merchantId: string
  userId: string
  customerName: string
  message: string
}) {
  await sleep()
  const db = loadDatabase()

  const inquiry: InquiryRecord = {
    id: makeId('inquiry'),
    productId: payload.productId,
    merchantId: payload.merchantId,
    userId: payload.userId,
    customerName: payload.customerName,
    message: payload.message.trim(),
    createdAt: new Date().toISOString(),
  }

  db.inquiries.unshift(inquiry)
  saveDatabase(db)

  return clone(inquiry)
}

export async function fetchMerchantInquiries(ownerId: string) {
  await sleep(180)
  const db = loadDatabase()
  const merchant = findMerchantByOwner(db, ownerId)
  if (!merchant) {
    return []
  }

  return clone(db.inquiries.filter((inquiry) => inquiry.merchantId === merchant.id))
}

export async function saveMerchantProduct(ownerId: string, payload: ProductPayload, productId?: string) {
  await sleep()
  const db = loadDatabase()
  const merchant = findMerchantByOwner(db, ownerId)

  if (!merchant) {
    throw new Error('Merchant profile not found.')
  }

  if (productId) {
    const product = db.products.find((record) => record.id === productId && record.merchantId === merchant.id)
    if (!product) {
      throw new Error('Product not found for this merchant.')
    }

    Object.assign(product, payload)
    saveDatabase(db)
    return clone(product)
  }

  const product: ProductRecord = {
    id: makeId('product'),
    merchantId: merchant.id,
    ...payload,
  }

  db.products.unshift(product)
  saveDatabase(db)
  return clone(product)
}

export async function deleteMerchantProduct(ownerId: string, productId: string) {
  await sleep(200)
  const db = loadDatabase()
  const merchant = findMerchantByOwner(db, ownerId)

  if (!merchant) {
    throw new Error('Merchant profile not found.')
  }

  db.products = db.products.filter(
    (product) => !(product.id === productId && product.merchantId === merchant.id),
  )
  saveDatabase(db)
}

export async function fetchAdminSummary() {
  await sleep(240)
  const db = loadDatabase()

  return {
    totalUsers: db.users.filter((user) => user.role === 'user').length,
    totalMerchants: db.merchants.length,
    verifiedMerchants: db.merchants.filter((merchant) => merchant.verified).length,
    totalProducts: db.products.length,
    totalInquiries: db.inquiries.length,
    latestMerchants: clone(db.merchants.slice(-4).reverse()),
  }
}

export async function fetchUsersByRole(role?: Role) {
  await sleep(180)
  const db = loadDatabase()
  if (!role) {
    return clone(db.users)
  }
  return clone(db.users.filter((user) => user.role === role))
}

export async function fetchMerchantCatalog(merchantId: string) {
  await sleep(180)
  const db = loadDatabase()
  return clone(db.products.filter((product) => product.merchantId === merchantId))
}
