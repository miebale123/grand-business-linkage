<script setup lang="ts">
import AppShell from '@/shared/layouts/AppShell.vue'
import SearchBar from '@/shared/ui/SearchBar.vue'
import { useLandingPage } from './LandingPage'
import './LandingPage.css'

const {
  auth,
  featured,
  products,
  merchants,
  marketplaceConfig,
  loading,
  isSearchActive,
  heroSearch,
  areaOptions,
  searchResults,
  isFavorite,
  toggleFavorite,
  openMarketplace,
  clearSearch,
  setSearch,
  getMerchant,
} = useLandingPage()
</script>

<template>
  <AppShell>
    <div class="landing-page">
      <section class="hero-section">
        <SearchBar
          v-model="heroSearch.search"
          placeholder="Search products..."
          :locations="areaOptions"
          @search="openMarketplace"
          @update:location="(area) => (heroSearch.area = area)"
        />
        <div class="search-actions">
          <button class="action-btn" type="button" @click="openMarketplace()">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Save Search
          </button>
          <button class="action-btn" type="button" @click="openMarketplace()">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
          </button>
        </div>
        <div v-if="marketplaceConfig?.popularSearchTags.length" class="search-tags">
          <span class="tag-label">Popular:</span>
          <button
            v-for="tag in marketplaceConfig.popularSearchTags"
            :key="tag.term"
            class="tag-pill"
            type="button"
            @click="setSearch(tag.term)"
          >
            {{ tag.label }}
          </button>
        </div>
      </section>

      <section v-if="isSearchActive" class="search-results-section">
        <div class="results-header">
          <h2 class="results-title">
            {{ searchResults.length }} result{{ searchResults.length === 1 ? '' : 's' }}
            <span v-if="heroSearch.search">for "{{ heroSearch.search }}"</span>
          </h2>
          <button class="clear-search-btn" type="button" @click="clearSearch">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div v-if="searchResults.length === 0" class="no-results">
          <p>No products found. Try adjusting your search or filters.</p>
        </div>

        <div v-else class="results-grid">
          <article v-for="product in searchResults" :key="product.id" class="product-tile">
            <div class="tile-media">
              <RouterLink :to="`/products/${product.id}`" class="tile-link">
                <img :src="product.image" :alt="product.name" class="tile-image" />
                <div class="tile-badges">
                  <span class="tile-badge">{{ product.category }}</span>
                </div>
              </RouterLink>
              <button
                class="tile-favorite"
                type="button"
                :aria-label="isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'"
                @click.prevent="toggleFavorite(product.id)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  :fill="isFavorite(product.id) ? 'var(--primary)' : 'none'"
                  :stroke="isFavorite(product.id) ? 'var(--primary)' : 'currentColor'"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </button>
            </div>
            <RouterLink :to="`/products/${product.id}`" class="tile-body">
              <div class="tile-info">
                <span class="tile-price">ETB {{ product.price.toLocaleString() }}</span>
                <span class="tile-condition">{{ product.condition }}</span>
              </div>
              <h3 class="tile-name">{{ product.name }}</h3>
              <p class="tile-desc">{{ product.shortDescription }}</p>
              <div class="tile-merchant" v-if="getMerchant(product.merchantId)">
                <span class="merchant-name">{{ getMerchant(product.merchantId)?.businessName }}</span>
                <span class="merchant-location">{{
                  product.location || getMerchant(product.merchantId)?.location
                }}</span>
              </div>
            </RouterLink>
          </article>
        </div>
      </section>

      <section v-else class="featured-section">
        <div class="featured-header">
          <h2 class="featured-title">Featured Products</h2>
        </div>

        <div v-if="loading" class="featured-loading">
          <div class="loading-spinner"></div>
        </div>
        <div v-else class="featured-grid">
          <article v-for="product in featured" :key="product.id" class="product-tile">
            <div class="tile-media">
              <RouterLink :to="`/products/${product.id}`" class="tile-link">
                <img :src="product.image" :alt="product.name" class="tile-image" />
                <div class="tile-badges">
                  <span class="tile-badge">{{ product.category }}</span>
                </div>
              </RouterLink>
              <button
                class="tile-favorite"
                type="button"
                :aria-label="isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'"
                @click.prevent="toggleFavorite(product.id)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  :fill="isFavorite(product.id) ? 'var(--primary)' : 'none'"
                  :stroke="isFavorite(product.id) ? 'var(--primary)' : 'currentColor'"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </button>
            </div>
            <RouterLink :to="`/products/${product.id}`" class="tile-body">
              <div class="tile-info">
                <span class="tile-price">ETB {{ product.price.toLocaleString() }}</span>
                <span class="tile-condition">{{ product.condition }}</span>
              </div>
              <h3 class="tile-name">{{ product.name }}</h3>
              <p class="tile-desc">{{ product.shortDescription }}</p>
              <div class="tile-merchant" v-if="getMerchant(product.merchantId)">
                <span class="merchant-name">{{ getMerchant(product.merchantId)?.businessName }}</span>
                <span class="merchant-location">{{
                  product.location || getMerchant(product.merchantId)?.location
                }}</span>
                <a class="merchant-phone" :href="`tel:${product.phone.replace(/[^\d+]/g, '')}`">
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
      </section>
    </div>
  </AppShell>
</template>