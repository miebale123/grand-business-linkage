<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useRoute } from 'vue-router'

import { getMerchantProfilePath } from '@/app/router/paths'
import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import type { MerchantRecord, ProductRecord } from '@/shared/types'

const route = useRoute()
const product = ref<ProductRecord | null>(null)
const merchant = ref<MerchantRecord | null>(null)
const relatedProducts = ref<ProductRecord[]>([])
const areaMerchants = ref<MerchantRecord[]>([])
const preferredArea = ref(api.getPreferredMarketplaceArea())
const loading = ref(true)
const error = ref('')
const activeImage = ref('')

const priceLabel = computed(() =>
  product.value ? `ETB ${product.value.price.toLocaleString()}` : '',
)
const galleryImages = computed(() =>
  product.value ? (product.value.images.length ? product.value.images : [product.value.image]) : [],
)
const postedDateLabel = computed(() => {
  if (!product.value?.createdAt) {
    return 'Recently added'
  }

  return new Date(product.value.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})
const phoneLabel = computed(() => product.value?.phone || 'No direct line listed')
const phoneHref = computed(() => {
  const digits = phoneLabel.value.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
})

watch(
  galleryImages,
  (images) => {
    activeImage.value = images[0] || ''
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    const record = await api.fetchProductById(route.params.id as string)
    const [merchantRecord, merchantCatalog] = await Promise.all([
      api.fetchMerchantById(record.merchantId),
      api.fetchMerchantCatalog(record.merchantId),
    ])

    product.value = record
    merchant.value = merchantRecord
    relatedProducts.value = merchantCatalog.filter((item) => item.id !== record.id).slice(0, 3)

    if (preferredArea.value) {
      areaMerchants.value = await api.fetchMerchantsByArea(preferredArea.value, {
        excludeMerchantId: merchantRecord.id,
        limit: 3,
      })
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load product details.'
  } finally {
    loading.value = false
  }
})

</script>

<template>
  <AppShell>
    <section v-if="loading" class="empty-panel">Loading product details...</section>

    <template v-else-if="product && merchant">
      <div class="product-detail-page">
        <section class="detail-layout">
          <article class="detail-main">
            <div class="main-image-container">
              <img :src="activeImage || product.image" :alt="product.name" class="main-image" />
              <div v-if="galleryImages.length > 1" class="gallery-nav">
                <button
                  v-for="image in galleryImages"
                  :key="image"
                  class="gallery-thumb"
                  :class="{ active: activeImage === image }"
                  type="button"
                  @click="activeImage = image"
                >
                  <img :src="image" :alt="`${product.name} gallery`" />
                </button>
              </div>
            </div>

            <div class="main-content">
              <div class="product-badges">
                <span class="badge">{{ product.category }}</span>
                <span class="badge badge-muted">{{ product.condition }}</span>
              </div>

              <h1 class="product-title">{{ product.name }}</h1>
              <p class="product-price">{{ priceLabel }}</p>
              <p class="product-description">{{ product.description }}</p>

              <div class="product-meta-grid">
                <div class="meta-card">
                  <span class="meta-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <div class="meta-content">
                    <span class="meta-label">Seller</span>
                    <span class="meta-value">{{ merchant.businessName }}</span>
                  </div>
                </div>
                <div class="meta-card">
                  <span class="meta-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </span>
                  <div class="meta-content">
                    <span class="meta-label">Location</span>
                    <span class="meta-value">{{ product.location }}</span>
                  </div>
                </div>
                <div class="meta-card">
                  <span class="meta-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </span>
                  <div class="meta-content">
                    <span class="meta-label">Store status</span>
                    <span class="meta-value">{{
                      merchant.verified ? 'Verified' : 'Under review'
                    }}</span>
                  </div>
                </div>
                <div class="meta-card">
                  <span class="meta-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </span>
                  <div class="meta-content">
                    <span class="meta-label">Posted</span>
                    <span class="meta-value">{{ postedDateLabel }}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <aside class="detail-aside">
            <div class="aside-card aside-action">
              <div class="aside-eyebrow">Primary action</div>
              <h2 class="aside-title">Call the merchant</h2>
              <p class="aside-desc">
                Use the listing phone to confirm availability, pickup timing, or delivery before you
                leave.
              </p>
              <a v-if="phoneHref" class="btn-call" :href="phoneHref">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                  ></path>
                </svg>
                {{ phoneLabel }}
              </a>
              <div v-else class="aside-note">
                This listing does not have a direct phone number yet. Use the inquiry form below
                instead.
              </div>
            </div>

           
          </aside>
        </section>

        <section v-if="relatedProducts.length" class="detail-related">
          <div class="section-header">
            <span class="section-eyebrow">More from this seller</span>
            <h2 class="section-title">You might also like</h2>
            <p class="section-subtitle">From {{ merchant.businessName }}</p>
          </div>

          <div class="related-grid">
            <article v-for="item in relatedProducts" :key="item.id" class="related-card">
              <RouterLink :to="`/products/${item.id}`" class="related-link">
                <div class="related-media">
                  <img :src="item.image" :alt="item.name" class="related-image" />
                  <div class="related-badges">
                    <span class="related-badge">{{ item.category }}</span>
                  </div>
                </div>
                <div class="related-body">
                  <div class="related-meta">
                    <span class="related-price">ETB {{ item.price.toLocaleString() }}</span>
                    <span class="related-condition">{{ item.condition }}</span>
                  </div>
                  <h3 class="related-name">{{ item.name }}</h3>
                  <p class="related-excerpt">{{ item.shortDescription }}</p>
                </div>
              </RouterLink>
            </article>
          </div>
        </section>

        <section v-if="preferredArea && areaMerchants.length" class="detail-neighbors">
          <div class="section-header">
            <span class="section-eyebrow">Other sellers in {{ preferredArea }}</span>
            <h2 class="section-title">Compare listings from the same area</h2>
          </div>

          <div class="neighbors-grid">
            <RouterLink
              v-for="merchantRecord in areaMerchants"
              :key="merchantRecord.id"
              :to="`/merchants/${merchantRecord.id}`"
              class="neighbor-card"
            >
              <h3 class="neighbor-name">{{ merchantRecord.businessName }}</h3>
              <p class="neighbor-location">{{ merchantRecord.location }}</p>
              <span class="neighbor-tag">{{ merchantRecord.category }}</span>
            </RouterLink>
          </div>
        </section>
      </div>
    </template>
  </AppShell>
</template>

<style scoped>
.product-detail-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
}

@media (min-width: 1024px) {
  .detail-layout {
    grid-template-columns: 1fr 380px;
    gap: 32px;
  }
}

.detail-main {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(128, 0, 128, 0.08);
}

.main-image-container {
  position: relative;
  width: 100%;
}

.main-image {
  width: 100%;
  height: 360px;
  object-fit: cover;
  display: block;
}

@media (min-width: 768px) {
  .main-image {
    height: 480px;
  }
}

.gallery-nav {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--line);
  background: var(--surface-alt);
  overflow-x: auto;
}

.gallery-thumb {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 14px;
  border: 2px solid var(--line);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  background: none;
}

.gallery-thumb:hover {
  border-color: var(--primary);
}

.gallery-thumb.active {
  border-color: var(--primary);
  box-shadow: 0 4px 16px rgba(210, 0, 217, 0.25);
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-content {
  padding: 24px 24px 28px;
}

@media (min-width: 768px) {
  .main-content {
    padding: 32px 36px 40px;
  }
}

.product-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: var(--primary-soft);
  color: var(--primary-deep);
}

.badge-muted {
  background: rgba(36, 16, 37, 0.06);
  color: var(--muted);
}

.product-title {
  margin: 20px 0 12px;
  font-family: var(--font-heading, system-ui);
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--text);
}

@media (min-width: 768px) {
  .product-title {
    font-size: 2.5rem;
    margin: 24px 0 16px;
  }
}

.product-price {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
  margin: 0 0 20px;
}

.product-description {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--muted);
  margin: 0 0 28px;
  max-width: 720px;
}

.product-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 640px) {
  .product-meta-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.meta-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--surface-alt);
  border-radius: 18px;
  border: 1px solid rgba(128, 0, 128, 0.08);
}

.meta-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
  flex-shrink: 0;
}

.meta-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.meta-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.meta-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.aside-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(128, 0, 128, 0.06);
}

.aside-eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--primary);
  margin-bottom: 8px;
}

.aside-title {
  font-family: var(--font-heading, system-ui);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--text);
  margin: 0 0 10px;
  line-height: 1.3;
}

.aside-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--muted);
  margin: 0 0 20px;
}

.btn-call {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  color: white;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.25s ease;
  box-shadow: 0 6px 20px rgba(128, 0, 128, 0.25);
}

.btn-call:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(128, 0, 128, 0.35);
}

.aside-note {
  padding: 16px;
  background: var(--surface-alt);
  border-radius: 14px;
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.5;
}

.store-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 700;
  background: var(--surface-alt);
  color: var(--text);
  border: 1px solid var(--line);
}

.tag-success {
  background: rgba(29, 155, 108, 0.1);
  color: #176c4d;
  border-color: rgba(29, 155, 108, 0.2);
}

.tag-muted {
  background: rgba(36, 16, 37, 0.04);
  color: var(--muted);
}

.btn-store {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: var(--surface-alt);
  color: var(--text);
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  border: 1px solid var(--line);
}

.btn-store:hover {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary-deep);
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
}

.section-eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--primary);
}

.section-title {
  font-family: var(--font-heading, system-ui);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0;
}

.section-subtitle {
  font-size: 0.9rem;
  color: var(--muted);
  margin: 4px 0 0;
}

.detail-related {
  padding-top: 12px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 20px;
}

@media (min-width: 640px) {
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .related-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.related-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 22px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(128, 0, 128, 0.06);
}

.related-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(128, 0, 128, 0.14);
}

.related-link {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}

.related-media {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.related-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.related-card:hover .related-image {
  transform: scale(1.05);
}

.related-badges {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
}

.related-badge {
  padding: 5px 10px;
  border-radius: 100px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--line);
  color: var(--text);
}

.related-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.related-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.related-price {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--primary);
}

.related-condition {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  background: rgba(36, 16, 37, 0.05);
  border-radius: 100px;
  color: var(--muted);
}

.related-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-excerpt {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.detail-neighbors {
  padding-top: 12px;
}

.neighbors-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
}

@media (min-width: 768px) {
  .neighbors-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.neighbor-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  transition: all 0.25s ease;
  text-decoration: none;
  color: inherit;
}

.neighbor-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(128, 0, 128, 0.12);
  border-color: var(--primary);
}

.neighbor-name {
  font-family: var(--font-heading, system-ui);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.neighbor-location {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0;
}

.neighbor-tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 100px;
  font-size: 0.7rem;
  font-weight: 700;
  background: var(--surface-alt);
  color: var(--muted);
  width: fit-content;
}
</style>
