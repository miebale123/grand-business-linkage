<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import { buildLoginLocation, buildRegisterLocation, routePaths } from '@/app/router/paths'
import { useAuthStore } from '@/modules/auth'
import { getPrimaryRole, getUserRolesList } from '@/modules/auth/access.guards'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'

type NavLink = {
  label: string
  to: RouteLocationRaw
  names?: string[]
  prefixes?: string[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userRoles = computed(() => getUserRolesList(authStore.user))
const hasMerchantWorkspace = computed(
  () => userRoles.value.includes('merchant') || userRoles.value.includes('basic_merchant'),
)

// Global Top Navigation
const navLinks = computed<NavLink[]>(() => {
  if (getPrimaryRole(authStore.user) === 'admin') {
    return [
      { label: 'Buy', to: routePaths.buy, names: ['buy'] },
      { label: 'Admin', to: routePaths.adminDashboard, names: ['admin-dashboard'] },
    ]
  }

  return [
    { label: 'Buy', to: routePaths.buy, names: ['buy'] },
    { label: 'Rent', to: routePaths.rent, names: ['rent'] },
    { label: 'Sell', to: routePaths.merchantProductCreate, names: ['merchant-product-create'] },
  ]
})

const workspaceLabel = computed(() => {
  if (getPrimaryRole(authStore.user) === 'admin') return 'Admin control'
  if (hasMerchantWorkspace.value) return 'Merchant workspace'
  if (userRoles.value.includes('user')) return 'Shopper account'
  return 'Guest mode'
})

const dashboardPath = computed(() => {
  if (getPrimaryRole(authStore.user) === 'admin') return routePaths.adminDashboard
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

const showMerchantConfirm = ref(false)

function goToMerchantDashboard() {
  showMerchantConfirm.value = true
}

function onMerchantConfirm() {
  router.push(routePaths.merchantDashboard)
}
</script>

<template>
  <div class="app-shell">
    <div class="app-shell__body">
      <header class="app-shell__header">
        <div class="app-shell__header-inner">
          <div class="app-shell__brand-wrap">
            <RouterLink :to="routePaths.home" class="app-shell__brand">
              <div class="app-shell__brand-logo">BL</div>
              <div class="app-shell__brand-copy">
                <p class="app-shell__brand-title">Business Linkage</p>
                <p class="app-shell__brand-subtitle">Trusted local marketplace</p>
              </div>
            </RouterLink>
          </div>

          <nav class="app-shell__desktop-nav">
            <RouterLink
              v-for="link in navLinks"
              :key="link.label"
              :to="link.to"
              class="app-shell__nav-link"
              :class="{ 'is-active': isLinkActive(link) }"
            >
              {{ link.label }}
            </RouterLink>
          </nav>

          <div class="app-shell__auth-actions">
            <template v-if="authStore.user">
              <button
                v-if="hasMerchantWorkspace"
                type="button"
                class="manage-products-btn"
                @click="goToMerchantDashboard"
              >
               
                <span>Manage products</span>
              </button>
              <RouterLink
                :to="routePaths.favorites"
                class="app-shell__favorites-btn"
                :class="{ 'is-active': route.name === 'favorites' }"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </RouterLink>
              <RouterLink :to="dashboardPath" class="app-shell__user-chip">
                {{ authStore.user.name.split(' ')[0] }}
              </RouterLink>
              <button class="btn-ghost" type="button" @click="logout">
                <!-- <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg> -->

                sign out
              </button>
            </template>
            <template v-else>
              <RouterLink class="btn-ghost" :to="buildLoginLocation()">Log in</RouterLink>
              <RouterLink class="btn-primary" :to="buildRegisterLocation()">Sign up</RouterLink>
            </template>
          </div>
        </div>

        <div class="app-shell__mobile-nav">
          <RouterLink
            v-for="link in navLinks"
            :key="`mobile-${link.label}`"
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
        </div>
      </main>

      <ConfirmDialog
        v-model="showMerchantConfirm"
        title="Go to Merchant Dashboard?"
        message="You'll be taken to your merchant workspace where you can manage your products and orders."
        confirm-text="Go to Dashboard"
        cancel-text="Stay Here"
        @confirm="onMerchantConfirm"
      />
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

.manage-products-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--primary);
  color: white;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.manage-products-btn:hover {
  background: var(--primary-deep);
  transform: translateY(-1px);
}

.app-shell__favorites-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.9);
  color: var(--muted);
  transition: all 0.2s ease;
}

.app-shell__favorites-btn svg {
  width: 18px;
  height: 18px;
}

.app-shell__favorites-btn:hover {
  color: var(--primary);
  border-color: var(--primary);
  background: var(--primary-soft);
}

.app-shell__favorites-btn.is-active {
  color: var(--primary);
  border-color: var(--primary);
  background: var(--primary-soft);
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

  .app-shell__auth-actions .btn-ghost {
    padding: 8px;
  }

  .app-shell__auth-actions .manage-products-btn span {
    display: none;
  }

  .app-shell__auth-actions .manage-products-btn {
    padding: 8px;
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
