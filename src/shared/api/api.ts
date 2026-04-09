import { apiClient, apiProvider } from '@/shared/api/client'
import { getAreaLabel, getPreferredMarketplaceArea, savePreferredMarketplaceArea } from '@/shared/api/localState'
import type { ApiClient } from '@/shared/api/contracts'

export { apiClient, apiProvider, getAreaLabel, getPreferredMarketplaceArea, savePreferredMarketplaceArea }

export const login: ApiClient['login'] = (...args) => apiClient.login(...args)
export const register: ApiClient['register'] = (...args) => apiClient.register(...args)
export const getCurrentUser: ApiClient['getCurrentUser'] = (...args) => apiClient.getCurrentUser(...args)
export const fetchCatalogMetadata: ApiClient['fetchCatalogMetadata'] = (...args) =>
  apiClient.fetchCatalogMetadata(...args)
export const fetchProducts: ApiClient['fetchProducts'] = (...args) => apiClient.fetchProducts(...args)
export const fetchFeaturedProducts: ApiClient['fetchFeaturedProducts'] = (...args) =>
  apiClient.fetchFeaturedProducts(...args)
export const fetchProductById: ApiClient['fetchProductById'] = (...args) => apiClient.fetchProductById(...args)
export const fetchMerchantById: ApiClient['fetchMerchantById'] = (...args) =>
  apiClient.fetchMerchantById(...args)
export const fetchMerchants: ApiClient['fetchMerchants'] = (...args) => apiClient.fetchMerchants(...args)
export const fetchMarketplaceAreas: ApiClient['fetchMarketplaceAreas'] = (...args) =>
  apiClient.fetchMarketplaceAreas(...args)
export const fetchMerchantByOwner: ApiClient['fetchMerchantByOwner'] = (...args) =>
  apiClient.fetchMerchantByOwner(...args)
export const fetchMerchantProducts: ApiClient['fetchMerchantProducts'] = (...args) =>
  apiClient.fetchMerchantProducts(...args)
export const createInquiry: ApiClient['createInquiry'] = (...args) => apiClient.createInquiry(...args)
export const fetchMerchantInquiries: ApiClient['fetchMerchantInquiries'] = (...args) =>
  apiClient.fetchMerchantInquiries(...args)
export const fetchMerchantDashboardAnalytics: ApiClient['fetchMerchantDashboardAnalytics'] = (...args) =>
  apiClient.fetchMerchantDashboardAnalytics(...args)
export const fetchPlatformInquiries: ApiClient['fetchPlatformInquiries'] = (...args) =>
  apiClient.fetchPlatformInquiries(...args)
export const saveMerchantProduct: ApiClient['saveMerchantProduct'] = (...args) =>
  apiClient.saveMerchantProduct(...args)
export const deleteMerchantProduct: ApiClient['deleteMerchantProduct'] = (...args) =>
  apiClient.deleteMerchantProduct(...args)
export const fetchAdminSummary: ApiClient['fetchAdminSummary'] = (...args) =>
  apiClient.fetchAdminSummary(...args)
export const fetchAdminDashboardAnalytics: ApiClient['fetchAdminDashboardAnalytics'] = (...args) =>
  apiClient.fetchAdminDashboardAnalytics(...args)
export const fetchAdminInsights: ApiClient['fetchAdminInsights'] = (...args) =>
  apiClient.fetchAdminInsights(...args)
export const fetchUsersByRole: ApiClient['fetchUsersByRole'] = (...args) => apiClient.fetchUsersByRole(...args)
export const fetchMerchantCatalog: ApiClient['fetchMerchantCatalog'] = (...args) =>
  apiClient.fetchMerchantCatalog(...args)
export const fetchMerchantsByArea: ApiClient['fetchMerchantsByArea'] = (...args) =>
  apiClient.fetchMerchantsByArea(...args)
