<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { getMerchantProductEditPath, routePaths } from '@/app/router/paths'
import * as api from '@/shared/api/api'
import type {
  InquiryRecord,
  MarketplaceConfig,
  MerchantRecord,
  ProductRecord,
} from '@/shared/types'
import { useAuthStore } from '@/modules/auth'

const auth = useAuthStore()
const router = useRouter()

const merchant = ref<MerchantRecord | null>(null)
const products = ref<ProductRecord[]>([])
const inquiries = ref<InquiryRecord[]>([])
const marketplaceConfig = ref<MarketplaceConfig | null>(null)
const busy = ref(true)
const searchQuery = ref('')
const activeCategory = ref('All')
const mobileMenuOpen = ref(false)

const categories = computed(() => [
  'All',
  ...Array.from(new Set(products.value.map((p) => p.category))).sort(),
])

const productById = computed(() =>
  products.value.reduce<Record<string, ProductRecord>>((map, p) => {
    map[p.id] = p
    return map
  }, {}),
)

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const category = activeCategory.value

  return products.value.filter((p) => {
    if (category !== 'All' && p.category !== category) return false
    if (query) {
      return (
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.shortDescription?.toLowerCase().includes(query)
      )
    }
    return true
  })
})

const latestInquiries = computed(() =>
  [...inquiries.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5),
)

const statusCounts = computed(() => ({
  pending: products.value.filter((p) => p.status === 'pending').length,
  approved: products.value.filter((p) => p.status === 'approved').length,
  rejected: products.value.filter((p) => p.status === 'rejected').length,
}))

const workflowRules = computed(() => marketplaceConfig.value?.sellerWorkflowRules)
const isVerified = computed(() => merchant.value?.verified ?? false)
const reviewPolicy = computed(() =>
  isVerified.value
    ? (workflowRules.value?.verifiedReviewPolicy ?? 'Verified sellers publish directly.')
    : (workflowRules.value?.standardReviewPolicy ?? 'All listings are reviewed before publishing.'),
)

const stats = computed(() => [
  { label: 'Total listings', value: products.value.length, color: 'default' },
  { label: 'Pending review', value: statusCounts.value.pending, color: 'warn' },
  { label: 'Live on market', value: statusCounts.value.approved, color: 'success' },
])

async function refresh() {
  if (!auth.user) return
  busy.value = true

  merchant.value = await api.fetchMerchantByOwner(auth.user.id)
  const m = merchant.value

  const [merchantProducts, merchantInquiries, config] = await Promise.all([
    m ? api.fetchMerchantProducts(m.id) : Promise.resolve([]),
    api.fetchMerchantInquiries(auth.user.id),
    api.fetchMarketplaceConfig(),
  ])

  products.value = merchantProducts
  inquiries.value = merchantInquiries
  marketplaceConfig.value = config
  busy.value = false
}

async function removeProduct(productId: string) {
  if (!auth.user) return
  if (!confirm('Are you sure you want to delete this listing?')) return
  await api.deleteMerchantProduct(auth.user.id, productId)
  await refresh()
}

async function logout() {
  await auth.logout()
  await router.push(routePaths.home)
}

onMounted(refresh)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusClass(status: string) {
  if (status === 'approved') return 'approved'
  if (status === 'pending') return 'pending'
  return 'rejected'
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <div class="dashboard">
    <header class="dash-header">
      <RouterLink :to="routePaths.merchantDashboard" class="brand-link">
        <span class="brand-mark">BH</span>
        <span class="brand-name">Business Hub</span>
      </RouterLink>
      <button
        class="mobile-menu-btn"
        type="button"
        aria-label="Open navigation menu"
        @click="toggleMobileMenu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <nav class="dash-nav">
        <RouterLink :to="routePaths.merchantDashboard" class="nav-item active"
          >Dashboard</RouterLink
        >
        <RouterLink :to="routePaths.home" class="nav-item">Back to marketplace</RouterLink>
      </nav>
      <div class="dash-actions">
        <button
          class="add-listing-btn"
          type="button"
          @click="router.push(routePaths.merchantProductCreate)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add listing
        </button>
        <button class="logout-btn" type="button" @click="logout">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
        <div class="user-avatar">{{ auth.user?.name?.[0] || 'U' }}</div>
      </div>
    </header>

    <div v-if="mobileMenuOpen" class="mobile-menu-container">
      <div class="overlay" @click="closeMobileMenu"></div>

      <aside class="mobile-sidebar">
        <header class="mobile-sidebar-header">
          <RouterLink :to="routePaths.merchantDashboard" class="brand-link" @click="closeMobileMenu">
            <span class="brand-mark">BH</span>
            <span class="brand-name">Business Hub</span>
          </RouterLink>
          <button
            class="mobile-close-btn"
            type="button"
            aria-label="Close navigation menu"
            @click="closeMobileMenu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <nav class="mobile-nav">
          <RouterLink :to="routePaths.merchantDashboard" class="mobile-nav-link" @click="closeMobileMenu">
            Dashboard
          </RouterLink>
          <RouterLink :to="routePaths.home" class="mobile-nav-link" @click="closeMobileMenu">
            Back to marketplace
          </RouterLink>
        </nav>

        <div class="mobile-menu-actions">
          <button
            class="add-listing-btn mobile-add-listing-btn"
            type="button"
            @click="
              () => {
                closeMobileMenu()
                router.push(routePaths.merchantProductCreate)
              }
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add listing
          </button>
          <button
            class="mobile-logout-btn"
            type="button"
            @click="
              async () => {
                closeMobileMenu()
                await logout()
              }
            "
          >
            Sign out
          </button>
        </div>
      </aside>
    </div>

    <main class="dash-main">
      <section class="dash-hero">
        <div class="hero-content">
          <h1 class="hero-title">Manage your storefront</h1>
          <p class="hero-subtitle">{{ reviewPolicy }}</p>
        </div>
        <div class="hero-stats">
          <div v-for="stat in stats" :key="stat.label" class="stat-card" :class="stat.color">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </section>

      <section class="dash-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search listings..."
              class="search-input"
            />
            <button v-if="searchQuery" class="search-clear" type="button" @click="searchQuery = ''">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="category-tabs">
            <button
              v-for="cat in categories"
              :key="cat"
              class="category-tab"
              :class="{ active: activeCategory === cat }"
              type="button"
              @click="activeCategory = cat"
            >
              {{ cat === 'All' ? 'All' : cat }}
            </button>
          </div>
        </div>
        <div class="toolbar-right">
          <span class="listing-count"
            >{{ filteredProducts.length }} listing{{
              filteredProducts.length !== 1 ? 's' : ''
            }}</span
          >
          <button class="refresh-btn" type="button" @click="refresh">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Refresh
          </button>
        </div>
      </section>

      <div class="dash-content">
        <section class="listings-section">
          <div v-if="busy" class="empty-state">
            <div class="spinner"></div>
            <p>Loading your listings...</p>
          </div>
          <div v-else-if="!products.length" class="empty-state">
            <div class="empty-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <p class="empty-title">No listings yet</p>
            <p class="empty-desc">Create your first product to start selling on the marketplace.</p>
            <RouterLink :to="routePaths.merchantProductCreate" class="empty-action"
              >Create listing</RouterLink
            >
          </div>
          <div v-else-if="!filteredProducts.length" class="empty-state">
            <p class="empty-title">No matches found</p>
            <p class="empty-desc">Try adjusting your search or category filter.</p>
          </div>
          <div v-else class="listings-grid">
            <article v-for="product in filteredProducts" :key="product.id" class="listing-card">
              <div class="listing-image">
                <img :src="product.image" :alt="product.name" />
                <span class="listing-status" :class="getStatusClass(product.status)">{{
                  product.status
                }}</span>
              </div>
              <div class="listing-body">
                <div class="listing-header">
                  <h3 class="listing-name">{{ product.name }}</h3>
                  <span class="listing-price">ETB {{ product.price.toLocaleString() }}</span>
                </div>
                <p class="listing-meta">
                  {{ product.category }} · {{ product.condition }}
                </p>
                <p class="listing-desc">{{ product.shortDescription }}</p>
                <div class="listing-footer">
                  <span class="listing-location">{{ product.location }}</span>
                  <div class="listing-actions">
                    <RouterLink :to="getMerchantProductEditPath(product.id)" class="action-btn edit"
                      >Edit</RouterLink
                    >
                    <button
                      type="button"
                      class="action-btn delete"
                      @click="removeProduct(product.id)"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <aside class="inquiries-section">
          <div class="inquiries-header">
            <h2 class="inquiries-title">Recent inquiries</h2>
            <span class="inquiries-count">{{ inquiries.length }} total</span>
          </div>
          <div v-if="!latestInquiries.length" class="empty-inquiries">
            <p>No inquiries yet</p>
          </div>
          <div v-else class="inquiries-list">
            <article v-for="inquiry in latestInquiries" :key="inquiry.id" class="inquiry-card">
              <div class="inquiry-head">
                <div class="inquiry-customer">
                  <span class="inquiry-name">{{ inquiry.customerName }}</span>
                  <span class="inquiry-product">{{
                    productById[inquiry.productId]?.name || 'Product'
                  }}</span>
                </div>
                <span class="inquiry-date">{{ formatDate(inquiry.createdAt) }}</span>
              </div>
              <p class="inquiry-message">{{ inquiry.message }}</p>
            </article>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<style>
:root {
  --dash-bg: #fcfbf9;
  --dash-surface: #ffffff;
  --dash-text: #1c1917;
  --dash-muted: #78716c;
  --dash-border: #e7e5e4;
  --dash-accent: #b91c1c;
  --dash-accent-soft: #fef2f2;
  --dash-success: #16a34a;
  --dash-warning: #d97706;
  --dash-danger: #dc2626;
}
</style>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--dash-bg);
}

.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  background: var(--dash-surface);
  border-bottom: 1px solid var(--dash-border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.mobile-menu-btn {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--dash-border);
  border-radius: 10px;
  color: var(--dash-text);
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--dash-text);
}
.brand-mark {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--dash-accent);
  color: white;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 700;
  font-size: 14px;
  border-radius: 4px;
}
.brand-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 600;
  font-size: 18px;
}

.dash-nav {
  display: flex;
  gap: 8px;
}
.nav-item {
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--dash-muted);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.nav-item:hover {
  background: #f5f5f4;
  color: var(--dash-text);
}
.nav-item.active {
  background: var(--dash-accent-soft);
  color: var(--dash-accent);
}

.dash-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.add-listing-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--dash-accent);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.add-listing-btn:hover {
  background: #991b1b;
}
.logout-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--dash-border);
  border-radius: 50%;
  color: var(--dash-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}
.logout-btn:hover {
  border-color: var(--dash-accent);
  color: var(--dash-accent);
}
.user-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f4;
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
  color: var(--dash-muted);
}

.dash-main {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.dash-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--dash-border);
}
.hero-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 36px;
  font-weight: 600;
  color: var(--dash-text);
  margin: 0 0 8px;
}
.hero-subtitle {
  font-size: 15px;
  color: var(--dash-muted);
  margin: 0;
}
.hero-stats {
  display: flex;
  gap: 16px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 32px;
  background: var(--dash-surface);
  border: 1px solid var(--dash-border);
  border-radius: 12px;
  min-width: 120px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--dash-text);
}
.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--dash-muted);
}
.stat-card.warn .stat-value {
  color: var(--dash-warning);
}
.stat-card.success .stat-value {
  color: var(--dash-success);
}

.dash-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--dash-surface);
  border: 1px solid var(--dash-border);
  border-radius: 10px;
  min-width: 280px;
}
.search-box:focus-within {
  border-color: var(--dash-accent);
}
.search-box svg {
  color: var(--dash-muted);
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--dash-text);
  outline: none;
}
.search-input::placeholder {
  color: var(--dash-muted);
}
.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: none;
  border: none;
  color: var(--dash-muted);
  cursor: pointer;
  border-radius: 50%;
}
.search-clear:hover {
  background: #f5f5f4;
  color: var(--dash-text);
}

.category-tabs {
  display: flex;
  gap: 4px;
  background: var(--dash-surface);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--dash-border);
}
.category-tab {
  padding: 8px 16px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--dash-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}
.category-tab:hover {
  color: var(--dash-text);
}
.category-tab.active {
  background: var(--dash-accent);
  color: white;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.listing-count {
  font-size: 14px;
  font-weight: 500;
  color: var(--dash-muted);
}
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--dash-surface);
  border: 1px solid var(--dash-border);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dash-text);
  cursor: pointer;
  transition: all 0.2s ease;
}
.refresh-btn:hover {
  border-color: var(--dash-accent);
  color: var(--dash-accent);
}

.dash-content {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 32px;
  align-items: start;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  background: var(--dash-surface);
  border: 1px dashed var(--dash-border);
  border-radius: 16px;
  text-align: center;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--dash-border);
  border-top-color: var(--dash-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--dash-accent-soft);
  border-radius: 50%;
  margin-bottom: 20px;
  color: var(--dash-accent);
}
.empty-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--dash-text);
  margin: 0 0 8px;
}
.empty-desc {
  font-size: 14px;
  color: var(--dash-muted);
  margin: 0 0 24px;
}
.empty-action {
  padding: 12px 24px;
  background: var(--dash-accent);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease;
}
.empty-action:hover {
  background: #991b1b;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.listing-card {
  background: var(--dash-surface);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--dash-border);
  transition: all 0.2s ease;
}
.listing-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.listing-image {
  position: relative;
  aspect-ratio: 16/10;
  background: #f5f5f4;
}
.listing-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.listing-status {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--dash-surface);
}
.listing-status.approved {
  color: var(--dash-success);
}
.listing-status.pending {
  color: var(--dash-warning);
}
.listing-status.rejected {
  color: var(--dash-danger);
}

.listing-body {
  padding: 20px;
}
.listing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.listing-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--dash-text);
  margin: 0;
}
.listing-price {
  font-size: 16px;
  font-weight: 700;
  color: var(--dash-accent);
  white-space: nowrap;
}
.listing-meta {
  font-size: 12px;
  color: var(--dash-muted);
  margin: 8px 0 0;
}
.listing-desc {
  font-size: 13px;
  color: var(--dash-muted);
  margin: 12px 0 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.listing-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--dash-border);
}
.listing-location {
  font-size: 12px;
  color: var(--dash-muted);
}
.listing-actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.action-btn.edit {
  background: var(--dash-accent-soft);
  color: var(--dash-accent);
  border: none;
}
.action-btn.edit:hover {
  background: var(--dash-accent);
  color: white;
}
.action-btn.delete {
  background: none;
  border: 1px solid var(--dash-border);
  color: var(--dash-muted);
}
.action-btn.delete:hover {
  border-color: var(--dash-danger);
  color: var(--dash-danger);
}

.inquiries-section {
  background: var(--dash-surface);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--dash-border);
  position: sticky;
  top: 100px;
}
.inquiries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.inquiries-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--dash-text);
  margin: 0;
}
.inquiries-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--dash-muted);
}
.empty-inquiries {
  padding: 32px;
  text-align: center;
  font-size: 14px;
  color: var(--dash-muted);
}
.inquiries-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.inquiry-card {
  padding: 16px;
  background: var(--dash-bg);
  border-radius: 12px;
}
.inquiry-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.inquiry-customer {
  display: flex;
  flex-direction: column;
}
.inquiry-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--dash-text);
}
.inquiry-product {
  font-size: 12px;
  color: var(--dash-muted);
}
.inquiry-date {
  font-size: 11px;
  color: var(--dash-muted);
}
.inquiry-message {
  font-size: 13px;
  color: var(--dash-text);
  line-height: 1.5;
  margin: 0;
}

.mobile-menu-container {
  position: fixed;
  inset: 0;
  z-index: 220;
  display: flex;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.52);
}

.mobile-sidebar {
  position: relative;
  z-index: 1;
  width: min(84vw, 360px);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--dash-border);
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.12);
}

.mobile-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--dash-border);
}

.mobile-close-btn {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: #f5f5f4;
  color: var(--dash-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.mobile-nav-link {
  padding: 16px 18px;
  border-bottom: 1px solid var(--dash-border);
  color: var(--dash-text);
  font-size: 15px;
  font-weight: 600;
}

.mobile-menu-actions {
  margin-top: auto;
  padding: 18px;
  border-top: 6px solid #fafaf9;
  display: grid;
  gap: 10px;
}

.mobile-add-listing-btn {
  width: 100%;
  justify-content: center;
}

.mobile-logout-btn {
  width: 100%;
  min-height: 42px;
  border-radius: 8px;
  border: 1px solid var(--dash-border);
  background: transparent;
  color: var(--dash-text);
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .dash-content {
    grid-template-columns: 1fr;
  }
  .inquiries-section {
    position: static;
  }
}
@media (max-width: 900px) {
  .listings-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .dash-header {
    gap: 12px;
    padding: 16px 20px;
  }
  .mobile-menu-btn {
    display: inline-flex;
  }
  .dash-nav {
    display: none;
  }
  .dash-actions {
    display: none;
  }
  .dash-main {
    padding: 24px 20px;
  }
  .dash-hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }
  .hero-stats {
    width: 100%;
    justify-content: space-between;
  }
  .stat-card {
    flex: 1;
    min-width: 0;
    padding: 16px;
  }
  .dash-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }
  .search-box {
    min-width: 0;
  }
}
</style>
