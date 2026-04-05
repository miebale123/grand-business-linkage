<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import AppShell from '@/layouts/AppShell.vue'
import ProductCard from '@/components/ProductCard.vue'
import StatCard from '@/components/StatCard.vue'
import * as mockApi from '@/services/mockApi'
import type { MerchantRecord, ProductRecord } from '@/types'

const loading = ref(true)
const products = ref<ProductRecord[]>([])
const merchants = ref<MerchantRecord[]>([])

const filters = reactive({
  search: '',
  category: 'All',
  availability: 'All',
})

const categories = computed(() => [
  'All',
  ...new Set(products.value.map((product) => product.category)),
])

const merchantById = computed(() =>
  merchants.value.reduce<Record<string, MerchantRecord>>((map, merchant) => {
    map[merchant.id] = merchant
    return map
  }, {}),
)

const stats = computed(() => [
  {
    label: 'Products indexed',
    value: products.value.length,
    detail: 'Searchable listings across visible merchants.',
  },
  {
    label: 'Verified merchants',
    value: merchants.value.filter((merchant) => merchant.verified).length,
    detail: 'Businesses that have approved marketplace presence.',
  },
  {
    label: 'In-stock results',
    value: products.value.filter((product) => product.availability === 'In Stock').length,
    detail: 'Useful for urgent or exact-match searches.',
  },
  {
    label: 'Categories',
    value: categories.value.length - 1,
    detail: 'Structured search areas available in the MVP.',
  },
])

async function loadProducts() {
  loading.value = true
  products.value = await mockApi.fetchProducts(filters)
  loading.value = false
}

onMounted(async () => {
  const [allProducts, merchantRecords] = await Promise.all([
    mockApi.fetchProducts(),
    mockApi.fetchMerchants(),
  ])

  products.value = allProducts
  merchants.value = merchantRecords
  loading.value = false
})
</script>

<template>
  <AppShell>
    <section class="page-header">
      <div>
        <p class="eyebrow">User workspace</p>
        <h1 class="page-title">Find products without guessing which merchant has them.</h1>
        <p class="page-copy">
          This screen proves the core business case: discovery. Search by name, filter by category,
          and go directly from product discovery to merchant inquiry.
        </p>
      </div>
    </section>

    <section class="stats-grid" style="margin-bottom: 24px">
      <StatCard
        v-for="metric in stats"
        :key="metric.label"
        :label="metric.label"
        :value="metric.value"
        :detail="metric.detail"
      />
    </section>

    <section class="panel" style="padding: 22px; margin-bottom: 24px">
      <div class="form-grid">
        <label class="label">
          Search products
          <input
            v-model="filters.search"
            class="input"
            type="text"
            placeholder="Try blood pressure, vitamin, syrup..."
          />
        </label>

        <label class="label">
          Category
          <select v-model="filters.category" class="select">
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </label>

        <label class="label">
          Availability
          <select v-model="filters.availability" class="select">
            <option value="All">All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </label>

        <div class="label" style="justify-content: flex-end">
          <span class="hint">Apply the current filters to the mock catalog.</span>
          <button class="button" type="button" @click="loadProducts">Search now</button>
        </div>
      </div>
    </section>

    <section v-if="loading" class="empty-state">Loading marketplace results...</section>
    <section v-else-if="products.length" class="card-grid">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        :merchant="merchantById[product.merchantId]"
        :show-merchant-link="true"
      />
    </section>
    <section v-else class="empty-state">
      No products match the current search. Try a wider keyword or reset the filters.
    </section>
  </AppShell>
</template>
