<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { buildLoginLocation, buildRegisterLocation, routePaths } from '@/app/router/paths'
import { useAuthStore } from '@/modules/auth'

type NavLink = {
  label: string
  to: string
  names?: string[]
  prefixes?: string[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isMobileSidebarOpen = ref(false)

// Global Top Navigation
const navLinks = computed<NavLink[]>(() => {
  if (authStore.user?.role === 'merchant') {
    return [
      { label: 'Home', to: routePaths.home, names: ['home'] },
      {
        label: 'Marketplace',
        to: routePaths.home,
        names: ['product-details', 'merchant-profile'],
      },
      { label: 'Favorites', to: routePaths.favorites, names: ['favorites'] },
      {
        label: 'Seller Hub',
        to: routePaths.merchantDashboard,
        names: ['merchant-dashboard'],
        prefixes: ['merchant-product-'],
      },
      {
        label: 'New Listing',
        to: routePaths.merchantProductCreate,
        prefixes: ['merchant-product-'],
      },
    ]
  }

  if (authStore.user?.role === 'admin') {
    return [
      { label: 'Home', to: routePaths.home, names: ['home'] },
      {
        label: 'Marketplace',
        to: routePaths.home,
        names: ['product-details', 'merchant-profile'],
      },
      { label: 'Admin', to: routePaths.adminDashboard, names: ['admin-dashboard'] },
    ]
  }

  return [
    { label: 'Home', to: routePaths.home, names: ['home'] },
    { label: 'Buy', to: routePaths.home, names: ['home'] },
    { label: 'Sell', to: routePaths.merchantSignup, names: [] },
    { label: 'Rent', to: routePaths.home, names: ['home'] },
    {
      label: 'Marketplace',
      to: routePaths.home,
      names: ['product-details', 'merchant-profile'],
    },
    { label: 'Favorites', to: routePaths.favorites, names: ['favorites'] },
    { label: 'For Sellers', to: routePaths.merchantSignup },
  ]
})

// Admin Sidebar Navigation
const sidebarLinks = [
  { label: 'Overview', to: routePaths.adminDashboard, exact: true },
  { label: 'Merchants', to: routePaths.adminMerchants },
  { label: 'Listings', to: routePaths.adminListings },
  { label: 'Inquiries', to: routePaths.adminInquiries },
  { label: 'Settings', to: routePaths.adminSettings },
]

const workspaceLabel = computed(() => {
  if (authStore.user?.role === 'merchant') return 'Merchant workspace'
  if (authStore.user?.role === 'admin') return 'Admin control'
  if (authStore.user?.role === 'user') return 'Shopper account'
  return 'Guest mode'
})

const dashboardPath = computed(() => {
  if (authStore.user?.role === 'merchant') return routePaths.merchantDashboard
  if (authStore.user?.role === 'admin') return routePaths.adminDashboard
  return routePaths.home
})

function isLinkActive(link: NavLink) {
  const routeName = route.name?.toString() ?? ''
  if (link.names?.includes(routeName)) return true
  return link.prefixes?.some((prefix) => routeName.startsWith(prefix)) ?? false
}

async function logout() {
  await authStore.logout()
  await router.push(routePaths.home)
}
</script>

<template>
  <div class="app-shell">
    <div
      v-if="isMobileSidebarOpen"
      class="app-shell__overlay"
      @click="isMobileSidebarOpen = false"
    />

    <aside
      v-if="authStore.user?.role === 'admin'"
      :class="[isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full', 'app-shell__sidebar']"
    >
      <div class="app-shell__sidebar-head">
        <span class="app-shell__sidebar-title">Admin Menu</span>
      </div>

      <nav class="app-shell__sidebar-nav">
        <p class="app-shell__sidebar-label">Platform</p>
        <RouterLink
          v-for="link in sidebarLinks"
          :key="link.to"
          :to="link.to"
          :class="[
            route.path === link.to
              ? 'app-shell__sidebar-link is-active'
              : 'app-shell__sidebar-link',
          ]"
          @click="isMobileSidebarOpen = false"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="app-shell__body">
      <header class="app-shell__header">
        <div class="app-shell__header-inner">
          <div class="app-shell__brand-wrap">
            <button
              v-if="authStore.user?.role === 'admin'"
              class="app-shell__menu-btn"
              @click="isMobileSidebarOpen = true"
              aria-label="Open admin sidebar"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <RouterLink :to="routePaths.home" class="app-shell__brand">
              <div class="app-shell__brand-logo">BL</div>
              <div class="app-shell__brand-copy">
                <p class="app-shell__brand-title">Business Linkage</p>
                <p class="app-shell__brand-subtitle">Trusted local marketplace</p>
              </div>
            </RouterLink>

            <span v-if="authStore.user" class="app-shell__workspace-chip">
              {{ workspaceLabel }}
            </span>
          </div>

          <nav class="app-shell__desktop-nav">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="app-shell__nav-link"
              :class="{ 'is-active': isLinkActive(link) }"
            >
              {{ link.label }}
            </RouterLink>
          </nav>

          <div class="app-shell__auth-actions">
            <template v-if="authStore.user">
              <RouterLink :to="dashboardPath" class="app-shell__user-chip">
                {{ authStore.user.name.split(' ')[0] }}
              </RouterLink>
              <button class="btn-ghost" type="button" @click="logout">Sign out</button>
            </template>
            <template v-else>
              <RouterLink class="btn-ghost" :to="buildLoginLocation()">Sign in</RouterLink>
              <RouterLink class="btn-primary" :to="buildRegisterLocation()"
                >Create account</RouterLink
              >
            </template>
          </div>
        </div>

        <div class="app-shell__mobile-nav">
          <RouterLink
            v-for="link in navLinks"
            :key="`mobile-${link.to}`"
            :to="link.to"
            class="app-shell__mobile-nav-link"
            :class="{ 'is-active': isLinkActive(link) }"
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </header>

      <main class="app-shell__main">
        <div class="app-shell__content-wrap">
          <div class="app-shell__content">
            <slot />
          </div>

          <footer class="app-shell__footer">
            <section class="shell-panel app-shell__footer-panel">
              <div class="app-shell__footer-grid">
                <div class="app-shell__footer-brand">
                  <div class="app-shell__brand">
                    <div class="app-shell__brand-logo">BL</div>
                    <div class="app-shell__brand-copy">
                      <p class="app-shell__brand-title">Business Linkage</p>
                      <p class="app-shell__brand-subtitle">Built for local trust</p>
                    </div>
                  </div>
                  <p class="app-shell__footer-copy">
                    A trusted phone-first marketplace where shoppers find verified local listings,
                    compare clearly, and contact sellers directly.
                  </p>
                </div>

                <div class="app-shell__footer-links">
                  <p class="app-shell__footer-label">Explore</p>
                  <RouterLink class="app-shell__footer-link" :to="routePaths.home">Home</RouterLink>
                  <RouterLink class="app-shell__footer-link" :to="routePaths.home"
                    >Marketplace</RouterLink
                  >
                  <RouterLink class="app-shell__footer-link" :to="routePaths.favorites"
                    >Favorites</RouterLink
                  >
                  <RouterLink
                    class="app-shell__footer-link"
                    :to="buildLoginLocation({ role: 'user' })"
                    >Shopper sign in</RouterLink
                  >
                </div>

                <div class="app-shell__footer-links">
                  <p class="app-shell__footer-label">Business</p>
                  <RouterLink class="app-shell__footer-link" :to="buildRegisterLocation('merchant')"
                    >Become a seller</RouterLink
                  >
                  <RouterLink class="app-shell__footer-link" :to="routePaths.merchantDashboard"
                    >Seller hub</RouterLink
                  >
                  <RouterLink class="app-shell__footer-link" :to="routePaths.adminDashboard"
                    >Admin console</RouterLink
                  >
                </div>
              </div>

              <div class="app-shell__footer-bottom">
                <p>
                  © {{ new Date().getFullYear() }} Business Linkage. Designed for realistic local
                  marketplace workflows.
                </p>
                <div class="app-shell__footer-meta">
                  <a href="#" class="app-shell__footer-link">Privacy</a>
                  <a href="#" class="app-shell__footer-link">Terms</a>
                  <a href="#" class="app-shell__footer-link">Support</a>
                </div>
              </div>
            </section>
          </footer>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  background: transparent;
}

.app-shell__overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.app-shell__sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 50;
  width: 260px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.95);
  transition: transform 220ms ease;
}

.app-shell__sidebar-head {
  height: 74px;
  display: flex;
  align-items: center;
  padding: 0 22px;
  border-bottom: 1px solid var(--line);
}

.app-shell__sidebar-title {
  font-weight: 700;
  font-size: 1.02rem;
}

.app-shell__sidebar-nav {
  padding: 20px 14px;
  overflow-y: auto;
}

.app-shell__sidebar-label {
  margin: 0 8px 12px;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 700;
}

.app-shell__sidebar-link {
  display: flex;
  align-items: center;
  border-radius: 14px;
  padding: 10px 12px;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 600;
  border: 1px solid transparent;
}

.app-shell__sidebar-link:hover {
  color: var(--text);
  background: rgba(250, 225, 255, 0.5);
}

.app-shell__sidebar-link.is-active {
  color: var(--text);
  background: rgba(210, 0, 217, 0.11);
  border-color: rgba(128, 0, 128, 0.2);
}

.app-shell__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-shell__header {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(12px);
}

.app-shell__header-inner {
  height: 74px;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
}

.app-shell__brand-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.app-shell__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.app-shell__brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.app-shell__brand-copy {
  min-width: 0;
}

.app-shell__brand-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 750;
  line-height: 1.2;
}

.app-shell__brand-subtitle {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 0.72rem;
  line-height: 1.2;
}

.app-shell__workspace-chip,
.app-shell__user-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 650;
}

.app-shell__desktop-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.app-shell__nav-link {
  padding: 9px 14px;
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid transparent;
}

.app-shell__nav-link:hover {
  color: var(--text);
  background: rgba(250, 225, 255, 0.5);
}

.app-shell__nav-link.is-active {
  color: var(--text);
  border-color: rgba(128, 0, 128, 0.2);
  background: rgba(210, 0, 217, 0.1);
}

.app-shell__auth-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.app-shell__menu-btn {
  display: none;
  border: 0;
  background: transparent;
  color: var(--text);
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.app-shell__mobile-nav {
  display: none;
}

.app-shell__main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.app-shell__content-wrap {
  width: min(1240px, 100%);
  margin: 0 auto;
  padding: 24px 18px 34px;
}

.app-shell__content {
  min-height: 380px;
}

.app-shell__footer {
  margin-top: 26px;
}

.app-shell__footer-panel {
  padding: 24px;
}

.app-shell__footer-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.8fr;
  gap: 22px;
}

.app-shell__footer-copy {
  margin: 12px 0 0;
  max-width: 460px;
  color: var(--muted);
  line-height: 1.65;
  font-size: 0.92rem;
}

.app-shell__footer-label {
  margin: 0 0 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.13em;
  font-size: 0.72rem;
  font-weight: 700;
}

.app-shell__footer-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-shell__footer-link {
  color: var(--muted);
  font-size: 0.9rem;
}

.app-shell__footer-link:hover {
  color: var(--text);
}

.app-shell__footer-bottom {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  color: var(--muted);
  font-size: 0.84rem;
}

.app-shell__footer-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 1120px) {
  .app-shell__desktop-nav {
    display: none;
  }

  .app-shell__mobile-nav {
    display: flex;
    gap: 8px;
    padding: 10px 18px 12px;
    overflow-x: auto;
    border-top: 1px solid var(--line);
  }

  .app-shell__mobile-nav-link {
    flex: 0 0 auto;
    padding: 8px 13px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--muted);
    background: rgba(255, 255, 255, 0.85);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .app-shell__mobile-nav-link.is-active {
    background: rgba(210, 0, 217, 0.1);
    color: var(--text);
  }

  .app-shell__workspace-chip {
    display: none;
  }
}

@media (max-width: 920px) {
  .app-shell__header-inner {
    grid-template-columns: 1fr auto;
  }

  .app-shell__user-chip {
    display: none;
  }

  .app-shell__brand-subtitle {
    display: none;
  }

  .app-shell__footer-grid {
    grid-template-columns: 1fr;
  }

  .app-shell__footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .app-shell__menu-btn {
    display: inline-grid;
    place-items: center;
  }

  .app-shell__sidebar {
    box-shadow: 24px 0 38px rgba(36, 16, 37, 0.18);
  }

  .app-shell__content-wrap {
    padding-top: 18px;
  }
}

@media (min-width: 1024px) {
  .app-shell__sidebar {
    position: sticky;
    top: 0;
    transform: translateX(0) !important;
    height: 100vh;
  }
}
</style>
