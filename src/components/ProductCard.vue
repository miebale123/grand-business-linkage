<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { MerchantRecord, ProductRecord } from '@/types'

const props = defineProps<{
  product: ProductRecord
  merchant?: MerchantRecord
  showMerchantLink?: boolean
}>()

const priceLabel = computed(() => `ETB ${props.product.price.toLocaleString()}`)
</script>

<template>
  <article class="content-card stack" style="gap: 12px">
    <img
      :src="product.image"
      :alt="product.name"
      style="width: 100%; height: 180px; object-fit: cover; border-radius: 18px"
    />

    <div class="inline" style="justify-content: space-between; align-items: flex-start">
      <div class="stack" style="gap: 6px">
        <span class="tag">{{ product.category }}</span>
        <h3 style="font-size: 1.1rem">{{ product.name }}</h3>
      </div>

      <span class="tag">{{ product.availability }}</span>
    </div>

    <p class="muted" style="margin: 0">{{ product.shortDescription }}</p>

    <div class="inline" style="justify-content: space-between">
      <strong style="font-size: 1.15rem">{{ priceLabel }}</strong>
      <RouterLink class="button-secondary" :to="`/products/${product.id}`">View details</RouterLink>
    </div>

    <RouterLink
      v-if="merchant && showMerchantLink"
      class="button-ghost"
      :to="`/merchants/${merchant.id}`"
    >
      Visit {{ merchant.businessName }}
    </RouterLink>
  </article>
</template>
