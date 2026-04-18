<script setup lang="ts">
import { getMerchantProductEditPath, routePaths } from '@/app/router/paths'
import { useMerchantDashboardPage } from './MerchantDashboardPage'
import './MerchantDashboardPage.css'

const {
  products,
  inquiries,
  busy,
  searchQuery,
  activeCategory,
  mobileMenuOpen,
  categories,
  productById,
  filteredProducts,
  latestInquiries,
  reviewPolicy,
  stats,
  refresh,
  removeProduct,
  logout,
  formatDate,
  getStatusClass,
  toggleMobileMenu,
  closeMobileMenu,
} = useMerchantDashboardPage()
</script>

<template>
  <div class="dashboard">
    <header class="dash-header">
      <RouterLink :to="routePaths.merchantDashboard" class="brand-link">
        <span class="brand-mark">BH</span>
        <span class="brand-name">Business Hub</span>
      </RouterLink>
      <button
        class="mobile-menu-btn"
        type="button"
        aria-label="Open navigation menu"
        @click="toggleMobileMenu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <nav class="dash-nav">
        <RouterLink :to="routePaths.merchantDashboard" class="nav-item active">Dashboard</RouterLink>
        <RouterLink :to="routePaths.home" class="nav-item">Back to marketplace</RouterLink>
      </nav>
      <div class="dash-actions">
        <button
          class="add-listing-btn"
          type="button"
          @click="$router.push(routePaths.merchantProductCreate)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add listing
        </button>
        <button class="logout-btn" type="button" @click="logout">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
        <div class="user-avatar">U</div>
      </div>
    </header>

    <div v-if="mobileMenuOpen" class="mobile-menu-container">
      <div class="overlay" @click="closeMobileMenu"></div>

      <aside class="mobile-sidebar">
        <header class="mobile-sidebar-header">
          <RouterLink :to="routePaths.merchantDashboard" class="brand-link" @click="closeMobileMenu">
            <span class="brand-mark">BH</span>
            <span class="brand-name">Business Hub</span>
          </RouterLink>
          <button
            class="mobile-close-btn"
            type="button"
            aria-label="Close navigation menu"
            @click="closeMobileMenu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
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
        </header>

        <nav class="mobile-nav">
          <RouterLink :to="routePaths.merchantDashboard" class="mobile-nav-link" @click="closeMobileMenu">
            Dashboard
          </RouterLink>
          <RouterLink :to="routePaths.home" class="mobile-nav-link" @click="closeMobileMenu">
            Back to marketplace
          </RouterLink>
        </nav>

        <div class="mobile-menu-actions">
          <button
            class="add-listing-btn mobile-add-listing-btn"
            type="button"
            @click="
              () => {
                closeMobileMenu()
                $router.push(routePaths.merchantProductCreate)
              }
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add listing
          </button>
          <button
            class="mobile-logout-btn"
            type="button"
            @click="
              async () => {
                closeMobileMenu()
                await logout()
              }
            "
          >
            Sign out
          </button>
        </div>
      </aside>
    </div>

    <main class="dash-main">
      <section class="dash-hero">
        <div class="hero-content">
          <h1 class="hero-title">Manage your storefront</h1>
          <p class="hero-subtitle">{{ reviewPolicy }}</p>
        </div>
        <div class="hero-stats">
          <div v-for="stat in stats" :key="stat.label" class="stat-card" :class="stat.color">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </section>

      <section class="dash-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search listings..."
              class="search-input"
            />
            <button v-if="searchQuery" class="search-clear" type="button" @click="searchQuery = ''">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="category-tabs">
            <button
              v-for="cat in categories"
              :key="cat"
              class="category-tab"
              :class="{ active: activeCategory === cat }"
              type="button"
              @click="activeCategory = cat"
            >
              {{ cat === 'All' ? 'All' : cat }}
            </button>
          </div>
        </div>
        <div class="toolbar-right">
          <span class="listing-count"
            >{{ filteredProducts.length }} listing{{
              filteredProducts.length !== 1 ? 's' : ''
            }}</span
          >
          <button class="refresh-btn" type="button" @click="refresh">
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
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Refresh
          </button>
        </div>
      </section>

      <div class="dash-content">
        <section class="listings-section">
          <div v-if="busy" class="empty-state">
            <div class="spinner"></div>
            <p>Loading your listings...</p>
          </div>
          <div v-else-if="!products.length" class="empty-state">
            <div class="empty-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <p class="empty-title">No listings yet</p>
            <p class="empty-desc">Create your first product to start selling on the marketplace.</p>
            <RouterLink :to="routePaths.merchantProductCreate" class="empty-action">Create listing</RouterLink>
          </div>
          <div v-else-if="!filteredProducts.length" class="empty-state">
            <p class="empty-title">No matches found</p>
            <p class="empty-desc">Try adjusting your search or category filter.</p>
          </div>
          <div v-else class="listings-grid">
            <article v-for="product in filteredProducts" :key="product.id" class="listing-card">
              <div class="listing-image">
                <img :src="product.image" :alt="product.name" />
                <span class="listing-status" :class="getStatusClass(product.status)">{{
                  product.status
                }}</span>
              </div>
              <div class="listing-body">
                <div class="listing-header">
                  <h3 class="listing-name">{{ product.name }}</h3>
                  <span class="listing-price">ETB {{ product.price.toLocaleString() }}</span>
                </div>
                <p class="listing-meta">
                  {{ product.category }} · {{ product.condition }}
                </p>
                <p class="listing-desc">{{ product.shortDescription }}</p>
                <div class="listing-footer">
                  <span class="listing-location">{{ product.location }}</span>
                  <div class="listing-actions">
                    <RouterLink :to="getMerchantProductEditPath(product.id)" class="action-btn edit"
                      >Edit</RouterLink
                    >
                    <button
                      type="button"
                      class="action-btn delete"
                      @click="removeProduct(product.id)"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>