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

async function readErrorMessage(response: Response) {
  const text = await response.text()

  if (!text) {
    return response.statusText || 'Request failed.'
  }

  try {
    const parsed = JSON.parse(text) as { message?: string }
    if (typeof parsed?.message === 'string' && parsed.message.trim()) {
      return parsed.message
    }
  } catch {
    // Fall through to the raw response text.
  }

  return text
}

function withQuery(path: string, params?: Record<string, string | number | undefined>) {
  if (!params) {
    return path
  }

  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return
    }

    search.set(key, String(value))
  })

  const query = search.toString()
  return query ? `${path}?${query}` : path
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

function withAuth(headers: HeadersInit | undefined, token: AuthToken) {
  const next = new Headers(headers)
  next.set('Authorization', `Bearer ${token}`)
  return next
}

function productsPath(filters?: ProductFilters) {
  return withQuery('/products', {
    search: filters?.search,
    category: filters?.category && filters.category !== 'All' ? filters.category : undefined,
    availability:
      filters?.availability && filters.availability !== 'All' ? filters.availability : undefined,
    area: filters?.area && filters.area !== 'All Areas' ? filters.area : undefined,
    radiusKm: filters?.radiusKm,
  })
}

function merchantsByAreaPath(area: string, options?: MerchantAreaOptions) {
  return withQuery('/marketplace/merchants/by-area', {
    area,
    limit: options?.limit,
    excludeMerchantId: options?.excludeMerchantId,
  })
}

export const httpClient: ApiClient = {
  login(payload) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getCurrentUser(token) {
    return request('/auth/me', token ? {
      headers: withAuth(undefined, token),
    } : undefined)
  },

  fetchCatalogMetadata() {
    return request('/catalog/metadata')
  },

  fetchProducts(filters) {
    return request(productsPath(filters))
  },

  fetchFeaturedProducts() {
    return request('/products/featured')
  },

  fetchProductById(productId) {
    return request(`/products/${encodeURIComponent(productId)}`)
  },

  fetchMerchantById(merchantId) {
    return request(`/merchants/${encodeURIComponent(merchantId)}`)
  },

  fetchMerchants() {
    return request('/merchants')
  },

  fetchMarketplaceAreas() {
    return request('/marketplace/areas')
  },

  fetchMerchantByOwner(ownerId) {
    return request(`/merchants/by-owner/${encodeURIComponent(ownerId)}`)
  },

  fetchMerchantProducts(merchantId) {
    return request(`/merchants/${encodeURIComponent(merchantId)}/products`)
  },

  createInquiry(payload) {
    return request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  fetchMerchantInquiries(ownerId) {
    return request(`/merchants/by-owner/${encodeURIComponent(ownerId)}/inquiries`)
  },

  fetchMerchantDashboardAnalytics(ownerId) {
    return request(`/merchants/by-owner/${encodeURIComponent(ownerId)}/dashboard-analytics`)
  },

  fetchPlatformInquiries() {
    return request('/inquiries')
  },

  saveMerchantProduct(ownerId, payload, productId) {
    if (productId) {
      return request(`/merchants/by-owner/${encodeURIComponent(ownerId)}/products/${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    }

    return request(`/merchants/by-owner/${encodeURIComponent(ownerId)}/products`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  deleteMerchantProduct(ownerId, productId) {
    return request(`/merchants/by-owner/${encodeURIComponent(ownerId)}/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    })
  },

  fetchAdminSummary() {
    return request('/admin/summary')
  },

  fetchAdminDashboardAnalytics() {
    return request('/admin/dashboard-analytics')
  },

  fetchAdminInsights() {
    return request('/admin/insights')
  },

  fetchUsersByRole(role) {
    return request(withQuery('/admin/users', { role }))
  },

  fetchMerchantCatalog(merchantId) {
    return request(`/merchants/${encodeURIComponent(merchantId)}/catalog`)
  },

  fetchMerchantsByArea(area, options) {
    return request(merchantsByAreaPath(area, options))
  },
}
