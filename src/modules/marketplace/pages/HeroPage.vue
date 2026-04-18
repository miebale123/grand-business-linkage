<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import SearchBar from '@/shared/ui/SearchBar.vue'
import type { MarketplaceAreaRecord } from '@/shared/types'

const router = useRouter()

const MOBILE_BREAKPOINT = 768
const isMobile = ref(false)

const areas = ref<MarketplaceAreaRecord[]>([])
const selectedArea = ref('')
const desktopSearchQuery = ref('')

const showBanner = ref(true)
const activeTab = ref('Buy')
const tabs = ['Buy', 'Rent', 'Sell']
const mobileSearchQuery = ref('')

const areaOptions = computed(() => ['All Areas', ...areas.value.map((a) => a.area).filter(Boolean)])

const updateViewportMode = () => {
  isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
}

onMounted(async () => {
  updateViewportMode()
  window.addEventListener('resize', updateViewportMode)

  const [, areaRecords] = await Promise.all([api.fetchMarketplaceConfig(), api.fetchMarketplaceAreas()])
  areas.value = areaRecords
  selectedArea.value = api.getPreferredMarketplaceArea() || 'All Areas'
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportMode)
})

function handleDesktopSearch(term: string) {
  const nextQuery: Record<string, string> = {}
  const trimmedTerm = term?.trim()
  if (trimmedTerm) nextQuery.q = trimmedTerm

  const trimmedArea = selectedArea.value?.trim()
  if (trimmedArea && trimmedArea !== 'All Areas') nextQuery.area = trimmedArea

  router.push({ path: '/buy', query: nextQuery })
}

function closeBanner() {
  showBanner.value = false
}

function submitMobileSearch() {
  const trimmed = mobileSearchQuery.value.trim()
  const path = activeTab.value === 'Rent' ? '/rent' : '/buy'
  router.push({
    path,
    query: trimmed ? { q: trimmed } : {},
  })
}
</script>

<template>
  <AppShell v-if="!isMobile">
    <div class="hero-page">
      <div class="hero-bg">
        <div class="hero-overlay-desktop"></div>
      </div>

      <div class="hero-content-desktop">
        <p class="hero-subtitle-desktop">Discover trusted local listings across Ethiopia</p>

        <div class="buy-search">
          <SearchBar
            v-model="desktopSearchQuery"
            placeholder="Search for products, services, businesses..."
            :locations="areaOptions"
            :initialLocation="selectedArea"
            @search="handleDesktopSearch"
            @update:location="(area) => (selectedArea = area)"
          />
        </div>
      </div>
    </div>
  </AppShell>

  <div v-else class="home-container">
 
    <header class="main-header">
      <div class="header-spacer"></div>

      <div class="logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="#d92228">
          <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.5l5 4.5v7H7v-7l5-4.5z" />
        </svg>
        <span class="logo-text">Business Hub</span>
      </div>

      <button class="profile-btn" aria-label="User profile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>
    </header>

    <main>
      <section class="hero-section">
        <div class="hero-overlay"></div>

        <div class="hero-content">
          <h1 class="hero-title">
            Ethiopia's #1 Business Marketplace
          </h1>

          <nav class="search-tabs">
            <button
              v-for="tab in tabs"
              :key="tab"
              :class="['tab-btn', { active: activeTab === tab }]"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </nav>

          <div class="search-bar">
            <input
              v-model="mobileSearchQuery"
              type="text"
              placeholder="City, neighborhood, ZIP..."
              class="search-input"
              aria-label="Search"
              @keyup.enter="submitMobileSearch"
            />
            <button class="search-submit" aria-label="Submit search" @click="submitMobileSearch">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.hero-page {
  position: relative;
  min-height: calc(100vh - 150px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 20px 40px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--primary-deep) 0%, var(--primary) 50%, #8b5cf6 100%);
  z-index: 0;
}

.hero-overlay-desktop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.hero-content-desktop {
  position: relative;
  z-index: 1;
  max-width: 800px;
  width: 100%;
  text-align: center;
}

.hero-subtitle-desktop {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 40px;
}

.buy-search {
  max-width: 720px;
  margin: 0 auto;
}

.home-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.app-banner {
  background-color: #d92228;
  color: white;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
}

.banner-close {
  background: none;
  border: none;
  color: white;
  width: 24px;
  height: 24px;
}

.banner-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
}

.app-icon-placeholder {
  background: white;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-icon-placeholder svg {
  width: 20px;
  height: 20px;
}

.app-details {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 13px;
  font-weight: 600;
}

.app-rating {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stars {
  color: #fbbf24;
  letter-spacing: -1px;
}

.open-app-btn {
  background: transparent;
  border: 1px solid white;
  color: white;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
}

.main-header {
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.header-spacer,
.profile-btn {
  width: 28px;
  height: 28px;
}

.profile-btn {
  border: none;
  background: #475569;
  color: white;
  border-radius: 50%;
  padding: 4px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 4px;
}

.logo-icon {
  width: 20px;
  height: 20px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: #1e293b;
  display: flex;
}

.reg-mark {
  font-size: 9px;
  margin-top: 4px;
}

.hero-section {
  position: relative;
  min-height: calc(100vh - 150px);
  padding: 60px 20px 40px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-deep) 0%, var(--primary) 50%, #8b5cf6 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.hero-content {
  position: relative;
  z-index: 1;
  width: min(720px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-title {
  color: white;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 32px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.search-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  width: 100%;
  justify-content: center;
}

.tab-btn {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  font-weight: 500;
  padding-bottom: 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.tab-btn.active {
  border-bottom: 3px solid white;
  font-weight: 600;
}

.search-bar {
  background: white;
  border-radius: 30px;
  display: flex;
  align-items: center;
  padding: 6px 6px 6px 20px;
  width: 100%;
  max-width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-input {
  border: none;
  flex-grow: 1;
  font-size: 16px;
  outline: none;
}

.search-submit {
  background: #d92228;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-submit svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 480px) {
  .hero-section {
    padding: 20px 16px;
  }

  .hero-title {
    font-size: 20px;
    margin-bottom: 24px;
  }

  .search-tabs {
    gap: 12px;
    margin-bottom: 10px;
  }

  .tab-btn {
    font-size: 14px;
    padding-bottom: 4px;
  }

  .search-bar {
    padding: 4px 4px 4px 14px;
    border-radius: 24px;
  }

  .search-input {
    font-size: 14px;
    padding: 8px 0;
  }

  .search-input::placeholder {
    font-size: 13px;
  }

  .search-submit {
    width: 36px;
    height: 36px;
  }

  .search-submit svg {
    width: 18px;
    height: 18px;
  }
}
</style>
