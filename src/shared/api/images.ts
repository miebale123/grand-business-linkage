const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export function normalizeImageUrl(url?: string): string {
  if (!url) return ''
  if (url.startsWith('data:')) return url
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}