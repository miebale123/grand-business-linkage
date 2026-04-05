<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import ProductCard from '@/components/ProductCard.vue'
import AppShell from '@/layouts/AppShell.vue'
import * as mockApi from '@/services/mockApi'
import type { MerchantRecord, ProductRecord } from '@/types'

const route = useRoute()
const merchant = ref<MerchantRecord | null>(null)
const products = ref<ProductRecord[]>([])

onMounted(async () => {
  const merchantId = route.params.id as string
  merchant.value = await mockApi.fetchMerchantById(merchantId)
  products.value = await mockApi.fetchMerchantCatalog(merchantId)
})
</script>

<template>
  <AppShell>
    <section v-if="merchant" class="panel" style="padding: 26px; margin-bottom: 24px">
      <p class="eyebrow">Merchant profile</p>
      <div class="page-header" style="margin-bottom: 0">
        <div>
          <h1 class="page-title" style="font-size: 2.2rem">{{ merchant.businessName }}</h1>
          <p class="page-copy">{{ merchant.description }}</p>
        </div>

        <div class="stack" style="align-items: flex-start">
          <span class="tag">{{ merchant.category }}</span>
          <span class="tag">{{ merchant.location }}</span>
          <span class="tag">{{ merchant.verified ? 'Verified' : 'Pending review' }}</span>
        </div>
      </div>
    </section>

    <section>
      <div class="page-header">
        <div>
          <p class="eyebrow">Catalog</p>
          <h2 class="page-title" style="font-size: 2rem">Products from this merchant</h2>
        </div>
      </div>

      <div v-if="products.length" class="card-grid">
        <ProductCard v-for="product in products" :key="product.id" :product="product" />
      </div>
      <div v-else class="empty-state">No products have been published yet.</div>
    </section>
  </AppShell>
</template>
