<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { useFavorites } from '@/modules/marketplace/composables/useFavorites'
import { normalizeImageUrl } from '@/shared/api/images'
import type { MerchantRecord, ProductRecord } from '@/shared/types'

const props = withDefaults(
  defineProps<{
    product: ProductRecord
    merchant?: MerchantRecord
    showMerchantLink?: boolean
    showFavoriteButton?: boolean
    distanceKm?: number | null
    referenceArea?: string
    variant?: 'detailed' | 'compact'
  }>(),
  {
    variant: 'detailed',
    showFavoriteButton: true,
  },
)

const { isFavorite, toggleFavorite } = useFavorites()

const priceLabel = computed(() => {
  if (props.product.salePrice && props.product.salePrice > 0) {
    return `ETB ${props.product.salePrice.toLocaleString()}`
  }
  return `ETB ${props.product.price.toLocaleString()}`
})
const originalPriceLabel = computed(() => {
  if (props.product.salePrice && props.product.salePrice > 0 && props.product.price > 0) {
    return `ETB ${props.product.price.toLocaleString()}`
  }
  return null
})
const hasDiscount = computed(
  () => props.product.salePrice != null && props.product.salePrice > 0 && props.product.price > 0,
)
const distanceLabel = computed(() => {
  if (props.distanceKm == null || props.referenceArea == null) {
    return ''
  }

  return `${props.distanceKm.toFixed(1)} km from ${props.referenceArea}`
})
const favoriteLabel = computed(() => (isFavorite(props.product.id) ? 'Saved' : 'Favorite'))
const displayLocation = computed(() => props.product.location || '')
const productImage = computed(
  () =>
    normalizeImageUrl(props.product.image) ||
    'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=800&q=80',
)
</script>

<template>
  <article v-if="variant === 'compact'" class="compact-card">
    <div class="compact-media">
      <RouterLink :to="`/products/${product.id}`" class="compact-link">
        <img
          :src="productImage"
          :alt="product.name"
          loading="lazy"
          decoding="async"
          class="compact-image"
        />
        <div class="compact-badges">
          <span v-if="product.listingType" class="compact-badge compact-badge-primary">
            {{ product.listingType }}
          </span>
          <span class="compact-badge">{{ product.category }}</span>
        </div>
      </RouterLink>

      <button
        v-if="showFavoriteButton"
        class="compact-favorite"
        type="button"
        :aria-pressed="isFavorite(product.id)"
        :aria-label="`${isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'} ${product.name}`"
        @click="toggleFavorite(product.id)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          :fill="isFavorite(product.id) ? 'var(--primary)' : 'none'"
          :stroke="isFavorite(product.id) ? 'var(--primary)' : 'currentColor'"
          stroke-width="2"
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          />
        </svg>
      </button>
    </div>

    <RouterLink :to="`/products/${product.id}`" class="compact-body compact-link">
      <div class="compact-price-row">
        <template v-if="hasDiscount">
          <span class="compact-price line-through">{{ originalPriceLabel }}</span>
          <span class="compact-price">{{ priceLabel }}</span>
        </template>
        <template v-else>
          <span class="compact-price">{{ priceLabel }}</span>
        </template>
        <span class="compact-condition">{{ product.condition }}</span>
      </div>

      <h3 class="compact-name">{{ product.name }}</h3>
      <p class="compact-desc">{{ product.shortDescription }}</p>

      <div v-if="merchant" class="compact-merchant">
        <span class="compact-merchant-name">{{ merchant.businessName }}</span>
        <span class="compact-merchant-location">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {{ displayLocation || merchant.location }}
        </span>
        <span class="compact-merchant-phone">{{ merchant.phone }}</span>
      </div>
    </RouterLink>
  </article>

  <article
    v-else
    class="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[var(--line)] bg-white/92 shadow-[0_20px_50px_rgba(24,32,28,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(24,32,28,0.12)]"
  >
    <div class="relative w-full overflow-hidden aspect-[4/3]">
      <img
        :src="productImage"
        :alt="product.name"
        loading="lazy"
        decoding="async"
        class="w-full h-full object-cover"
      />

      <div class="absolute left-4 top-4 flex flex-wrap gap-2">
        <span v-if="product.listingType" class="chip chip-primary">{{ product.listingType }}</span>
        <span class="chip !bg-white/92 !text-[var(--text)]">{{ product.category }}</span>
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
            v-if="showFavoriteButton"
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

      <div v-else-if="showFavoriteButton" class="flex justify-end">
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
          <template v-if="hasDiscount">
            <span class="text-xs font-medium text-[var(--muted)] line-through">
              {{ originalPriceLabel }}
            </span>
            <strong class="block text-lg font-semibold text-[var(--primary)]">
              {{ priceLabel }}
            </strong>
          </template>
          <template v-else>
            <strong class="block text-lg font-semibold text-[var(--text)]">
              {{ priceLabel }}
            </strong>
          </template>
        </div>
      </div>

      <div v-if="merchant && showMerchantLink" class="rounded-[24px] bg-[var(--surface-alt)] p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[var(--text)]">{{ merchant.businessName }}</p>
            <p class="mt-1 text-sm text-[var(--muted)]">{{ merchant.location }}</p>
            <p v-if="merchant.phone" class="mt-1 text-sm font-medium text-[var(--primary)]">
              {{ merchant.phone }}
            </p>
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

<style scoped>
.compact-card {
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(165deg, #ffffff 0%, rgba(253, 241, 255, 0.85) 100%);
  border: 1px solid rgba(128, 0, 128, 0.14);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  box-shadow: 0 8px 24px rgba(128, 0, 128, 0.06);
}

.compact-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(128, 0, 128, 0.14);
}

.compact-media {
  position: relative;
  width: 100%;          /* ✅ full width */
  aspect-ratio: 4 / 3;  /* ✅ consistent layout */
  overflow: hidden;
}

.compact-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.compact-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.compact-card:hover .compact-image {
  transform: scale(1.05);
}

.compact-badges {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-right: 48px;
}

.compact-badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(128, 0, 128, 0.14);
  color: rgba(36, 16, 37, 0.85);
}

.compact-badge-primary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.compact-favorite {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  border: none;
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
}

.compact-favorite:hover {
  transform: scale(1.08);
}

.compact-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.compact-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.compact-price {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text);
}

.compact-price.line-through {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted);
  text-decoration: line-through;
}

.compact-condition {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  background: rgba(36, 16, 37, 0.05);
  border-radius: 999px;
  color: var(--muted);
}

.compact-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.compact-desc {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--muted);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.compact-merchant {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(128, 0, 128, 0.1);
}

.compact-merchant-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text);
}

.compact-merchant-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--muted);
}
</style>
