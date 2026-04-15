<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { buildRegisterLocation, routePaths } from '@/app/router/paths'
import { useAuthStore } from '@/modules/auth'
import { useFavorites } from '@/modules/marketplace/composables/useFavorites'
import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import SearchBar from '@/shared/ui/SearchBar.vue'
import type {
  CatalogMetadata,
  MarketplaceAreaRecord,
  MerchantRecord,
  ProductRecord,
} from '@/shared/types'

const DEFAULT_AREA = 'Addis Ababa'

const auth = useAuthStore()
const router = useRouter()
const { isFavorite, toggleFavorite } = useFavorites()
const featured = ref<ProductRecord[]>([])
const products = ref<ProductRecord[]>([])
const merchants = ref<MerchantRecord[]>([])
const areas = ref<MarketplaceAreaRecord[]>([])
const exactLocationSpotlights = ref<MerchantRecord[]>([])
const catalogMetadata = ref<CatalogMetadata | null>(null)
const loading = ref(true)
const isSearchActive = ref(false)

const heroSearch = reactive({
  search: '',
  category: 'All',
  area: 'All Areas',
  sortBy: '' as '' | 'price_asc' | 'price_desc' | 'newest' | 'oldest',
})

const accountArea = computed(() => api.getAreaLabel(auth.user?.location))
const selectedArea = computed(() =>
  heroSearch.area !== 'All Areas'
    ? heroSearch.area
    : accountArea.value || api.getPreferredMarketplaceArea(),
)
const areaOptions = computed(() => {
  const normalized = areas.value
    .map((record) => record.area.trim())
    .filter((area) => area.length > 0)
    .reduce<Map<string, string>>((map, area) => {
      const key = area.toLowerCase()
      if (!map.has(key)) {
        map.set(key, area)
      }
      return map
    }, new Map())

  if (!normalized.has(DEFAULT_AREA.toLowerCase())) {
    normalized.set(DEFAULT_AREA.toLowerCase(), DEFAULT_AREA)
  }

  const uniqueAreas = Array.from(normalized.values()).sort((a, b) => a.localeCompare(b))
  return [
    DEFAULT_AREA,
    ...uniqueAreas.filter((area) => area.toLowerCase() !== DEFAULT_AREA.toLowerCase()),
  ]
})

onMounted(async () => {
  const [allProducts, featuredProducts, merchantRecords, areaRecords, metadata] = await Promise.all(
    [
      api.fetchProducts({ status: 'approved' }),
      api.fetchFeaturedProducts(),
      api.fetchMerchants(),
      api.fetchMarketplaceAreas(),
      api.fetchCatalogMetadata(),
    ],
  )

  products.value = allProducts
  featured.value = featuredProducts.slice(0, 6)
  merchants.value = merchantRecords
  areas.value = areaRecords
  catalogMetadata.value = metadata

  heroSearch.area = api.getPreferredMarketplaceArea() || accountArea.value || DEFAULT_AREA

  await refreshLocationSpotlights(selectedArea.value)
  loading.value = false
})

watch(
  () => heroSearch.area,
  async (area) => {
    if (area === 'All Areas') {
      api.savePreferredMarketplaceArea()
      await refreshLocationSpotlights(accountArea.value || api.getPreferredMarketplaceArea())
      return
    }

    api.savePreferredMarketplaceArea(area)
    await refreshLocationSpotlights(area)
  },
)

const productCategories = computed(() => [
  ...new Set(products.value.map((product) => product.category)),
])
const searchCategories = computed(() => [
  'All',
  ...(catalogMetadata.value?.categories.length
    ? catalogMetadata.value.categories
    : productCategories.value),
])

const categoryHighlights = computed(() =>
  productCategories.value.slice(0, 5).map((category) => ({
    name: category,
    count: products.value.filter((product) => product.category === category).length,
  })),
)
const spotlightMerchants = computed(() => merchants.value.slice(0, 3))
const spotlightCards = computed(() =>
  exactLocationSpotlights.value.length
    ? exactLocationSpotlights.value.map((merchant) => ({ merchant }))
    : spotlightMerchants.value.map((merchant) => ({ merchant })),
)

const searchResults = computed(() => {
  if (!isSearchActive.value) return []

  let filtered = products.value.filter((p) => p.status === 'approved')

  if (heroSearch.search) {
    const query = heroSearch.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.shortDescription.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query),
    )
  }

  if (heroSearch.area && heroSearch.area !== 'All Areas') {
    filtered = filtered.filter((p) => {
      const merchant = merchants.value.find((m) => m.id === p.merchantId)
      return p.location === heroSearch.area || merchant?.location === heroSearch.area
    })
  }

  if (heroSearch.category && heroSearch.category !== 'All') {
    filtered = filtered.filter((p) => p.category === heroSearch.category)
  }

  if (heroSearch.sortBy === 'price_asc') {
    filtered.sort((a, b) => (a.reducedPrice || a.price) - (b.reducedPrice || b.price))
  } else if (heroSearch.sortBy === 'price_desc') {
    filtered.sort((a, b) => (b.reducedPrice || b.price) - (a.reducedPrice || a.price))
  } else if (heroSearch.sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (heroSearch.sortBy === 'oldest') {
    filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  return filtered
})

function openMarketplace() {
  if (heroSearch.area !== 'All Areas') {
    api.savePreferredMarketplaceArea(heroSearch.area)
  }
  isSearchActive.value = true
}

function clearSearch() {
  isSearchActive.value = false
  heroSearch.search = ''
}

async function refreshLocationSpotlights(area?: string) {
  if (!area) {
    exactLocationSpotlights.value = []
    return
  }

  exactLocationSpotlights.value = await api.fetchMerchantsByArea(area, {
    limit: 3,
  })
}

function setSearch(term: string) {
  heroSearch.search = term
  openMarketplace()
}
</script>

<template>
  <AppShell>
    <div class="landing-page">
      <section class="hero-section">
        <SearchBar
          v-model="heroSearch.search"
          placeholder="Search products..."
          :locations="['All Areas', ...areaOptions]"
          @search="openMarketplace"
          @update:location="(area) => (heroSearch.area = area)"
          @update:sort="(sort) => (heroSearch.sortBy = sort as typeof heroSearch.sortBy)"
        />
        <div class="search-actions">
          <button class="action-btn" type="button" @click="openMarketplace">
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
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Save Search
          </button>
          <button class="action-btn" type="button" @click="openMarketplace">
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
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
          </button>
        </div>
        <div class="search-tags">
          <span class="tag-label">Popular:</span>
          <button class="tag-pill" type="button" @click="setSearch('Speaker')">Speakers</button>
          <button class="tag-pill" type="button" @click="setSearch('Furniture')">Furniture</button>
          <button class="tag-pill" type="button" @click="setSearch('Electronics')">
            Electronics
          </button>
          <button class="tag-pill" type="button" @click="setSearch('Kitchen')">Kitchen</button>
        </div>
      </section>

      <section v-if="isSearchActive" class="search-results-section">
        <div class="results-header">
          <h2 class="results-title">
            {{ searchResults.length }} result{{ searchResults.length === 1 ? '' : 's' }}
            <span v-if="heroSearch.search">for "{{ heroSearch.search }}"</span>
          </h2>
          <button class="clear-search-btn" type="button" @click="clearSearch">
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div v-if="searchResults.length === 0" class="no-results">
          <p>No products found. Try adjusting your search or filters.</p>
        </div>

        <div v-else class="results-grid">
          <article v-for="product in searchResults" :key="product.id" class="product-tile">
            <div class="tile-media">
              <RouterLink :to="`/products/${product.id}`" class="tile-link">
                <img :src="product.image" :alt="product.name" class="tile-image" />
                <div class="tile-badges">
                  <span class="tile-badge">{{ product.category }}</span>
                  <span
                    class="tile-badge availability"
                    :class="
                      product.availability === 'In Stock'
                        ? 'instock'
                        : product.availability === 'Low Stock'
                          ? 'lowstock'
                          : 'outstock'
                    "
                  >
                    {{ product.availability }}
                  </span>
                </div>
              </RouterLink>
              <button
                class="tile-favorite"
                type="button"
                :aria-label="isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'"
                @click.prevent="toggleFavorite(product.id)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  :fill="isFavorite(product.id) ? 'var(--primary)' : 'none'"
                  :stroke="isFavorite(product.id) ? 'var(--primary)' : 'currentColor'"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </button>
            </div>
            <RouterLink :to="`/products/${product.id}`" class="tile-body">
              <div class="tile-info">
                <span class="tile-price">ETB {{ product.price.toLocaleString() }}</span>
                <span class="tile-condition">{{ product.condition }}</span>
              </div>
              <h3 class="tile-name">{{ product.name }}</h3>
              <p class="tile-desc">{{ product.shortDescription }}</p>
              <div class="tile-merchant" v-if="merchants.find((m) => m.id === product.merchantId)">
                <span class="merchant-name">{{
                  merchants.find((m) => m.id === product.merchantId)?.businessName
                }}</span>
                <span class="merchant-location">{{
                  product.location || merchants.find((m) => m.id === product.merchantId)?.location
                }}</span>
              </div>
            </RouterLink>
          </article>
        </div>
      </section>

      <section v-else class="featured-section">
        <div class="featured-header">
          <h2 class="featured-title">Featured Products</h2>
        </div>

        <div v-if="loading" class="featured-loading">
          <div class="loading-spinner"></div>
        </div>
        <div v-else class="featured-grid">
          <article v-for="product in featured" :key="product.id" class="product-tile">
            <div class="tile-media">
              <RouterLink :to="`/products/${product.id}`" class="tile-link">
                <img :src="product.image" :alt="product.name" class="tile-image" />
                <div class="tile-badges">
                  <span class="tile-badge">{{ product.category }}</span>
                  <span
                    class="tile-badge availability"
                    :class="
                      product.availability === 'In Stock'
                        ? 'instock'
                        : product.availability === 'Low Stock'
                          ? 'lowstock'
                          : 'outstock'
                    "
                  >
                    {{ product.availability }}
                  </span>
                </div>
              </RouterLink>
              <button
                class="tile-favorite"
                type="button"
                :aria-label="isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'"
                @click.prevent="toggleFavorite(product.id)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  :fill="isFavorite(product.id) ? 'var(--primary)' : 'none'"
                  :stroke="isFavorite(product.id) ? 'var(--primary)' : 'currentColor'"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </button>
            </div>
            <RouterLink :to="`/products/${product.id}`" class="tile-body">
              <div class="tile-info">
                <span class="tile-price">ETB {{ product.price.toLocaleString() }}</span>
                <span class="tile-condition">{{ product.condition }}</span>
              </div>
              <h3 class="tile-name">{{ product.name }}</h3>
              <p class="tile-desc">{{ product.shortDescription }}</p>
              <div class="tile-merchant" v-if="merchants.find((m) => m.id === product.merchantId)">
                <span class="merchant-name">{{
                  merchants.find((m) => m.id === product.merchantId)?.businessName
                }}</span>
                <span class="merchant-location">{{
                  product.location || merchants.find((m) => m.id === product.merchantId)?.location
                }}</span>
                <a class="merchant-phone" :href="`tel:${product.phone.replace(/[^\d+]/g, '')}`">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    />
                  </svg>
                  {{ product.phone }}
                </a>
              </div>
            </RouterLink>
          </article>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.landing-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hero-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary-deep);
}

.search-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.tag-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
}

.tag-pill {
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--line);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-pill:hover {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary-deep);
}

.search-results-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.clear-search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: var(--surface);
  border-color: var(--primary);
  color: var(--primary);
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.featured-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.featured-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.featured-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
  margin: 0;
}

.featured-link {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary);
}

.featured-loading {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--surface-strong);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.featured-grid {
  display: grid;
  gap: 20px;
}

@media (min-width: 640px) {
  .featured-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .featured-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.product-tile {
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(165deg, #ffffff 0%, rgba(253, 241, 255, 0.85) 100%);
  border: 1px solid rgba(128, 0, 128, 0.14);
  transition: all 0.25s ease;
  box-shadow: 0 8px 24px rgba(128, 0, 128, 0.06);
}

.product-tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px rgba(128, 0, 128, 0.14);
}

.tile-link {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}

.tile-media {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.tile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.product-tile:hover .tile-image {
  transform: scale(1.05);
}

.tile-badges {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
}

.tile-badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(128, 0, 128, 0.14);
  color: rgba(36, 16, 37, 0.85);
}

.tile-badge.availability.instock {
  background: rgba(29, 155, 108, 0.12);
  color: #176c4d;
}

.tile-badge.availability.lowstock {
  background: rgba(239, 179, 65, 0.14);
  color: #8b5d0b;
}

.tile-badge.availability.outstock {
  background: rgba(190, 24, 93, 0.1);
  color: #be185d;
}

.tile-body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
}

.tile-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tile-price {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text);
}

.tile-condition {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  background: rgba(36, 16, 37, 0.05);
  border-radius: 999px;
  color: var(--muted);
}

.tile-favorite {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.tile-favorite:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tile-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tile-desc {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tile-merchant {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(128, 0, 128, 0.1);
}

.merchant-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text);
}

.merchant-location {
  font-size: 0.72rem;
  color: var(--muted);
}

.merchant-phone {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--muted);
  text-decoration: none;
}

.merchant-phone:hover {
  color: var(--primary);
}

.sellers-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sellers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sellers-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
  margin: 0;
}

.sellers-link {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary);
}

.sellers-grid {
  display: grid;
  gap: 20px;
}

@media (min-width: 768px) {
  .sellers-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.seller-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(165deg, #ffffff 0%, rgba(253, 241, 255, 0.88) 100%);
  border: 1px solid rgba(128, 0, 128, 0.14);
  color: inherit;
  text-decoration: none;
  transition: all 0.25s ease;
}

.seller-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(128, 0, 128, 0.12);
}

.seller-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.seller-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.seller-location {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0;
}

.seller-badge {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
}

.seller-badge.verified {
  background: rgba(29, 155, 108, 0.12);
  color: #176c4d;
}

.seller-badge.pending {
  background: rgba(36, 16, 37, 0.06);
  color: var(--muted);
}

.seller-desc {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
