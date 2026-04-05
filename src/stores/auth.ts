import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import * as mockApi from '@/services/mockApi'
import type { LoginPayload, RegisterPayload, Role, UserRecord } from '@/types'

const STORAGE_KEY = 'business-linkage-session'

function restoreSession() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as UserRecord) : null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserRecord | null>(restoreSession())
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => Boolean(user.value))
  const role = computed<Role | null>(() => user.value?.role ?? null)

  function persistSession(record: UserRecord | null) {
    if (!record) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    error.value = ''

    try {
      const record = await mockApi.login(payload)
      user.value = record
      persistSession(record)
      return record
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
      const record = await mockApi.register(payload)
      user.value = record
      persistSession(record)
      return record
    } catch (issue) {
      error.value = issue instanceof Error ? issue.message : 'Registration failed.'
      throw issue
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    error.value = ''
    persistSession(null)
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    role,
    login,
    register,
    logout,
  }
})
