export type Role = 'user' | 'merchant' | 'basic_merchant' | 'admin'

export type Coordinates = {
  lat: number
  lng: number
}

export type ProductAvailability = 'In Stock' | 'Low Stock' | 'Out of Stock'
export type ProductStatus = 'pending' | 'approved' | 'rejected'
export type ProductCondition = 'New' | 'Used'
export type ListingType = 'For Sale' | 'For Rent'

export type UserRecord = {
  id: string
  name: string
  email: string
  role: Role
  roles?: Role[]
  verificationRequestStatus?: 'pending' | 'approved' | 'rejected'
  verificationRequestedAt?: string
  password: string
  businessName?: string
  phone?: string
  location?: string
  merchantLicenseId?: string
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
  verificationLevel?: 'verified' | 'pending'
}

export type ProductRecord = {
  id: string
  merchantId: string
  name: string
  category: string
  price: number
  salePrice?: number
  availability: ProductAvailability
  shortDescription: string
  description: string
  image: string
  images: string[]
  condition: ProductCondition
  listingType: ListingType
  location: string
  phone: string
  createdAt: string
  status: ProductStatus
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
  listingTypes: ListingType[]
}

export type MarketplaceAreaRecord = {
  area: string
  city: string
  merchantCount: number
  productCount: number
}

export type SortOption = {
  value: string
  label: string
}

export type SearchTag = {
  term: string
  label: string
}

export type SellerWorkflowRules = {
  verifiedReviewPolicy: string
  standardReviewPolicy: string
  verifiedSubmissionStatus: string
  pendingSubmissionStatus: string
  verifiedSubmissionCopy: string
  pendingSubmissionCopy: string
}

export type MerchantOnboardingDefaults = {
  defaultCategory: string
  defaultCity: string
  defaultDescription: string
}

export type MarketplaceConfig = {
  defaultArea: string
  popularSearchTags: SearchTag[]
  sortOptions: SortOption[]
  sellerWorkflowRules: SellerWorkflowRules
  merchantOnboardingDefaults: MerchantOnboardingDefaults
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

export type VerificationRequestPayload = {
  phone?: string
  businessName?: string
  location?: string
  merchantLicenseId?: string
  faydaPhoto?: string
  tradeLicensePhoto?: string
}

export type ProductPayload = Omit<ProductRecord, 'id' | 'merchantId' | 'status'>
