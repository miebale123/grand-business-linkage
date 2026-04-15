import type {
  AdminDashboardAnalytics,
  AdminInsights,
  AdminSummary,
  AuthToken,
  CatalogMetadata,
  InquiryRecord,
  LoginResponse,
  LoginPayload,
  MarketplaceAreaRecord,
  MerchantDashboardAnalytics,
  ProductCondition,
  MerchantRecord,
  ProductPayload,
  ProductRecord,
  ProductStatus,
  RegisterPayload,
  RegisterResponse,
  Role,
  UserRecord,
} from '@/shared/types'

export type ProductFilters = {
  search?: string
  category?: string
  availability?: string
  area?: string
  minPrice?: number
  maxPrice?: number
  condition?: ProductCondition
  status?: ProductStatus
  page?: number
  pageSize?: number
  merchantId?: string
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest'
}

export type MerchantAreaOptions = {
  limit?: number
  excludeMerchantId?: string
}

export type InquiryPayload = {
  productId: string
  merchantId: string
  userId: string
  customerName: string
  message: string
}

export type ApiClient = {
  login(payload: LoginPayload): Promise<LoginResponse>
  register(payload: RegisterPayload): Promise<RegisterResponse>
  getCurrentUser(token?: AuthToken): Promise<UserRecord>
  fetchCatalogMetadata(): Promise<CatalogMetadata>
  fetchProducts(filters?: ProductFilters): Promise<ProductRecord[]>
  fetchPendingProducts(): Promise<ProductRecord[]>
  fetchFeaturedProducts(): Promise<ProductRecord[]>
  fetchProductById(productId: string): Promise<ProductRecord>
  fetchMerchantById(merchantId: string): Promise<MerchantRecord>
  fetchMerchants(): Promise<MerchantRecord[]>
  fetchMarketplaceAreas(): Promise<MarketplaceAreaRecord[]>
  fetchMerchantByOwner(ownerId: string): Promise<MerchantRecord>
  fetchMerchantProducts(merchantId: string): Promise<ProductRecord[]>
  createInquiry(payload: InquiryPayload): Promise<InquiryRecord>
  fetchMerchantInquiries(ownerId: string): Promise<InquiryRecord[]>
  fetchMerchantDashboardAnalytics(ownerId: string): Promise<MerchantDashboardAnalytics>
  fetchPlatformInquiries(): Promise<InquiryRecord[]>
  saveMerchantProduct(
    ownerId: string,
    payload: ProductPayload,
    productId?: string,
  ): Promise<ProductRecord>
  deleteMerchantProduct(ownerId: string, productId: string): Promise<void>
  updateProductStatus(productId: string, status: ProductStatus): Promise<ProductRecord>
  fetchAdminSummary(): Promise<AdminSummary>
  fetchAdminDashboardAnalytics(): Promise<AdminDashboardAnalytics>
  fetchAdminInsights(): Promise<AdminInsights>
  fetchUsersByRole(role?: Role): Promise<UserRecord[]>
  fetchMerchantCatalog(merchantId: string): Promise<ProductRecord[]>
  fetchMerchantsByArea(area: string, options?: MerchantAreaOptions): Promise<MerchantRecord[]>
  updateMerchantVerification(merchantId: string, verified: boolean): Promise<MerchantRecord>
  uploadImage(file: File): Promise<string>
}
