<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRoute } from 'vue-router'

import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import type { MerchantRecord, ProductRecord } from '@/shared/types'

const route = useRoute()
const merchant = ref<MerchantRecord | null>(null)
const products = ref<ProductRecord[]>([])
const areaMerchants = ref<MerchantRecord[]>([])
const preferredArea = ref(api.getPreferredMarketplaceArea())
const loading = ref(true)

const categoryHighlights = computed(() => [
  ...new Set(products.value.map((product) => product.category)),
])
const inStockCount = computed(
  () => products.value.filter((product) => product.availability === 'In Stock').length,
)
const contactPhone = computed(
  () => products.value.find((product) => product.phone)?.phone || 'No phone listed',
)
const publishedCount = computed(
  () => products.value.filter((product) => product.status === 'approved').length,
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
      <div class="merchant-profile-page">
        <section class="shell-panel merchant-hero px-6 py-7 sm:px-8">
          <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div>
              <p class="section-eyebrow">Seller storefront</p>
              <h1 class="section-title">{{ merchant.businessName }}</h1>
              <p class="section-copy max-w-3xl">{{ merchant.description }}</p>

              <div class="mt-5 flex flex-wrap gap-3">
                <span class="chip !px-4 !py-2">{{ merchant.category }}</span>
                <span class="chip !px-4 !py-2">{{ merchant.location }}</span>
                <span class="chip !px-4 !py-2">{{ contactPhone }}</span>
                <span
                  class="chip !px-4 !py-2"
                  :class="merchant.verified ? 'chip-good' : 'chip-muted'"
                >
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

            <div class="merchant-snapshot rounded-[28px] bg-[var(--surface-alt)] p-5">
              <p class="text-sm font-semibold text-[var(--text)]">Store snapshot</p>
              <div class="mt-4 space-y-3 text-sm text-[var(--muted)]">
                <p>{{ publishedCount }} product{{ publishedCount === 1 ? '' : 's' }} published</p>
                <p>{{ inStockCount }} currently in stock</p>
                <p>
                  {{ categoryHighlights.length }} catalog categor{{
                    categoryHighlights.length === 1 ? 'y' : 'ies'
                  }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="catalog-section">
          <div class="catalog-head">
            <div class="catalog-title-group">
              <p class="section-eyebrow">Catalog</p>
              <h2 class="catalog-title">Products from this seller</h2>
              <p class="catalog-count">
                {{ products.length }} listing{{ products.length === 1 ? '' : 's' }} published
              </p>
            </div>
            <div class="catalog-categories">
              <span v-for="category in categoryHighlights" :key="category" class="category-tag">
                {{ category }}
              </span>
            </div>
          </div>

          <div v-if="products.length" class="catalog-grid">
            <article v-for="product in products" :key="product.id" class="catalog-card">
              <RouterLink :to="`/products/${product.id}`" class="catalog-link">
                <div class="catalog-media">
                  <img :src="product.image" :alt="product.name" class="catalog-image" />
                  <div class="catalog-badges">
                    <span class="catalog-badge">{{ product.category }}</span>
                    <span
                      class="catalog-badge"
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
                <div class="catalog-body">
                  <div class="catalog-meta">
                    <span class="catalog-price">ETB {{ product.price.toLocaleString() }}</span>
                    <span class="catalog-condition">{{ product.condition }}</span>
                  </div>
                  <h3 class="catalog-name">{{ product.name }}</h3>
                  <p class="catalog-excerpt">{{ product.shortDescription }}</p>
                  <a class="catalog-phone" :href="`tel:${product.phone.replace(/[^\d+]/g, '')}`">
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
          <div v-else class="catalog-empty">
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
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <p class="empty-title">No listings yet</p>
            <p class="empty-text">This seller hasn't published any products.</p>
          </div>
        </section>

        <section v-if="preferredArea && areaMerchants.length" class="neighbors-section mt-8">
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
      </div>
    </template>
  </AppShell>
</template>

<style scoped>
.merchant-profile-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.merchant-hero {
  border: 1px solid rgba(128, 0, 128, 0.16);
}

.merchant-snapshot {
  border: 1px solid rgba(128, 0, 128, 0.14);
}

.catalog-head {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(128, 0, 128, 0.14);
}

@media (min-width: 640px) {
  .catalog-head {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.catalog-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.catalog-title {
  font-size: 1.75rem;
  font-weight: 750;
  color: var(--text);
  margin: 0;
}

.catalog-count {
  font-size: 0.95rem;
  color: var(--muted);
  margin: 0;
}

.catalog-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  background: var(--primary-soft);
  color: var(--primary-deep);
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 20px;
}

@media (min-width: 768px) {
  .catalog-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1140px) {
  .catalog-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.catalog-card {
  border-radius: 22px;
  overflow: hidden;
  background: linear-gradient(165deg, #ffffff 0%, rgba(253, 241, 255, 0.85) 100%);
  border: 1px solid rgba(128, 0, 128, 0.14);
  transition: all 0.25s ease;
  box-shadow: 0 8px 20px rgba(128, 0, 128, 0.06);
}

.catalog-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 32px rgba(128, 0, 128, 0.14);
}

.catalog-link {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}

.catalog-media {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.catalog-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.catalog-card:hover .catalog-image {
  transform: scale(1.05);
}

.catalog-badges {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
}

.catalog-badge {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(128, 0, 128, 0.14);
  color: rgba(36, 16, 37, 0.85);
}

.catalog-badge.instock {
  background: rgba(29, 155, 108, 0.12);
  color: #176c4d;
}

.catalog-badge.lowstock {
  background: rgba(239, 179, 65, 0.14);
  color: #8b5d0b;
}

.catalog-badge.outstock {
  background: rgba(190, 24, 93, 0.1);
  color: #be185d;
}

.catalog-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
}

.catalog-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.catalog-price {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text);
}

.catalog-condition {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  background: rgba(36, 16, 37, 0.05);
  border-radius: 999px;
  color: var(--muted);
}

.catalog-name {
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

.catalog-excerpt {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.catalog-phone {
  margin: 2px 0 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--muted);
  text-decoration: none;
}

.catalog-phone:hover {
  color: var(--primary);
}

.catalog-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 24px;
  text-align: center;
  border-radius: 24px;
  border: 1px dashed rgba(128, 0, 128, 0.24);
  background: rgba(253, 241, 255, 0.4);
}

.neighbors-section .shell-panel {
  border-radius: 24px;
}

.catalog-head {
  border-bottom: 1px solid rgba(128, 0, 128, 0.14);
  padding-bottom: 12px;
}
</style>
