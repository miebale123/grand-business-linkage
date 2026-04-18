<script setup lang="ts">
import AppShell from '@/shared/layouts/AppShell.vue'
import { useProductDetailsPage } from './ProductDetailsPage'
import './ProductDetailsPage.css'

const {
  product,
  merchant,
  relatedProducts,
  areaMerchants,
  preferredArea,
  loading,
  error,
  activeImage,
  priceLabel,
  galleryImages,
  postedDateLabel,
  phoneLabel,
  phoneHref,
} = useProductDetailsPage()
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

            <div class="aside-card">
              <div class="aside-eyebrow">Seller</div>
              <h2 class="aside-title">{{ merchant.businessName }}</h2>

              <div class="store-tags">
                <span v-if="merchant.verified" class="tag tag-success">Verified</span>
                <span class="tag">{{ merchant.category }}</span>
                <span v-if="!merchant.verified" class="tag tag-muted">Basic</span>
              </div>

              <p v-if="merchant.description" class="aside-desc">{{ merchant.description }}</p>

              <RouterLink :to="`/merchants/${merchant.id}`" class="btn-store">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Visit store
              </RouterLink>
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