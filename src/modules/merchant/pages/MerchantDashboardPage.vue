<template>
  <div class="app-container">
    <header class="navbar">
      <div class="logo">Business Hub</div>
      <nav class="nav-links">
        <RouterLink :to="routePaths.merchantDashboard" class="active">Home</RouterLink>
        <RouterLink :to="routePaths.merchantProductCreate">New listing</RouterLink>
        <RouterLink :to="routePaths.userDashboard">Marketplace</RouterLink>
      </nav>
      <div class="user-actions">
        <button class="btn-outline" type="button" @click="router.push(routePaths.merchantProductCreate)">
          Add listing
        </button>
        <button class="icon-btn" type="button" aria-label="Sign out" @click="logout">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
        <div class="avatar" aria-hidden="true"></div>
      </div>
    </header>

    <main class="main-content">
      <section class="hero">
        <h1 class="hero-title">
          Manage your <span class="highlight">Storefront</span>
        </h1>
        <p class="hero-subtitle">
          Keep listings accurate, respond to inquiries, and stay visible to buyers.
        </p>

        <div class="search-container">
          <div class="search-input-wrapper">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search your listings..."
              class="search-input"
            />
          </div>
          <button class="btn-primary" type="button" @click="refresh">
            Refresh
          </button>
        </div>
      </section>

      <section class="filters">
        <div class="filter-header">
          <span class="filter-label">Filter by category</span>
          <p class="filter-meta">
            {{ merchant?.businessName || 'Merchant workspace' }}
          </p>
        </div>

        <div class="category-pills">
          <button
            v-for="category in categories"
            :key="category"
            :class="['pill', { active: activeCategory === category }]"
            type="button"
            @click="activeCategory = category"
          >
            {{ category }}
          </button>
        </div>
      </section>

      <div class="results-meta">
        <p v-if="busy">Loading...</p>
        <p v-else>Showing {{ filteredProducts.length }} of {{ products.length }} listings</p>
      </div>

      <section class="listing-panel">
        <div v-if="busy" class="empty-panel">Loading merchant catalog...</div>
        <div v-else-if="!products.length" class="empty-panel">
          No listings yet. Create your first product to show up in marketplace search.
        </div>
        <div v-else-if="filteredProducts.length" class="listing-grid">
          <article v-for="product in filteredProducts.slice(0, 8)" :key="product.id" class="listing-card">
            <div class="listing-card__top">
              <div>
                <p class="listing-title">{{ product.name }}</p>
                <p class="listing-subtitle">{{ product.category }} · {{ product.availability }}</p>
              </div>
              <p class="listing-price">ETB {{ product.price.toLocaleString() }}</p>
            </div>

            <p class="listing-desc">{{ product.shortDescription }}</p>

            <div class="listing-actions">
              <RouterLink class="btn-outline-sm" :to="getMerchantProductEditPath(product.id)">Edit</RouterLink>
              <button class="btn-ghost-sm" type="button" @click="removeProduct(product.id)">Delete</button>
            </div>
          </article>
        </div>
        <div v-else class="empty-panel">
          No matches for this filter.
        </div>
      </section>

      <section class="inquiry-panel">
        <div class="filter-header">
          <span class="filter-label">Latest inquiries</span>
          <p class="filter-meta">{{ inquiries.length }} total</p>
        </div>

        <div v-if="busy" class="empty-panel">Loading inquiries...</div>
        <div v-else-if="!latestInquiries.length" class="empty-panel">
          No inquiries yet.
        </div>
        <div v-else class="inquiry-grid">
          <article v-for="inquiry in latestInquiries" :key="inquiry.id" class="inquiry-card">
            <div class="inquiry-head">
              <div>
                <p class="inquiry-name">{{ inquiry.customerName }}</p>
                <p class="inquiry-meta">
                  {{ productById[inquiry.productId]?.name || 'Product inquiry' }}
                </p>
              </div>
              <span class="inquiry-date">{{ new Date(inquiry.createdAt).toLocaleDateString() }}</span>
            </div>
            <p class="inquiry-body">{{ inquiry.message }}</p>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { getMerchantProductEditPath, routePaths } from '@/app/router/paths'
import * as api from '@/shared/api/api'
import type { InquiryRecord, MerchantRecord, ProductRecord } from '@/shared/types'
import { useAuthStore } from '@/modules/auth'

const auth = useAuthStore()
const router = useRouter()

const merchant = ref<MerchantRecord | null>(null)
const products = ref<ProductRecord[]>([])
const inquiries = ref<InquiryRecord[]>([])
const busy = ref(true)
const searchQuery = ref('')

const categories = computed(() => [
  'All categories',
  ...Array.from(new Set(products.value.map((product) => product.category))).sort((a, b) => a.localeCompare(b)),
])

const activeCategory = ref('All categories')

const productById = computed(() =>
  products.value.reduce<Record<string, ProductRecord>>((map, product) => {
    map[product.id] = product
    return map
  }, {}),
)

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const category = activeCategory.value

  return products.value.filter((product) => {
    if (category !== 'All categories' && product.category !== category) {
      return false
    }

    if (!query) {
      return true
    }

    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.shortDescription.toLowerCase().includes(query)
    )
  })
})

const latestInquiries = computed(() =>
  [...inquiries.value].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 4),
)

async function refresh() {
  if (!auth.user) {
    return
  }

  busy.value = true
  merchant.value = await api.fetchMerchantByOwner(auth.user.id)

  const merchantRecord = merchant.value
  const [merchantProducts, merchantInquiries] = await Promise.all([
    merchantRecord ? api.fetchMerchantProducts(merchantRecord.id) : Promise.resolve([]),
    api.fetchMerchantInquiries(auth.user.id),
  ])

  products.value = merchantProducts
  inquiries.value = merchantInquiries

  if (!categories.value.includes(activeCategory.value)) {
    activeCategory.value = 'All categories'
  }

  busy.value = false
}

async function removeProduct(productId: string) {
  if (!auth.user) {
    return
  }

  await api.deleteMerchantProduct(auth.user.id, productId)
  await refresh()
}

async function logout() {
  await auth.logout()
  await router.push(routePaths.home)
}

onMounted(refresh)
</script>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--surface);
  min-height: 100vh;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--line);
  border-radius: 18px;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--line);
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-seance-900);
  text-transform: uppercase;
  letter-spacing: -0.5px;
}

.nav-links {
  display: none;
  gap: 1.5rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--muted);
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a.active,
.nav-links a:hover {
  color: var(--primary-deep);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-btn {
  background: none;
  border: none;
  color: rgba(36, 16, 37, 0.82);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.4rem;
  border-radius: 12px;
  transition: background-color 0.2s ease;
}

.icon-btn:hover {
  background: rgba(210, 0, 217, 0.08);
}

.avatar {
  width: 36px;
  height: 36px;
  background-color: var(--color-seance-200);
  border-radius: 50%;
  border: 2px solid var(--primary);
}

.main-content {
  padding: 3rem 2rem;
  max-width: 960px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-title .highlight {
  color: var(--primary-deep);
}

.hero-subtitle {
  font-size: 1.1rem;
  color: var(--muted);
  max-width: 640px;
  margin: 0 auto 2rem;
  line-height: 1.5;
}

.search-container {
  display: flex;
  max-width: 680px;
  margin: 0 auto;
  gap: 0.5rem;
  background: #fff;
  padding: 0.5rem;
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--line);
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 1rem;
  gap: 0.5rem;
}

.search-icon {
  color: var(--primary);
}

.search-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 1rem;
  color: var(--text);
}

.btn-primary {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: var(--primary-deep);
}

.btn-outline {
  border: 1px solid var(--line);
  background: #fff;
  color: var(--text);
  padding: 0.55rem 1rem;
  border-radius: 999px;
  font-weight: 700;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease;
}

.btn-outline:hover {
  transform: translateY(-1px);
  background: rgba(210, 0, 217, 0.06);
}

.filters {
  margin-bottom: 1.5rem;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-label {
  font-weight: 700;
  color: var(--text);
}

.filter-meta {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted);
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.pill {
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  border: 1px solid var(--line);
  background-color: white;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill:hover {
  background-color: var(--color-seance-50);
  border-color: rgba(210, 0, 217, 0.25);
}

.pill.active {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.results-meta {
  font-size: 0.9rem;
  color: var(--muted);
  border-top: 1px solid var(--line);
  padding-top: 1.5rem;
}

.listing-panel,
.inquiry-panel {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
}

.listing-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.listing-card {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 18px;
  padding: 1rem 1rem 0.95rem;
  box-shadow: 0 10px 24px rgba(128, 0, 128, 0.08);
}

.listing-card__top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.listing-title {
  margin: 0;
  font-weight: 800;
  color: var(--text);
}

.listing-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.listing-price {
  margin: 0;
  font-weight: 800;
  color: var(--primary-deep);
}

.listing-desc {
  margin: 0.8rem 0 0;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.listing-actions {
  margin-top: 0.95rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.btn-outline-sm,
.btn-ghost-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.88rem;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--text);
}

.btn-ghost-sm {
  background: rgba(250, 225, 255, 0.36);
}

.btn-outline-sm:hover,
.btn-ghost-sm:hover {
  transform: translateY(-1px);
}

.inquiry-grid {
  margin-top: 1rem;
  display: grid;
  gap: 0.85rem;
}

.inquiry-card {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 18px;
  padding: 1rem;
}

.inquiry-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.inquiry-name {
  margin: 0;
  font-weight: 800;
  color: var(--text);
}

.inquiry-meta {
  margin: 0.25rem 0 0;
  font-size: 0.88rem;
  color: var(--muted);
}

.inquiry-date {
  font-size: 0.82rem;
  color: var(--muted);
}

.inquiry-body {
  margin: 0.75rem 0 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--muted);
}

.empty-panel {
  margin-top: 1rem;
  padding: 1.25rem 1rem;
  border: 1px dashed rgba(128, 0, 128, 0.22);
  border-radius: 18px;
  color: var(--muted);
  background: rgba(253, 241, 255, 0.6);
}

@media (min-width: 860px) {
  .nav-links {
    display: flex;
  }
}

@media (max-width: 760px) {
  .listing-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 2rem;
  }

  .search-container {
    flex-direction: column;
    border-radius: 12px;
    padding: 1rem;
  }

  .search-input-wrapper {
    padding: 0.5rem 0;
    margin-bottom: 0.5rem;
  }

  .btn-primary {
    border-radius: 8px;
    width: 100%;
  }

  .navbar {
    padding: 1.15rem 1.25rem;
  }
}
</style>
