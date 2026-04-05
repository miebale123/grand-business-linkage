export type Role = 'user' | 'merchant' | 'admin'

export type UserRecord = {
  id: string
  name: string
  email: string
  role: Role
  password: string
  businessName?: string
  location?: string
}

export type MerchantRecord = {
  id: string
  ownerId: string
  businessName: string
  category: string
  location: string
  description: string
  verified: boolean
}

export type ProductRecord = {
  id: string
  merchantId: string
  name: string
  category: string
  price: number
  availability: 'In Stock' | 'Low Stock' | 'Out of Stock'
  shortDescription: string
  description: string
  image: string
  featured: boolean
}

export type InquiryRecord = {
  id: string
  productId: string
  merchantId: string
  userId: string
  customerName: string
  message: string
  createdAt: string
}

export type DashboardMetric = {
  label: string
  value: string
  detail: string
}

export type MockDatabase = {
  users: UserRecord[]
  merchants: MerchantRecord[]
  products: ProductRecord[]
  inquiries: InquiryRecord[]
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  role: Role
  businessName?: string
  location?: string
}

export type ProductPayload = Omit<ProductRecord, 'id' | 'merchantId'>
