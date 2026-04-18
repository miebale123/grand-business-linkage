<script setup lang="ts">
import { routePaths } from '@/app/router/paths'
import { useAdminMerchantsPage } from './AdminMerchantsPage'
import './AdminMerchantsPage.css'

const {
  loading,
  merchants,
  products,
  pendingMerchants,
  verifiedMerchants,
  basicMerchants,
  statusCounts,
  userById,
  productCountByMerchant,
  merchantById,
  actioningId,
  actioningProductId,
  getVerificationStatusLabel,
  refresh,
  updateVerification,
  updateProductStatus,
  logout,
} = useAdminMerchantsPage()
</script>

<template>
  <div class="admin-console">
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">□</span>
        <span class="brand-text">NEXUS</span>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-section-label">DASHBOARD</span>
          <RouterLink
            :to="routePaths.adminDashboard"
            class="nav-item"
            :class="{ active: $route.name === 'admin-overview' }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Overview
          </RouterLink>
        </div>

        <div class="nav-section">
          <span class="nav-section-label">MERCHANTS</span>
          <RouterLink
            :to="routePaths.adminBasicMerchants"
            class="nav-item"
            :class="{ active: $route.name === 'admin-basic-merchants' }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Basic
            <span v-if="pendingMerchants.length" class="badge-count">{{
              pendingMerchants.length
            }}</span>
          </RouterLink>
          <RouterLink
            :to="routePaths.adminVerifiedMerchants"
            class="nav-item"
            :class="{ active: $route.name === 'admin-verified-merchants' }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Verified
          </RouterLink>
        </div>

        <div class="nav-section">
          <span class="nav-section-label">PRODUCTS</span>
          <RouterLink
            :to="routePaths.adminProducts"
            class="nav-item"
            :class="{ active: $route.name === 'admin-products' }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
              />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            All Listings
            <span v-if="products.length" class="badge-count">{{ products.length }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" type="button" @click="logout">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
        <div class="user-card">
          <div class="user-avatar">{{ 'A' }}</div>
          <div class="user-info">
            <span class="user-name">Admin</span>
            <span class="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </aside>

    <main class="admin-main">
      <section class="admin-hero">
        <div class="hero-content">
          <h1 class="hero-title">Merchant Control</h1>
          <p class="hero-subtitle">Verify trusted sellers, review pending listings.</p>
        </div>
        <button class="refresh-btn" type="button" @click="refresh">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          Refresh
        </button>
      </section>

      <template v-if="$route.name === 'admin-overview'">
        <section class="stats-bar">
          <div class="stat-box">
            <span class="stat-num">{{ statusCounts.total }}</span>
            <span class="stat-lbl">Total</span>
          </div>
          <div class="stat-box stat-success">
            <span class="stat-num">{{ statusCounts.verified }}</span>
            <span class="stat-lbl">Verified</span>
          </div>
          <div class="stat-box stat-warning">
            <span class="stat-num">{{ statusCounts.pending }}</span>
            <span class="stat-lbl">Pending</span>
          </div>
          <div class="stat-box stat-accent">
            <span class="stat-num">{{ products.length }}</span>
            <span class="stat-lbl">Listings</span>
          </div>
        </section>

        <div class="overview-summary">
          <div class="summary-grid">
            <div class="summary-card">
              <span class="summary-num">{{ pendingMerchants.length }}</span>
              <span class="summary-lbl">Merchants need review</span>
            </div>
            <div class="summary-card">
              <span class="summary-num">{{ products.length }}</span>
              <span class="summary-lbl">Products to manage</span>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="$route.name === 'admin-basic-merchants'">
        <section class="panel-section full-width">
          <div class="section-header">
            <div class="section-badge">BASIC</div>
            <h2 class="section-title">Basic Merchants</h2>
            <span class="section-count">{{ basicMerchants.length }}</span>
          </div>
          <div v-if="loading" class="panel-loading"><div class="loading-dots"></div></div>
          <div v-else-if="basicMerchants.length" class="queue-cards">
            <article v-for="merchant in basicMerchants" :key="merchant.id" class="queue-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">
                    {{ merchant.businessName || userById[merchant.ownerId]?.name || 'Unnamed merchant' }}
                  </h3>
                  <p v-if="merchant.category || merchant.area" class="card-meta">
                    {{ [merchant.category, merchant.area].filter(Boolean).join(' · ') }}
                  </p>
                </div>
                <span class="status-tag tag-pending">BASIC</span>
              </div>
              <p v-if="merchant.description" class="card-desc">{{ merchant.description }}</p>
              <div class="card-meta-row">
                <span>{{ productCountByMerchant[merchant.id] || 0 }} listings</span>
                <span>{{ getVerificationStatusLabel(userById[merchant.ownerId]) }}</span>
              </div>
              <div class="card-meta-row">
                <span>{{ userById[merchant.ownerId]?.name || 'Unknown owner' }}</span>
                <span>{{ userById[merchant.ownerId]?.email || 'No email' }}</span>
              </div>
              <div class="card-meta-row">
                <span>{{ userById[merchant.ownerId]?.phone || 'No phone' }}</span>
                <span>{{ userById[merchant.ownerId]?.location || 'No location' }}</span>
              </div>
              <div class="card-meta-row">
                <span>License ID</span>
                <span>{{ userById[merchant.ownerId]?.merchantLicenseId || 'No license ID' }}</span>
              </div>
              <div class="card-actions">
                <div class="action-btns">
                  <button
                    class="btn-reject"
                    type="button"
                    :disabled="actioningId === merchant.id"
                    @click="updateVerification(merchant.id, false)"
                  >
                    Reject
                  </button>
                  <button
                    class="btn-approve"
                    type="button"
                    :disabled="actioningId === merchant.id"
                    @click="updateVerification(merchant.id, true)"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="panel-empty"><p>No basic merchants</p></div>
        </section>
      </template>

      <template v-else-if="$route.name === 'admin-verified-merchants'">
        <section class="panel-section full-width">
          <div class="section-header">
            <div class="section-badge verified">VERIFIED</div>
            <h2 class="section-title">Verified Merchants</h2>
            <span class="section-count">{{ verifiedMerchants.length }}</span>
          </div>
          <div v-if="loading" class="panel-loading"><div class="loading-dots"></div></div>
          <div v-else-if="verifiedMerchants.length" class="verified-grid">
            <article v-for="merchant in verifiedMerchants" :key="merchant.id" class="verified-card">
              <div class="verified-info">
                <h3 class="verified-name">{{ merchant.businessName }}</h3>
                <p class="verified-meta">{{ merchant.category }} · {{ merchant.area }}</p>
                <p class="verified-desc">{{ merchant.description }}</p>
              </div>
              <div class="verified-stats">
                <span class="verified-count">{{ productCountByMerchant[merchant.id] || 0 }}</span>
                <span class="verified-label">listings</span>
              </div>
              <div class="verified-actions">
                <button
                  class="btn-revoke"
                  type="button"
                  :disabled="actioningId === merchant.id"
                  @click="updateVerification(merchant.id, false)"
                >
                  Revoke
                </button>
              </div>
            </article>
          </div>
          <div v-else class="panel-empty"><p>No verified merchants</p></div>
        </section>
      </template>

      <template v-else-if="$route.name === 'admin-products'">
        <section class="panel-section full-width">
          <div class="section-header">
            <div class="section-badge">PRODUCTS</div>
            <h2 class="section-title">All Product Listings</h2>
            <span class="section-count">{{ products.length }}</span>
          </div>
          <div v-if="loading" class="panel-loading"><div class="loading-dots"></div></div>
          <div v-else-if="products.length" class="products-table">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Merchant</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in products" :key="product.id">
                  <td>
                    <div class="product-cell">
                      <span class="product-name">{{ product.name }}</span>
                      <span class="product-meta">{{ product.category }}</span>
                    </div>
                  </td>
                  <td>ETB {{ product.price.toLocaleString() }}</td>
                  <td>
                    <span
                      class="merchant-type"
                      :class="merchantById[product.merchantId]?.verified ? 'verified' : 'basic'"
                    >
                      {{ merchantById[product.merchantId]?.businessName || 'Unknown' }}
                    </span>
                  </td>
                  <td>
                    <span
                      class="status-tag"
                      :class="
                        product.status === 'approved'
                          ? 'tag-approved'
                          : product.status === 'pending'
                            ? 'tag-pending'
                            : 'tag-rejected'
                      "
                    >
                      {{ product.status }}
                    </span>
                  </td>
                  <td>
                    <button
                      v-if="product.status === 'pending'"
                      class="btn-approve-sm"
                      type="button"
                      :disabled="actioningProductId === product.id"
                      @click="updateProductStatus(product.id, 'approved')"
                    >
                      Approve
                    </button>
                    <button
                      v-if="product.status === 'pending'"
                      class="btn-reject-sm"
                      type="button"
                      :disabled="actioningProductId === product.id"
                      @click="updateProductStatus(product.id, 'rejected')"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="panel-empty"><p>No products</p></div>
        </section>
      </template>
    </main>
  </div>
</template>