<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { routePaths } from '@/app/router/paths'
import * as api from '@/shared/api/api'
import { useAuthStore } from '@/modules/auth'
import type { MerchantRecord, ProductRecord, UserRecord } from '@/shared/types'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const merchants = ref<MerchantRecord[]>([])
const products = ref<ProductRecord[]>([])
const users = ref<UserRecord[]>([])
const actioningId = ref('')

const pendingMerchants = computed(() => merchants.value.filter((merchant) => !merchant.verified))
const verifiedMerchants = computed(() => merchants.value.filter((merchant) => merchant.verified))
const basicMerchants = computed(() => pendingMerchants.value)

const statusCounts = computed(() => ({
  total: merchants.value.length,
  verified: verifiedMerchants.value.length,
  pending: pendingMerchants.value.length,
}))

const userById = computed(() =>
  users.value.reduce<Record<string, UserRecord>>((map, user) => {
    map[user.id] = user
    return map
  }, {}),
)

const productCountByMerchant = computed(() =>
  products.value.reduce<Record<string, number>>((map, product) => {
    map[product.merchantId] = (map[product.merchantId] || 0) + 1
    return map
  }, {}),
)

const pendingProducts = computed(() =>
  products.value.filter((product) => product.status === 'pending'),
)

const allProducts = computed(() => products.value)

const merchantById = computed(() =>
  merchants.value.reduce<Record<string, MerchantRecord>>((map, merchant) => {
    map[merchant.id] = merchant
    return map
  }, {}),
)

function getVerificationStatusLabel(user: UserRecord | undefined) {
  if (user?.verificationRequestStatus === 'pending') return 'Request submitted'
  if (user?.verificationRequestStatus === 'rejected') return 'Needs resubmission'
  return 'No request yet'
}

async function refresh() {
  loading.value = true
  const [merchantRecords, productRecords, userRecords] = await Promise.all([
    api.fetchMerchants(),
    api.fetchProducts(),
    api.fetchUsersByRole('merchant'),
  ])
  merchants.value = merchantRecords
  products.value = productRecords
  users.value = userRecords
  loading.value = false
}

async function updateVerification(merchantId: string, verified: boolean) {
  actioningId.value = merchantId
  try {
    await api.updateMerchantVerification(merchantId, verified)
    await refresh()
  } catch (error) {
    console.error('Failed to update verification:', error)
    alert('Failed to update merchant verification. Please try again.')
  } finally {
    actioningId.value = ''
  }
}

const actioningProductId = ref('')

async function updateProductStatus(productId: string, status: 'approved' | 'rejected') {
  actioningProductId.value = productId
  try {
    await api.updateProductStatus(productId, status)
    await refresh()
  } catch (error) {
    console.error('Failed to update product status:', error)
    alert('Failed to update product status. Please try again.')
  } finally {
    actioningProductId.value = ''
  }
}

async function logout() {
  await auth.logout()
  await router.push(routePaths.home)
}

onMounted(refresh)
</script>

<template>
  <div class="admin-console">
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">□</span>
        <span class="brand-text">NEXUS</span>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-section-label">DASHBOARD</span>
          <RouterLink
            :to="routePaths.adminDashboard"
            class="nav-item"
            :class="{ active: route.name === 'admin-overview' }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Overview
          </RouterLink>
        </div>

        <div class="nav-section">
          <span class="nav-section-label">MERCHANTS</span>
          <RouterLink
            :to="routePaths.adminBasicMerchants"
            class="nav-item"
            :class="{ active: route.name === 'admin-basic-merchants' }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Basic
            <span v-if="pendingMerchants.length" class="badge-count">{{
              pendingMerchants.length
            }}</span>
          </RouterLink>
          <RouterLink
            :to="routePaths.adminVerifiedMerchants"
            class="nav-item"
            :class="{ active: route.name === 'admin-verified-merchants' }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Verified
          </RouterLink>
        </div>

        <div class="nav-section">
          <span class="nav-section-label">PRODUCTS</span>
          <RouterLink
            :to="routePaths.adminProducts"
            class="nav-item"
            :class="{ active: route.name === 'admin-products' }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
              />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            All Listings
            <span v-if="products.length" class="badge-count">{{ products.length }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" type="button" @click="logout">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
        <div class="user-card">
          <div class="user-avatar">{{ auth.user?.name?.[0] || 'A' }}</div>
          <div class="user-info">
            <span class="user-name">{{ auth.user?.name || 'Admin' }}</span>
            <span class="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </aside>

    <main class="admin-main">
      <section class="admin-hero">
        <div class="hero-content">
          <h1 class="hero-title">Merchant Control</h1>
          <p class="hero-subtitle">Verify trusted sellers, review pending listings.</p>
        </div>
        <button class="refresh-btn" type="button" @click="refresh">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          Refresh
        </button>
      </section>

      <template v-if="route.name === 'admin-overview'">
        <section class="stats-bar">
          <div class="stat-box">
            <span class="stat-num">{{ statusCounts.total }}</span>
            <span class="stat-lbl">Total</span>
          </div>
          <div class="stat-box stat-success">
            <span class="stat-num">{{ statusCounts.verified }}</span>
            <span class="stat-lbl">Verified</span>
          </div>
          <div class="stat-box stat-warning">
            <span class="stat-num">{{ statusCounts.pending }}</span>
            <span class="stat-lbl">Pending</span>
          </div>
          <div class="stat-box stat-accent">
            <span class="stat-num">{{ products.length }}</span>
            <span class="stat-lbl">Listings</span>
          </div>
        </section>

        <div class="overview-summary">
          <div class="summary-grid">
            <div class="summary-card" @click="router.push(routePaths.adminBasicMerchants)">
              <span class="summary-num">{{ pendingMerchants.length }}</span>
              <span class="summary-lbl">Merchants need review</span>
            </div>
            <div class="summary-card" @click="router.push(routePaths.adminProducts)">
              <span class="summary-num">{{ products.length }}</span>
              <span class="summary-lbl">Products to manage</span>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="route.name === 'admin-basic-merchants'">
        <section class="panel-section full-width">
          <div class="section-header">
            <div class="section-badge">BASIC</div>
            <h2 class="section-title">Basic Merchants</h2>
            <span class="section-count">{{ basicMerchants.length }}</span>
          </div>
          <div v-if="loading" class="panel-loading"><div class="loading-dots"></div></div>
          <div v-else-if="basicMerchants.length" class="queue-cards">
            <article v-for="merchant in basicMerchants" :key="merchant.id" class="queue-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">
                    {{ merchant.businessName || userById[merchant.ownerId]?.name || 'Unnamed merchant' }}
                  </h3>
                  <p v-if="merchant.category || merchant.area" class="card-meta">
                    {{ [merchant.category, merchant.area].filter(Boolean).join(' · ') }}
                  </p>
                </div>
                <span class="status-tag tag-pending">BASIC</span>
              </div>
              <p v-if="merchant.description" class="card-desc">{{ merchant.description }}</p>
              <div class="card-meta-row">
                <span>{{ productCountByMerchant[merchant.id] || 0 }} listings</span>
                <span>{{ getVerificationStatusLabel(userById[merchant.ownerId]) }}</span>
              </div>
              <div class="card-meta-row">
                <span>{{ userById[merchant.ownerId]?.name || 'Unknown owner' }}</span>
                <span>{{ userById[merchant.ownerId]?.email || 'No email' }}</span>
              </div>
              <div class="card-meta-row">
                <span>{{ userById[merchant.ownerId]?.phone || 'No phone' }}</span>
                <span>{{ userById[merchant.ownerId]?.location || 'No location' }}</span>
              </div>
              <div class="card-meta-row">
                <span>License ID</span>
                <span>{{ userById[merchant.ownerId]?.merchantLicenseId || 'No license ID' }}</span>
              </div>
              <div class="card-actions">
                <div class="action-btns">
                  <button
                    class="btn-reject"
                    type="button"
                    :disabled="actioningId === merchant.id"
                    @click="updateVerification(merchant.id, false)"
                  >
                    Reject
                  </button>
                  <button
                    class="btn-approve"
                    type="button"
                    :disabled="actioningId === merchant.id"
                    @click="updateVerification(merchant.id, true)"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="panel-empty"><p>No basic merchants</p></div>
        </section>
      </template>

      <template v-else-if="route.name === 'admin-verified-merchants'">
        <section class="panel-section full-width">
          <div class="section-header">
            <div class="section-badge verified">VERIFIED</div>
            <h2 class="section-title">Verified Merchants</h2>
            <span class="section-count">{{ verifiedMerchants.length }}</span>
          </div>
          <div v-if="loading" class="panel-loading"><div class="loading-dots"></div></div>
          <div v-else-if="verifiedMerchants.length" class="verified-grid">
            <article v-for="merchant in verifiedMerchants" :key="merchant.id" class="verified-card">
              <div class="verified-info">
                <h3 class="verified-name">{{ merchant.businessName }}</h3>
                <p class="verified-meta">{{ merchant.category }} · {{ merchant.area }}</p>
                <p class="verified-desc">{{ merchant.description }}</p>
              </div>
              <div class="verified-stats">
                <span class="verified-count">{{ productCountByMerchant[merchant.id] || 0 }}</span>
                <span class="verified-label">listings</span>
              </div>
              <div class="verified-actions">
                <button
                  class="btn-revoke"
                  type="button"
                  :disabled="actioningId === merchant.id"
                  @click="updateVerification(merchant.id, false)"
                >
                  Revoke
                </button>
              </div>
            </article>
          </div>
          <div v-else class="panel-empty"><p>No verified merchants</p></div>
        </section>
      </template>

      <template v-else-if="route.name === 'admin-products'">
        <section class="panel-section full-width">
          <div class="section-header">
            <div class="section-badge">PRODUCTS</div>
            <h2 class="section-title">All Product Listings</h2>
            <span class="section-count">{{ products.length }}</span>
          </div>
          <div v-if="loading" class="panel-loading"><div class="loading-dots"></div></div>
          <div v-else-if="products.length" class="products-table">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Merchant</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in products" :key="product.id">
                  <td>
                    <div class="product-cell">
                      <span class="product-name">{{ product.name }}</span>
                      <span class="product-meta">{{ product.category }}</span>
                    </div>
                  </td>
                  <td>ETB {{ product.price.toLocaleString() }}</td>
                  <td>
                    <span
                      class="merchant-type"
                      :class="merchantById[product.merchantId]?.verified ? 'verified' : 'basic'"
                    >
                      {{ merchantById[product.merchantId]?.businessName || 'Unknown' }}
                    </span>
                  </td>
                  <td>
                    <span
                      class="status-tag"
                      :class="
                        product.status === 'approved'
                          ? 'tag-approved'
                          : product.status === 'pending'
                            ? 'tag-pending'
                            : 'tag-rejected'
                      "
                    >
                      {{ product.status }}
                    </span>
                  </td>
                  <td>
                    <button
                      v-if="product.status === 'pending'"
                      class="btn-approve-sm"
                      type="button"
                      :disabled="actioningProductId === product.id"
                      @click="updateProductStatus(product.id, 'approved')"
                    >
                      Approve
                    </button>
                    <button
                      v-if="product.status === 'pending'"
                      class="btn-reject-sm"
                      type="button"
                      :disabled="actioningProductId === product.id"
                      @click="updateProductStatus(product.id, 'rejected')"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="panel-empty"><p>No products</p></div>
        </section>
      </template>
    </main>
  </div>
</template>

<style>
:root {
  --admin-bg: var(--color-seance-50);
  --admin-surface: #ffffff;
  --admin-surface-elevated: rgba(255, 255, 255, 0.92);
  --admin-text: var(--text);
  --admin-muted: var(--muted);
  --admin-border: var(--line);
  --admin-accent: var(--primary);
  --admin-accent-hover: var(--primary-deep);
  --admin-success: var(--success);
  --admin-warning: var(--warning);
  --admin-danger: var(--danger);
  --admin-glow: var(--primary-soft);
}
</style>

<style scoped>
.admin-console {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(237, 22, 255, 0.12), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, var(--color-seance-50) 46%, rgba(250, 225, 255, 0.5) 100%);
}

.admin-sidebar {
  width: 260px;
  background: rgba(255, 255, 255, 0.92);
  border-right: 1px solid var(--admin-border);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  margin-bottom: 32px;
}

.brand-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  color: white;
  font-weight: 900;
  font-size: 18px;
}

.brand-text {
  font-weight: 900;
  font-size: 18px;
  letter-spacing: 0.1em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--admin-muted);
  padding: 0 12px;
  margin-bottom: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-muted);
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: var(--admin-text);
  background: var(--admin-surface-elevated);
}

.nav-item.active {
  color: var(--admin-accent);
  background: var(--admin-glow);
}

.nav-item svg {
  flex-shrink: 0;
}

.nav-item--badge {
  position: relative;
  justify-content: flex-start;
}

.badge-count {
  position: absolute;
  right: 12px;
  background: var(--admin-warning);
  color: var(--admin-text);
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid var(--admin-border);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: none;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  color: var(--admin-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.logout-btn:hover {
  border-color: var(--admin-accent);
  color: var(--admin-accent);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--admin-surface-elevated);
  border-radius: 8px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--admin-accent);
  border-radius: 50%;
  font-weight: 800;
  font-size: 14px;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--admin-text);
}

.user-role {
  font-size: 11px;
  color: var(--admin-muted);
}

.admin-main {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.admin-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--admin-border);
}

.hero-title {
  font-weight: 900;
  font-size: 32px;
  letter-spacing: -0.02em;
  margin: 0;
}

.hero-subtitle {
  font-size: 14px;
  color: var(--admin-muted);
  margin: 8px 0 0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--admin-surface-elevated);
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  color: var(--admin-text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  border-color: var(--admin-accent);
  color: var(--admin-accent);
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}

.stat-box {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.stat-lbl {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--admin-muted);
}

.stat-success .stat-num {
  color: var(--admin-success);
}
.stat-warning .stat-num {
  color: var(--admin-warning);
}
.stat-accent .stat-num {
  color: var(--admin-accent);
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.panel-section {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  padding: 24px;
}

.panel-section.full-width {
  grid-column: 1 / -1;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--admin-border);
}

.section-badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  padding: 4px 8px;
  background: var(--admin-warning);
  color: var(--admin-text);
  border-radius: 4px;
}

.section-badge.verified {
  background: var(--admin-success);
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.section-count {
  margin-left: auto;
  font-size: 13px;
  font-weight: 700;
  color: var(--admin-muted);
}

.panel-loading,
.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--admin-muted);
}

.loading-dots {
  display: flex;
  gap: 8px;
}

.loading-dots::before,
.loading-dots::after {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--admin-accent);
  border-radius: 50%;
  animation: pulse 1s infinite alternate;
}

.loading-dots::after {
  animation-delay: 0.5s;
}

@keyframes pulse {
  to {
    opacity: 0.3;
  }
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  color: var(--admin-success);
}

.queue-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.queue-card {
  background: var(--admin-surface-elevated);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  padding: 16px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.card-meta {
  font-size: 12px;
  color: var(--admin-muted);
  margin: 4px 0 0;
}

.status-tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 4px 8px;
  border-radius: 4px;
}

.tag-pending {
  background: var(--admin-warning);
  color: var(--admin-text);
}

.card-desc {
  font-size: 13px;
  color: var(--admin-muted);
  margin: 12px 0;
  line-height: 1.5;
}

.card-meta-row {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--admin-muted);
}

.unverified-tag {
  color: var(--admin-danger);
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--admin-border);
}

.owner-id {
  font-size: 11px;
  font-family: monospace;
  color: var(--admin-muted);
}

.action-btns {
  display: flex;
  gap: 8px;
}

.btn-reject,
.btn-revoke {
  padding: 8px 14px;
  background: none;
  border: 1px solid var(--admin-border);
  border-radius: 4px;
  color: var(--admin-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reject:hover {
  border-color: var(--admin-danger);
  color: var(--admin-danger);
}

.btn-approve,
.btn-approve {
  padding: 8px 14px;
  background: var(--admin-success);
  border: none;
  border-radius: 4px;
  color: var(--admin-text);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-approve:hover {
  background: #00e673;
}

.btn-revoke {
  background: none;
  border: 1px solid var(--admin-danger);
  color: var(--admin-danger);
}

.btn-revoke:hover {
  background: var(--admin-danger);
  color: white;
}

.verified-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.verified-card {
  background: var(--admin-surface-elevated);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.verified-name {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
}

.verified-meta {
  font-size: 11px;
  color: var(--admin-muted);
  margin: 4px 0 0;
}

.verified-desc {
  font-size: 12px;
  color: var(--admin-muted);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.verified-stats {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: auto;
}

.verified-count {
  font-size: 24px;
  font-weight: 900;
  color: var(--admin-success);
}

.verified-label {
  font-size: 11px;
  color: var(--admin-muted);
}

.verified-actions {
  margin-top: 8px;
}

@media (max-width: 1024px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }

  .verified-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-console {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    flex-direction: row;
    position: sticky;
    top: 0;
  }

  .sidebar-nav {
    flex-direction: row;
    flex: 1;
    gap: 16px;
  }

  .nav-section {
    flex-direction: row;
    gap: 16px;
  }

  .nav-section-label {
    display: none;
  }

  .sidebar-footer {
    display: none;
  }

  .admin-main {
    padding: 20px;
  }

  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
}

.overview-summary {
  margin-bottom: 32px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.summary-card:hover {
  border-color: var(--admin-accent);
  background: var(--admin-surface-elevated);
}

.summary-num {
  font-size: 48px;
  font-weight: 900;
  color: var(--admin-accent);
}

.summary-lbl {
  font-size: 14px;
  color: var(--admin-muted);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th,
.admin-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid var(--admin-border);
}

.admin-table th {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--admin-muted);
  background: var(--admin-surface-elevated);
}

.admin-table td {
  font-size: 13px;
  color: var(--admin-text);
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
}

.product-meta {
  font-size: 12px;
  color: var(--admin-muted);
}

.merchant-type {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.merchant-type.basic {
  background: var(--admin-warning);
  color: var(--admin-text);
}

.merchant-type.verified {
  background: rgba(0, 204, 102, 0.2);
  color: var(--admin-success);
}

.tag-approved {
  background: rgba(0, 204, 102, 0.2);
  color: var(--admin-success);
}

.tag-rejected {
  background: rgba(255, 51, 102, 0.2);
  color: var(--admin-danger);
}

.btn-approve-sm {
  padding: 6px 10px;
  background: var(--admin-success);
  border: none;
  border-radius: 4px;
  color: var(--admin-text);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.btn-reject-sm {
  padding: 6px 10px;
  background: none;
  border: 1px solid var(--admin-border);
  border-radius: 4px;
  color: var(--admin-muted);
  font-size: 11px;
  cursor: pointer;
}
</style>
