<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRoute } from 'vue-router'

import ProductCard from '@/modules/marketplace/components/ProductCard.vue'
import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import type { MerchantRecord, ProductRecord } from '@/shared/types'

const route = useRoute()
const merchant = ref<MerchantRecord | null>(null)
const products = ref<ProductRecord[]>([])
const areaMerchants = ref<MerchantRecord[]>([])
const preferredArea = ref(api.getPreferredMarketplaceArea())
const loading = ref(true)

const categoryHighlights = computed(() => [...new Set(products.value.map((product) => product.category))])
const inStockCount = computed(() =>
  products.value.filter((product) => product.availability === 'In Stock').length,
)

onMounted(async () => {
  const merchantId = route.params.id as string
  merchant.value = await api.fetchMerchantById(merchantId)
  products.value = await api.fetchMerchantCatalog(merchantId)

  if (preferredArea.value && merchant.value) {
    areaMerchants.value = await api.fetchMerchantsByArea(preferredArea.value, {
      excludeMerchantId: merchant.value.id,
      limit: 3,
    })
  }

  loading.value = false
})
</script>

<template>
  <AppShell>
    <section v-if="loading" class="empty-panel">Loading storefront...</section>

    <template v-else-if="merchant">
      <section class="shell-panel px-6 py-7 sm:px-8">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div>
            <p class="section-eyebrow">Seller storefront</p>
            <h1 class="section-title">{{ merchant.businessName }}</h1>
            <p class="section-copy max-w-3xl">{{ merchant.description }}</p>

            <div class="mt-5 flex flex-wrap gap-3">
              <span class="chip !px-4 !py-2">{{ merchant.category }}</span>
              <span class="chip !px-4 !py-2">{{ merchant.location }}</span>
              <span class="chip !px-4 !py-2" :class="merchant.verified ? 'chip-good' : 'chip-muted'">
                {{ merchant.verified ? 'Verified seller' : 'Pending review' }}
              </span>
              <span
                v-for="area in merchant.deliveryAreas.slice(0, 3)"
                :key="area"
                class="chip chip-muted !px-4 !py-2"
              >
                Delivers to {{ area }}
              </span>
            </div>
          </div>

          <div class="rounded-[28px] bg-[var(--surface-alt)] p-5">
            <p class="text-sm font-semibold text-[var(--text)]">Store snapshot</p>
            <div class="mt-4 space-y-3 text-sm text-[var(--muted)]">
              <p>{{ products.length }} product{{ products.length === 1 ? '' : 's' }} published</p>
              <p>{{ inStockCount }} currently in stock</p>
              <p>{{ categoryHighlights.length }} catalog categor{{ categoryHighlights.length === 1 ? 'y' : 'ies' }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-8">
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="section-eyebrow">Catalog</p>
            <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
              Products from this seller
            </h2>
          </div>
          <div class="flex flex-wrap gap-3">
            <span v-for="category in categoryHighlights" :key="category" class="chip !px-4 !py-2">
              {{ category }}
            </span>
          </div>
        </div>

        <div v-if="products.length" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <ProductCard v-for="product in products" :key="product.id" :product="product" />
        </div>
        <div v-else class="empty-panel">No products have been published yet.</div>
      </section>

      <section v-if="preferredArea && areaMerchants.length" class="mt-8">
        <div class="mb-5">
          <p class="section-eyebrow">Other sellers in {{ preferredArea }}</p>
          <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
            Compare listings from trusted local shops
          </h2>
        </div>

        <div class="grid gap-5 md:grid-cols-3">
          <RouterLink
            v-for="merchantRecord in areaMerchants"
            :key="merchantRecord.id"
            :to="`/merchants/${merchantRecord.id}`"
            class="shell-panel px-5 py-5 transition hover:-translate-y-1"
          >
            <p class="font-heading text-2xl font-semibold tracking-tight text-[var(--text)]">
              {{ merchantRecord.businessName }}
            </p>
            <p class="mt-2 text-sm text-[var(--muted)]">{{ merchantRecord.location }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="chip chip-muted">{{ merchantRecord.category }}</span>
            </div>
          </RouterLink>
        </div>
      </section>
    </template>
  </AppShell>
</template>
