<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { useFavorites } from '@/modules/marketplace/composables/useFavorites'
import type { MerchantRecord, ProductRecord } from '@/shared/types'

const props = defineProps<{
  product: ProductRecord
  merchant?: MerchantRecord
  showMerchantLink?: boolean
  showFavoriteButton?: boolean
  distanceKm?: number | null
  referenceArea?: string
}>()

const { isFavorite, toggleFavorite } = useFavorites()

const priceLabel = computed(() => {
  if (props.product.reducedPrice && props.product.reducedPrice < props.product.price) {
    return `ETB ${props.product.reducedPrice.toLocaleString()}`
  }
  return `ETB ${props.product.price.toLocaleString()}`
})
const originalPriceLabel = computed(() => {
  if (props.product.reducedPrice && props.product.reducedPrice < props.product.price) {
    return `ETB ${props.product.price.toLocaleString()}`
  }
  return null
})
const hasDiscount = computed(
  () =>
    props.product.reducedPrice != null &&
    props.product.reducedPrice > 0 &&
    props.product.reducedPrice < props.product.price,
)
const availabilityTone = computed(() => {
  if (props.product.availability === 'In Stock') {
    return 'chip-good'
  }

  if (props.product.availability === 'Low Stock') {
    return 'chip-warn'
  }

  return 'chip-muted'
})
const distanceLabel = computed(() => {
  if (props.distanceKm == null || props.referenceArea == null) {
    return ''
  }

  return `${props.distanceKm.toFixed(1)} km from ${props.referenceArea}`
})
const favoriteLabel = computed(() => (isFavorite(props.product.id) ? 'Saved' : 'Favorite'))
const displayLocation = computed(() => {
  const parts = []
  if (props.product.subcity) parts.push(props.product.subcity)
  if (props.product.city) parts.push(props.product.city)
  if (props.product.region) parts.push(props.product.region)
  return parts.length > 0 ? parts.join(', ') : props.product.location || ''
})
</script>

<template>
  <article
    class="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[var(--line)] bg-white/92 shadow-[0_20px_50px_rgba(24,32,28,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(24,32,28,0.12)]"
  >
    <div class="relative aspect-[4/3] overflow-hidden">
      <img
        :src="product.image"
        :alt="product.name"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />

      <div class="absolute left-4 top-4 flex flex-wrap gap-2">
        <span class="chip !bg-white/92 !text-[var(--text)]">{{ product.category }}</span>
        <span class="chip" :class="availabilityTone">{{ product.availability }}</span>
      </div>

      <div
        v-if="product.featured"
        class="absolute right-4 top-4 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white shadow-sm"
      >
        Featured
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-4 p-5">
      <div v-if="merchant" class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Posted by {{ merchant.businessName }}
          </p>
          <p class="mt-1 text-sm text-[var(--muted)]">
            {{ displayLocation || merchant.location }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span class="chip !px-3 !py-1.5" :class="merchant.verified ? 'chip-good' : 'chip-muted'">
            {{ merchant.verified ? 'Verified' : 'Pending' }}
          </span>
          <button
            v-if="showFavoriteButton !== false"
            class="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            type="button"
            :aria-pressed="isFavorite(product.id)"
            :aria-label="`${favoriteLabel} ${product.name}`"
            @click="toggleFavorite(product.id)"
          >
            {{ favoriteLabel }}
          </button>
        </div>
      </div>

      <div v-else-if="showFavoriteButton !== false" class="flex justify-end">
        <button
          class="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          type="button"
          :aria-pressed="isFavorite(product.id)"
          :aria-label="`${favoriteLabel} ${product.name}`"
          @click="toggleFavorite(product.id)"
        >
          {{ favoriteLabel }}
        </button>
      </div>

      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h3 class="font-heading text-xl font-semibold leading-tight text-[var(--text)]">
            {{ product.name }}
          </h3>
          <p class="mt-2 text-sm leading-6 text-[var(--muted)]">{{ product.shortDescription }}</p>
        </div>
        <div class="shrink-0 text-right">
          <strong
            class="block text-lg font-semibold"
            :class="hasDiscount ? 'text-[var(--primary)]' : 'text-[var(--text)]'"
          >
            {{ priceLabel }}
          </strong>
          <span v-if="hasDiscount" class="text-xs font-medium text-[var(--muted)] line-through">
            {{ originalPriceLabel }}
          </span>
        </div>
      </div>

      <div v-if="merchant && showMerchantLink" class="rounded-[24px] bg-[var(--surface-alt)] p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[var(--text)]">{{ merchant.businessName }}</p>
            <p class="mt-1 text-sm text-[var(--muted)]">{{ merchant.area }}, {{ merchant.city }}</p>
          </div>
          <span class="chip !px-3 !py-1.5" :class="merchant.verified ? 'chip-good' : 'chip-muted'">
            {{ merchant.verified ? 'Verified shop' : 'Pending review' }}
          </span>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <span class="chip chip-muted">{{ product.condition }}</span>
          <span v-if="distanceLabel" class="chip chip-good">{{ distanceLabel }}</span>
          <span class="chip chip-muted">
            Delivers to {{ merchant.deliveryAreas.slice(0, 2).join(', ') }}
          </span>
        </div>
      </div>

      <div class="mt-auto flex flex-wrap gap-3">
        <RouterLink class="btn-secondary !px-4 !py-2.5" :to="`/products/${product.id}`">
          View item
        </RouterLink>
        <RouterLink
          v-if="merchant && showMerchantLink"
          class="btn-ghost !px-4 !py-2.5"
          :to="`/merchants/${merchant.id}`"
        >
          Storefront
        </RouterLink>
      </div>
    </div>
  </article>
</template>
