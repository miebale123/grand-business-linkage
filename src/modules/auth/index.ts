import { apiClient, apiProvider } from '@/shared/api/api'

import { createAuth, createLocalStorageAdapter, type AuthApi } from './createAuth'

const TOKEN_KEY = 'business-linkage-token'

const authApi: AuthApi = {
  login: (payload) => apiClient.login(payload),
  register: (payload) => apiClient.register(payload),
  getCurrentUser: (token) => apiClient.getCurrentUser(token),
}

const authModule = createAuth({
  api: authApi,
  storage: apiProvider === 'mock-server' ? createLocalStorageAdapter(TOKEN_KEY) : null,
})

export const { useAuthStore, useAuthorization } = authModule

export { createAuth }
export { createLocalStorageAdapter }
export type { AuthApi, AuthStorage } from './createAuth'
