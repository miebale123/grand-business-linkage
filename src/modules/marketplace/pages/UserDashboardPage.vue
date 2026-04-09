<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ProductCard from '@/modules/marketplace/components/ProductCard.vue'
import { useAuthStore } from '@/modules/auth'
import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import type { CatalogMetadata, MarketplaceAreaRecord, MerchantRecord, ProductAvailability, ProductRecord } from '@/shared/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const products = ref<ProductRecord[]>([])
const merchants = ref<MerchantRecord[]>([])
const areas = ref<MarketplaceAreaRecord[]>([])
const catalogMetadata = ref<CatalogMetadata | null>(null)

const filters = reactive({
  search: '',
  category: 'All',
  availability: 'All' as 'All' | ProductAvailability,
  area: 'All Areas',
})

const merchantById = computed(() =>
  merchants.value.reduce<Record<string, MerchantRecord>>((map, merchant) => {
    map[merchant.id] = merchant
    return map
  }, {}),
)

const accountArea = computed(() => api.getAreaLabel(auth.user?.location))
const categoryOptions = computed(() => ['All', ...(catalogMetadata.value?.categories ?? [])])
const availabilityOptions = computed(() => ['All', ...(catalogMetadata.value?.availabilityOptions ?? [])])
const resultLabel = computed(() => `${products.value.length} product${products.value.length === 1 ? '' : 's'}`)
const visibleAreas = computed(() => areas.value.slice(0, 6))

function readQueryValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function syncFiltersFromRoute() {
  filters.search = readQueryValue(route.query.search)
  filters.category = readQueryValue(route.query.category) || 'All'
  filters.availability = (readQueryValue(route.query.availability) as 'All' | ProductAvailability) || 'All'
  filters.area =
    readQueryValue(route.query.area) || accountArea.value || api.getPreferredMarketplaceArea() || 'All Areas'
}

async function refreshProducts() {
  loading.value = true

  if (filters.area !== 'All Areas') {
    api.savePreferredMarketplaceArea(filters.area)
  } else {
    api.savePreferredMarketplaceArea()
  }

  products.value = await api.fetchProducts({
    search: filters.search,
    category: filters.category,
    availability: filters.availability,
    area: filters.area,
  })

  loading.value = false
}

async function applyFilters() {
  await router.replace({
    query: {
      search: filters.search || undefined,
      category: filters.category !== 'All' ? filters.category : undefined,
      availability: filters.availability !== 'All' ? filters.availability : undefined,
      area: filters.area !== 'All Areas' ? filters.area : undefined,
    },
  })
}

async function useArea(area: string) {
  filters.area = area
  await applyFilters()
}

watch(
  () => route.fullPath,
  async () => {
    syncFiltersFromRoute()
    await refreshProducts()
  },
)

onMounted(async () => {
  const [merchantRecords, areaRecords, metadata] = await Promise.all([
    api.fetchMerchants(),
    api.fetchMarketplaceAreas(),
    api.fetchCatalogMetadata(),
  ])

  merchants.value = merchantRecords
  areas.value = areaRecords
  catalogMetadata.value = metadata
  syncFiltersFromRoute()
  await refreshProducts()
})
</script>

<template>
  <AppShell>
    <section class="shell-panel px-6 py-7 sm:px-8">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_340px] lg:items-end">
        <div>
          <p class="section-eyebrow">Marketplace search</p>
          <h1 class="section-title">Browse live catalog data from the mock backend.</h1>
          <p class="section-copy max-w-3xl">
            Search by product, seller, or area. Category, availability, and neighborhood filters now
            resolve through the API instead of relying on client-side placeholder data.
          </p>
        </div>

        <div class="rounded-[28px] bg-[var(--surface-alt)] p-5">
          <p class="text-sm font-semibold text-[var(--text)]">Current scope</p>
          <div class="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
            <p>{{ resultLabel }} returned</p>
            <p>Area: {{ filters.area }}</p>
            <p>Category: {{ filters.category }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-8 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="space-y-6">
        <section class="shell-panel px-6 py-7">
          <p class="section-eyebrow">Filters</p>
          <h2 class="font-heading text-2xl font-semibold tracking-tight text-[var(--text)]">
            Refine the marketplace
          </h2>

          <div class="mt-6 space-y-4">
            <label class="field-label">
              Search
              <input
                v-model="filters.search"
                class="input-field"
                type="text"
                placeholder="Speaker, Piassa, pantry, kids..."
                @keydown.enter.prevent="applyFilters"
              />
            </label>

            <label class="field-label">
              Category
              <select v-model="filters.category" class="select-field">
                <option v-for="category in categoryOptions" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </label>

            <label class="field-label">
              Availability
              <select v-model="filters.availability" class="select-field">
                <option v-for="option in availabilityOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </label>

            <label class="field-label">
              Area
              <select v-model="filters.area" class="select-field">
                <option value="All Areas">All Areas</option>
                <option v-for="area in areas" :key="area.area" :value="area.area">
                  {{ area.area }}
                </option>
              </select>
            </label>

            <button class="btn-primary w-full" type="button" @click="applyFilters">Apply filters</button>
          </div>
        </section>

        <section class="shell-panel px-6 py-7">
          <p class="section-eyebrow">Area shortcuts</p>
          <h2 class="font-heading text-2xl font-semibold tracking-tight text-[var(--text)]">
            Shop by neighborhood
          </h2>

          <div class="mt-5 flex flex-wrap gap-3">
            <button class="chip !px-4 !py-2" type="button" @click="useArea('All Areas')">All Areas</button>
            <button
              v-for="area in visibleAreas"
              :key="area.area"
              class="chip !px-4 !py-2"
              type="button"
              @click="useArea(area.area)"
            >
              {{ area.area }} · {{ area.productCount }}
            </button>
          </div>
        </section>
      </aside>

      <section>
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="section-eyebrow">Results</p>
            <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
              {{ resultLabel }}
            </h2>
          </div>

          <p class="text-sm text-[var(--muted)]">
            {{ loading ? 'Loading products...' : 'Fetched from the API using the active filters.' }}
          </p>
        </div>

        <div v-if="loading" class="empty-panel">Loading marketplace products...</div>
        <div v-else-if="products.length" class="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
            :merchant="merchantById[product.merchantId]"
            :show-merchant-link="true"
            :reference-area="filters.area !== 'All Areas' ? filters.area : accountArea || undefined"
          />
        </div>
        <div v-else class="empty-panel">
          No products matched the current API filters.
        </div>
      </section>
    </section>
  </AppShell>
</template>
