export type Role = 'user' | 'merchant' | 'admin'

export type Coordinates = {
  lat: number
  lng: number
}

export type ProductAvailability = 'In Stock' | 'Low Stock' | 'Out of Stock'

export type UserRecord = {
  id: string
  name: string
  email: string
  role: Role
  password: string
  businessName?: string
  phone?: string
  location?: string
  faydaPhoto?: string
  tradeLicensePhoto?: string
}

export type MerchantRecord = {
  id: string
  ownerId: string
  businessName: string
  category: string
  location: string
  area: string
  city: string
  coordinates: Coordinates
  deliveryAreas: string[]
  description: string
  verified: boolean
}

export type ProductRecord = {
  id: string
  merchantId: string
  name: string
  category: string
  price: number
  availability: ProductAvailability
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

export type CatalogMetadata = {
  categories: string[]
  availabilityOptions: ProductAvailability[]
}

export type AnalyticsSeries = {
  name: string
  color: string
  data: number[]
  fill?: string
}

export type AnalyticsChart = {
  labels: string[]
  series: AnalyticsSeries[]
}

export type MerchantDashboardAnalytics = {
  reach: AnalyticsChart
  demand: AnalyticsChart
}

export type AdminDashboardAnalytics = {
  marketplaceMomentum: AnalyticsChart
  supplyReadiness: AnalyticsChart
}

export type AdminSummary = {
  totalUsers: number
  totalMerchants: number
  verifiedMerchants: number
  totalProducts: number
  totalInquiries: number
  latestMerchants: MerchantRecord[]
}

export type AdminStockCounts = {
  inStock: number
  lowStock: number
  outOfStock: number
  featured: number
}

export type AdminMetric = {
  label: string
  value: string | number
  detail: string
}

export type AdminStockHealthItem = {
  label: string
  count: number
  percent: number
  tone: string
  detail: string
}

export type AdminCategoryMixItem = {
  category: string
  count: number
  share: number
}

export type AdminAreaPerformance = MarketplaceAreaRecord & {
  inquiryCount: number
  verificationRate: number
  demandRate: number
}

export type AdminMerchantPerformance = {
  merchant: MerchantRecord
  listingCount: number
  inStockCount: number
  featuredCount: number
  inquiryCount: number
}

export type AdminDemandProduct = {
  product: ProductRecord
  merchant?: MerchantRecord
  inquiryCount: number
}

export type AdminInsights = {
  stockCounts: AdminStockCounts
  uniqueMerchantsWithInquiries: number
  merchantDemandRate: number
  pendingMerchants: MerchantRecord[]
  recentInquiries: InquiryRecord[]
  latestAccounts: UserRecord[]
  topArea: AdminAreaPerformance | null
  topCategory: AdminCategoryMixItem | null
  executiveMetrics: AdminMetric[]
  stockHealth: AdminStockHealthItem[]
  demandMetrics: AdminMetric[]
  areaPerformance: AdminAreaPerformance[]
  merchantPerformance: AdminMerchantPerformance[]
  demandProducts: AdminDemandProduct[]
  categoryMix: AdminCategoryMixItem[]
}

export type MarketplaceAreaRecord = {
  area: string
  city: string
  merchantCount: number
  productCount: number
}

export type LoginPayload = {
  email: string
  password: string
}

export type AuthToken = string

export type LoginResponse = {
  token: AuthToken
}

export type RegisterResponse = {
  token: AuthToken
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  role: Role
  businessName?: string
  phone?: string
  location?: string
  faydaPhoto?: string
  tradeLicensePhoto?: string
}

export type ProductPayload = Omit<ProductRecord, 'id' | 'merchantId'>
