<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const navigation = computed(() => {
  if (!auth.user) {
    return [
      { label: 'Overview', to: '/' },
      { label: 'Login', to: '/login' },
      { label: 'Register', to: '/register' },
    ]
  }

  if (auth.user.role === 'merchant') {
    return [
      { label: 'Dashboard', to: '/merchant' },
      { label: 'New Product', to: '/merchant/products/new' },
    ]
  }

  if (auth.user.role === 'admin') {
    return [{ label: 'Admin Overview', to: '/admin' }]
  }

  return [{ label: 'Marketplace', to: '/user' }]
})

const roleLabel = computed(() => {
  if (!auth.user) {
    return 'Guest'
  }

  return auth.user.role.charAt(0).toUpperCase() + auth.user.role.slice(1)
})

async function handleLogout() {
  auth.logout()
  await router.push('/')
}
</script>

<template>
  <div class="shell">
    <div class="container">
      <header class="panel" style="padding: 18px 22px; margin-bottom: 20px">
        <div class="inline" style="justify-content: space-between">
          <div class="stack" style="gap: 4px">
            <RouterLink to="/" style="font-size: 1.15rem; font-weight: 800">
              Business Linkage
            </RouterLink>
            <span class="muted">Purple and white MVP for search, visibility, and inquiry flow</span>
          </div>

          <div class="inline">
            <span class="tag">{{ roleLabel }}</span>
            <span v-if="auth.user" class="tag">{{ auth.user.name }}</span>
          </div>
        </div>

        <div
          class="inline"
          style="justify-content: space-between; margin-top: 16px; align-items: center"
        >
          <nav class="inline">
            <RouterLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              :class="route.path === item.to ? 'button-secondary' : 'button-ghost'"
            >
              {{ item.label }}
            </RouterLink>
          </nav>

          <div class="inline">
            <RouterLink v-if="!auth.user" class="button" to="/login">Try Demo Accounts</RouterLink>
            <button v-else class="button-danger" type="button" @click="handleLogout">Logout</button>
          </div>
        </div>
      </header>

      <slot />
    </div>
  </div>
</template>
