import type { ApiClient, MerchantAreaOptions, ProductFilters } from '@/shared/api/contracts'
import type { AuthToken } from '@/shared/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  if (!text) return response.statusText || 'Request failed.'

  try {
    const parsed = JSON.parse(text) as { message?: string }
    if (typeof parsed?.message === 'string' && parsed.message.trim()) {
      return parsed.message
    }
  } catch { /* fall through */ }

  return text
}

function queryParams(params?: Record<string, string | number | undefined>): string {
  if (!params) return ''
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  return search.toString()
}

function buildPath(path: string, params?: Record<string, string | number | undefined>): string {
  const qs = queryParams(params)
  return qs ? `${path}?${qs}` : path
}

function buildAuth(headers: HeadersInit | undefined, token: AuthToken): Headers {
  const next = new Headers(headers)
  next.set('Authorization', `Bearer ${token}`)
  return next
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  return text ? JSON.parse(text) : (undefined as T)
}

function authedRequest<T>(path: string, token: AuthToken, init?: RequestInit): Promise<T> {
  return request(path, { ...init, headers: buildAuth(init?.headers, token) })
}

const productsFilters = (filters?: ProductFilters) => buildPath('/products', {
  q: filters?.search,
  category: filters?.category && filters.category !== 'All' ? filters.category : undefined,
  availability: filters?.availability && filters.availability !== 'All' ? filters.availability : undefined,
  area: filters?.area && filters.area !== 'All Areas' ? filters.area : undefined,
  minPrice: filters?.minPrice,
  maxPrice: filters?.maxPrice,
  condition: filters?.condition,
  status: filters?.status,
  _page: filters?.page,
  _limit: filters?.pageSize,
  merchantId: filters?.merchantId,
  sortBy: filters?.sortBy,
})

const id = (s: string) => encodeURIComponent(s)

export const httpClient: ApiClient = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getCurrentUser: (token) => token ? authedRequest('/auth/me', token) : request('/auth/me'),

  fetchCatalogMetadata: () => request('/catalog/metadata'),
  fetchMarketplaceConfig: () => request('/marketplace/config'),

  fetchProducts: (filters) => request(productsFilters(filters)),
  fetchPendingProducts: () => request(productsFilters({ status: 'pending' })),
  fetchFeaturedProducts: () => request('/products/featured'),
  fetchProductById: (productId) => request(`/products/${id(productId)}`),

  fetchMerchantById: (merchantId) => request(`/merchants/${id(merchantId)}`),
  fetchMerchants: () => request('/merchants'),
  fetchMarketplaceAreas: () => request('/marketplace/areas'),
  fetchMerchantByOwner: (ownerId) => request(`/merchants/by-owner/${id(ownerId)}`),
  fetchMerchantProducts: (merchantId) => request(`/merchants/${id(merchantId)}/products`),
  fetchMerchantsByArea: (area, options) => request(buildPath('/marketplace/merchants/by-area', { area, limit: options?.limit, excludeMerchantId: options?.excludeMerchantId })),

  createInquiry: (payload) => request('/inquiries', { method: 'POST', body: JSON.stringify(payload) }),
  fetchMerchantInquiries: (ownerId) => request(`/merchants/by-owner/${id(ownerId)}/inquiries`),

  submitMerchantVerificationRequest: (ownerId, payload) =>
    request(`/merchants/by-owner/${id(ownerId)}/verification-request`, { method: 'PATCH', body: JSON.stringify(payload) }),

  saveMerchantProduct: (ownerId, payload, productId) =>
    productId
      ? request(`/merchants/by-owner/${id(ownerId)}/products/${id(productId)}`, { method: 'PATCH', body: JSON.stringify(payload) })
      : request(`/merchants/by-owner/${id(ownerId)}/products`, { method: 'POST', body: JSON.stringify(payload) }),

  deleteMerchantProduct: (ownerId, productId) =>
    request(`/merchants/by-owner/${id(ownerId)}/products/${id(productId)}`, { method: 'DELETE' }),

  updateProductStatus: (productId, status) =>
    request(`/admin/products/${id(productId)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  fetchUsersByRole: (role) => request(buildPath('/admin/users', { role })),
  fetchMerchantCatalog: (merchantId) => request(`/merchants/${id(merchantId)}/catalog`),

  updateMerchantVerification: (merchantId, verified) =>
    request(`/admin/merchants/${id(merchantId)}/verification`, { method: 'PATCH', body: JSON.stringify({ verified }) }),

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file, file.name)

    const token = localStorage.getItem('auth_token')
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', headers, body: formData })
      if (response.ok) {
        const result = (await response.json()) as { url: string; imageUrl?: string }
        return result.url || result.imageUrl || ''
      }
    } catch { /* fall through */ }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  },
}