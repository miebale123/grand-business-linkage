<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/modules/auth'

type SidebarLink = {
  label: string
  to: string
  exact?: boolean
}

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const sidebarLinks = computed<SidebarLink[]>(() => [
  { label: 'Overview', to: '/admin', exact: true },
  { label: 'Merchants', to: '/admin/merchants' },
  { label: 'Listings', to: '/admin/listings' },
  { label: 'Inquiries', to: '/admin/inquiries' },
  { label: 'Settings', to: '/admin/settings' },
])

function isActive(link: SidebarLink) {
  if (link.exact) {
    return route.path === link.to
  }

  return route.path === link.to || route.path.startsWith(`${link.to}/`)
}

const userLabel = computed(() => auth.user?.name?.split(' ')[0] ?? 'Account')

async function logout() {
  auth.logout()
  await router.push('/')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <RouterLink class="admin-brand" to="/">
        <div class="admin-logo" aria-hidden="true">BL</div>
        <div class="admin-brand-copy">
          <div class="admin-brand-title">Business Linkage</div>
          <div class="admin-brand-subtitle">Admin Console</div>
        </div>
      </RouterLink>

      <nav class="admin-nav" aria-label="Admin navigation">
        <RouterLink
          v-for="link in sidebarLinks"
          :key="link.to"
          :to="link.to"
          class="admin-nav-link"
          :class="{ 'is-active': isActive(link) }"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="admin-body">
      <header class="admin-header">
        <div class="admin-header-copy">
          <p class="eyebrow">Operator workspace</p>
          <p class="admin-header-title">Admin dashboard</p>
        </div>

        <div class="admin-header-actions">
          <RouterLink v-if="auth.user" class="button-ghost" to="/admin">{{ userLabel }}</RouterLink>
          <RouterLink v-else class="button-ghost" to="/login?role=admin">Sign in</RouterLink>
          <button v-if="auth.user" class="button-ghost" type="button" @click="logout">Sign out</button>
        </div>
      </header>

      <main class="admin-main">
        <slot />
      </main>

      <footer class="admin-footer">
        <div class="container footer-grid">
          <div>
            <p class="admin-footer-title">Business Linkage</p>
            <p class="muted admin-footer-copy">Admin console styled with the Seance palette.</p>
          </div>
          <div class="admin-footer-links">
            <RouterLink to="/" class="admin-footer-link">Home</RouterLink>
            <RouterLink to="/marketplace" class="admin-footer-link">Marketplace</RouterLink>
          </div>
          <div class="admin-footer-links">
            <a href="#" class="admin-footer-link">Privacy</a>
            <a href="#" class="admin-footer-link">Support</a>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

