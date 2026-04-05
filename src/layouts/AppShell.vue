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
      { label: 'Home', to: '/' },
      { label: 'Marketplace', to: '/user' },
      { label: 'Login', to: '/login' },
      { label: 'Register', to: '/register' },
    ]
  }

  if (auth.user.role === 'merchant') {
    return [
      { label: 'Seller Hub', to: '/merchant' },
      { label: 'Catalog', to: '/merchant/products/new' },
    ]
  }

  if (auth.user.role === 'admin') {
    return [{ label: 'Admin Overview', to: '/admin' }]
  }

  return [{ label: 'Marketplace', to: '/user' }]
})

const featuredLinks = computed(() => {
  if (auth.user?.role === 'merchant') {
    return [
      { label: 'Catalog insights', to: '/merchant' },
      { label: 'Add listing', to: '/merchant/products/new' },
    ]
  }

  if (auth.user?.role === 'admin') {
    return [{ label: 'Platform view', to: '/admin' }]
  }

  return [
    { label: 'Browse categories', to: '/user' },
    { label: 'Featured merchants', to: '/user' },
  ]
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
      <header class="panel shell-header">
        <div class="inline" style="justify-content: space-between; align-items: flex-start">
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

        <div class="shell-toolbar">
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

        <div class="shell-subnav">
          <div class="shell-subnav-copy">
            <strong>Multi-merchant marketplace</strong>
            <span class="muted">
              Search across businesses, compare listings, and go directly from discovery to inquiry.
            </span>
          </div>

          <div class="inline">
            <RouterLink
              v-for="item in featuredLinks"
              :key="item.label"
              class="tag"
              :to="item.to"
            >
              {{ item.label }}
            </RouterLink>
          </div>
        </div>
      </header>

      <slot />

      <footer class="panel shell-footer">
        <div class="footer-grid">
          <div class="stack" style="gap: 8px">
            <strong>Business Linkage</strong>
            <span class="muted">
              Marketplace MVP focused on product discovery, merchant visibility, and direct inquiry.
            </span>
          </div>

          <div class="stack" style="gap: 8px">
            <strong>Explore</strong>
            <RouterLink to="/user" class="muted">Marketplace search</RouterLink>
            <RouterLink to="/" class="muted">Featured products</RouterLink>
          </div>

          <div class="stack" style="gap: 8px">
            <strong>Merchant</strong>
            <RouterLink to="/merchant" class="muted">Seller hub</RouterLink>
            <RouterLink to="/merchant/products/new" class="muted">Create listing</RouterLink>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
