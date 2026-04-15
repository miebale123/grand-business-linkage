<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { routePaths } from '@/app/router/paths'
import { useFavorites } from '@/modules/marketplace/composables/useFavorites'
import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import type { MerchantRecord, ProductRecord } from '@/shared/types'

const { favoriteIds, toggleFavorite } = useFavorites()

const loading = ref(true)
const products = ref<ProductRecord[]>([])
const merchants = ref<MerchantRecord[]>([])

const merchantById = computed(() =>
  merchants.value.reduce<Record<string, MerchantRecord>>((map, merchant) => {
    map[merchant.id] = merchant
    return map
  }, {}),
)

const favoriteProducts = computed(() => {
  const ids = new Set(favoriteIds.value)
  return products.value.filter((product) => ids.has(product.id))
})

onMounted(async () => {
  const [approvedProducts, merchantRecords] = await Promise.all([
    api.fetchProducts({ status: 'approved' }),
    api.fetchMerchants(),
  ])

  products.value = approvedProducts
  merchants.value = merchantRecords
  loading.value = false
})
</script>

<template>
  <AppShell>
    <div class="favorites-page">
      <header class="favorites-header">
        <div class="header-content">
          <h1 class="header-title">Favorites</h1>
          <p class="header-count">
            {{ favoriteProducts.length }} saved item{{ favoriteProducts.length === 1 ? '' : 's' }}
          </p>
        </div>
      </header>

      <section class="favorites-content">
        <div v-if="loading" class="favorites-loading">
          <div class="loading-spinner"></div>
          <p>Loading saved listings...</p>
        </div>
        <div v-else-if="favoriteProducts.length" class="favorites-grid">
          <article v-for="product in favoriteProducts" :key="product.id" class="favorite-card">
            <RouterLink :to="`/products/${product.id}`" class="favorite-link">
              <div class="favorite-media">
                <img :src="product.image" :alt="product.name" class="favorite-image" />
                <button
                  class="favorite-saved"
                  type="button"
                  @click.prevent="toggleFavorite(product.id)"
                  aria-label="Remove from favorites"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                  </svg>
                </button>
                <div class="favorite-badges">
                  <span class="badge">{{ product.category }}</span>
                  <span
                    class="badge"
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
              </div>
              <div class="favorite-body">
                <div class="favorite-header">
                  <span class="favorite-price">ETB {{ product.price.toLocaleString() }}</span>
                  <span class="favorite-condition">{{ product.condition }}</span>
                </div>
                <h3 class="favorite-title">{{ product.name }}</h3>
                <p class="favorite-excerpt">{{ product.shortDescription }}</p>
                <div class="favorite-seller" v-if="merchantById[product.merchantId]">
                  <span class="seller-name">{{
                    merchantById[product.merchantId]?.businessName
                  }}</span>
                  <span class="seller-area">{{
                    product.location || merchantById[product.merchantId]?.location
                  }}</span>
                  <a class="seller-phone" :href="`tel:${product.phone.replace(/[^\d+]/g, '')}`">
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
              </div>
            </RouterLink>
          </article>
        </div>
        <div v-else-if="favoriteIds.length" class="favorites-empty">
          <div class="empty-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
          </div>
          <p class="empty-title">Items no longer available</p>
          <p class="empty-text">
            Some saved items are no longer publicly available because they are pending, rejected, or
            removed.
          </p>
        </div>
        <div v-else class="favorites-empty">
          <div class="empty-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
          </div>
          <p class="empty-title">No saved items yet</p>
          <p class="empty-text">Browse listings and save items you want to compare later.</p>
          <RouterLink class="btn-primary" :to="routePaths.home"> Browse marketplace </RouterLink>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.favorites-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.favorites-hero {
  border: 1px solid rgba(128, 0, 128, 0.17);
}

.favorites-stat {
  min-width: 140px;
  text-align: center;
  border: 1px solid rgba(128, 0, 128, 0.14);
}

.favorites-content {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.favorites-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 24px;
  border-radius: 24px;
  border: 1px dashed rgba(128, 0, 128, 0.24);
  background: rgba(253, 241, 255, 0.4);
  color: var(--muted);
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

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 20px;
}

@media (min-width: 768px) {
  .favorites-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1140px) {
  .favorites-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.favorite-card {
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(165deg, #ffffff 0%, rgba(253, 241, 255, 0.85) 100%);
  border: 1px solid rgba(128, 0, 128, 0.14);
  transition: all 0.25s ease;
  box-shadow: 0 8px 24px rgba(128, 0, 128, 0.06);
}

.favorite-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px rgba(128, 0, 128, 0.14);
}

.favorite-link {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}

.favorite-media {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.favorite-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.favorite-card:hover .favorite-image {
  transform: scale(1.05);
}

.favorite-saved {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  border: 1px solid rgba(128, 0, 128, 0.14);
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(128, 0, 128, 0.1);
}

.favorite-saved:hover {
  transform: scale(1.1);
  background: var(--primary);
  color: #fff;
}

.favorite-badges {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
}

.badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(128, 0, 128, 0.14);
  color: rgba(36, 16, 37, 0.85);
}

.badge.instock {
  background: rgba(29, 155, 108, 0.12);
  color: #176c4d;
}

.badge.lowstock {
  background: rgba(239, 179, 65, 0.14);
  color: #8b5d0b;
}

.badge.outstock {
  background: rgba(190, 24, 93, 0.1);
  color: #be185d;
}

.favorite-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.favorite-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.favorite-price {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text);
}

.favorite-condition {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  background: rgba(36, 16, 37, 0.05);
  border-radius: 999px;
  color: var(--muted);
}

.favorite-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.favorite-excerpt {
  font-size: 0.82rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.favorite-seller {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(128, 0, 128, 0.1);
}

.seller-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text);
}

.seller-area {
  font-size: 0.72rem;
  color: var(--muted);
}

.seller-phone {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--muted);
  text-decoration: none;
}

.seller-phone:hover {
  color: var(--primary);
}

.favorites-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 24px;
  text-align: center;
  border-radius: 24px;
  border: 1px dashed rgba(128, 0, 128, 0.24);
  background: rgba(253, 241, 255, 0.4);
}

.empty-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--muted);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.empty-text {
  font-size: 0.95rem;
  color: var(--muted);
  margin: 8px 0 20px;
  max-width: 320px;
}
</style>
