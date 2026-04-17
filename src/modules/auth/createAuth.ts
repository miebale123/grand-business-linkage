import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { canAccess, getPrimaryRole, hasRole, isAuthenticated } from './access.guards'
import { routeForRole } from './access.redirects'
import type { AccessRequirement } from './access.types'
import type { AuthToken, LoginPayload, RegisterPayload, Role, UserRecord } from '@/shared/types'

export type AuthApi = {
  login(payload: LoginPayload): Promise<{ token?: AuthToken | null } | void>
  register(payload: RegisterPayload): Promise<{ token?: AuthToken | null } | void>
  getCurrentUser(token?: AuthToken): Promise<UserRecord>
  logout?(token?: AuthToken): Promise<void>
}

export type AuthStorage = {
  get(): AuthToken
  set(token: AuthToken): void
  clear(): void
}

export function createLocalStorageAdapter(key: string): AuthStorage {
  return {
    get() {
      return window.localStorage.getItem(key) || ''
    },
    set(token) {
      window.localStorage.setItem(key, token)
    },
    clear() {
      window.localStorage.removeItem(key)
    },
  }
}

type CreateAuthOptions = {
  api: AuthApi
  storage?: AuthStorage | null
}

export function createAuth({ api, storage = null }: CreateAuthOptions) {
  const useAuthStore = defineStore('auth', () => {
    const token = ref<AuthToken>(storage?.get() || '')
    const user = ref<UserRecord | null>(null)
    const loading = ref(false)
    const error = ref('')
    const ready = ref(false)

    const isAuthenticatedState = computed(() => Boolean(user.value))
    const role = computed<Role | null>(() => getPrimaryRole(user.value))

    function persistToken(nextToken: AuthToken) {
      token.value = nextToken

      if (!storage) {
        return
      }

      if (!nextToken) {
        storage.clear()
        return
      }

      storage.set(nextToken)
    }

    async function hydrate() {
      if (ready.value) {
        return
      }

      ready.value = true

      if (storage && !token.value) {
        user.value = null
        return
      }

      loading.value = true
      error.value = ''

      try {
        user.value = await api.getCurrentUser(token.value || undefined)
      } catch (issue) {
        persistToken('')
        user.value = null
        error.value = issue instanceof Error ? issue.message : 'Session expired.'
      } finally {
        loading.value = false
      }
    }

    async function login(payload: LoginPayload) {
      loading.value = true
      error.value = ''

      try {
        const session = await api.login(payload)
        const nextToken = session?.token?.trim() || ''

        if (storage) {
          persistToken(nextToken)
        } else {
          token.value = nextToken
        }

        user.value = await api.getCurrentUser(nextToken || undefined)
        ready.value = true
        return user.value
      } catch (issue) {
        error.value = issue instanceof Error ? issue.message : 'Login failed.'
        throw issue
      } finally {
        loading.value = false
      }
    }

    async function register(payload: RegisterPayload) {
      loading.value = true
      error.value = ''

      try {
        const session = await api.register(payload)
        const nextToken = session?.token?.trim() || ''

        if (storage) {
          persistToken(nextToken)
        } else {
          token.value = nextToken
        }

        user.value = await api.getCurrentUser(nextToken || undefined)
        ready.value = true
        return user.value
      } catch (issue) {
        error.value = issue instanceof Error ? issue.message : 'Registration failed.'
        throw issue
      } finally {
        loading.value = false
      }
    }

    async function logout() {
      await api.logout?.(token.value || undefined)
      user.value = null
      error.value = ''
      persistToken('')
    }

    return {
      token,
      user,
      loading,
      error,
      ready,
      isAuthenticated: isAuthenticatedState,
      role,
      hydrate,
      login,
      register,
      logout,
    }
  })

  function useAuthorization() {
    const auth = useAuthStore()

    return {
      role: computed(() => auth.role),
      isAuthenticated: computed(() => isAuthenticated(auth.user)),
      homeRoute: computed(() => routeForRole(auth.user)),
      hasRole: (roles: Role | Role[]) => hasRole(auth.user, Array.isArray(roles) ? roles : [roles]),
      canAccess: (access: AccessRequirement) => canAccess(auth.user, access),
    }
  }

  return {
    useAuthStore,
    useAuthorization,
  }
}
