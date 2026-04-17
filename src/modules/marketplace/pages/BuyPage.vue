<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import ProductCard from '@/modules/marketplace/components/ProductCard.vue'
import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import SearchBar from '@/shared/ui/SearchBar.vue'
import FilterSidebar from '@/shared/ui/FilterSidebar.vue'
import type {
  CatalogMetadata,
  MarketplaceAreaRecord,
  MarketplaceConfig,
  MerchantRecord,
  ProductRecord,
} from '@/shared/types'

const router = useRouter()
const route = useRoute()

const products = ref<ProductRecord[]>([])
const merchants = ref<MerchantRecord[]>([])
const areas = ref<MarketplaceAreaRecord[]>([])
const marketplaceConfig = ref<MarketplaceConfig | null>(null)
const catalogMetadata = ref<CatalogMetadata | null>(null)
const loading = ref(true)

const searchQuery = ref('')
const showFilters = ref(false)
const selectedCategory = ref('')
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)

function readQueryString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

const queryArea = computed(() => readQueryString(route.query.area) || 'All Areas')
const queryCategory = computed(() => readQueryString(route.query.category) || 'All')

const areaOptions = computed(() => {
  const unique = [...new Set(areas.value.map((a) => a.area).filter(Boolean))]
  return ['All Areas', ...unique]
})

const merchantsById = computed(() =>
  Object.fromEntries(merchants.value.map((merchant) => [merchant.id, merchant])),
)

const categoryOptions = computed(() => {
  if (catalogMetadata.value?.categories?.length) {
    return catalogMetadata.value.categories
  }
  const categories = [...new Set(products.value.map((p) => p.category))]
  return categories
})

const filteredProducts = computed(() => {
  const listingType = route.name === 'rent' ? 'For Rent' : 'For Sale'
  return products.value.filter((p) => {
    if (p.status !== 'approved') return false
    if (p.listingType && p.listingType !== listingType) return false
    if (selectedCategory.value && p.category !== selectedCategory.value) return false
    if (minPrice.value !== null && (p.price ?? 0) < minPrice.value) return false
    if (maxPrice.value !== null && (p.price ?? 0) > maxPrice.value) return false
    return true
  })
})

function handleSearch(query: string) {
  const nextQuery = { ...route.query }
  const trimmed = query.trim()

  if (trimmed) {
    nextQuery.q = trimmed
  } else {
    delete nextQuery.q
  }

  router.push({ query: nextQuery })
}

async function fetchProducts() {
  loading.value = true

  const q = readQueryString(route.query.q)
  const area = queryArea.value
  const category = queryCategory.value

  searchQuery.value = q

  const filters = {
    status: 'approved' as const,
    search: q || undefined,
    category: category !== 'All' ? category : undefined,
    area: area !== 'All Areas' ? area : undefined,
  }

  products.value = await api.fetchProducts(filters)
  loading.value = false
}

onMounted(async () => {
  const [merchantRecords, areaRecords, config, metadata] = await Promise.all([
    api.fetchMerchants(),
    api.fetchMarketplaceAreas(),
    api.fetchMarketplaceConfig(),
    api.fetchCatalogMetadata(),
  ])

  merchants.value = merchantRecords
  areas.value = areaRecords
  marketplaceConfig.value = config
  catalogMetadata.value = metadata
})

watch(
  () => route.query,
  () => {
    fetchProducts()
  },
  { immediate: true },
)
</script>

<template>
  <AppShell>
    <div class="listings-page">
      <div class="listings-hero">
        <SearchBar
          v-model="searchQuery"
          placeholder="Search products, services, businesses..."
          :locations="areaOptions"
          :initialLocation="queryArea"
          @search="handleSearch"
          @update:location="
            async (area) => {
              const nextQuery = { ...route.query }

              if (area && area !== 'All Areas') nextQuery.area = area
              else delete nextQuery.area

              await router.push({ query: nextQuery })
            }
          "
        />
      </div>

      <div class="listings-toolbar">
        <div class="toolbar-left">
          <button class="filter-btn" type="button" @click="showFilters = true">
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
            <span v-if="selectedCategory || minPrice || maxPrice" class="filter-badge">
              {{ (selectedCategory ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) }}
            </span>
          </button>
          <span class="results-label">
            {{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'result' : 'results' }}
            <span v-if="searchQuery">for "{{ searchQuery }}"</span>
          </span>
        </div>
      </div>

      <div class="listings-content">
        <div v-if="loading" class="listings-loading">
          <div class="loading-ring"></div>
          <p>Finding listings...</p>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="listings-empty">
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
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h3>No listings found</h3>
          <p>Try adjusting your search or filters</p>
        </div>

        <div v-else class="listings-grid">
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
            :merchant="merchantsById[product.merchantId]"
            variant="compact"
          />
        </div>
      </div>
    </div>

    <FilterSidebar
      v-model="showFilters"
      :categoryOptions="categoryOptions"
      :selectedCategory="selectedCategory"
      :minPrice="minPrice"
      :maxPrice="maxPrice"
      @update:selectedCategory="selectedCategory = $event"
      @update:minPrice="minPrice = $event"
      @update:maxPrice="maxPrice = $event"
    />
  </AppShell>
</template>

