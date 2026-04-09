import type { ApiClient } from '@/shared/api/contracts'
import { httpClient } from '@/shared/api/httpClient'

export const apiClient: ApiClient = httpClient

export const apiProvider = import.meta.env.DEV ? 'mock-server' : 'http-client'
