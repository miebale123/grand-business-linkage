<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { buildLoginLocation, buildRegisterLocation, routePaths } from '@/app/router/paths'
import ProductCard from '@/modules/marketplace/components/ProductCard.vue'
import { useAuthStore } from '@/modules/auth'
import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import type {
  CatalogMetadata,
  MarketplaceAreaRecord,
  MerchantRecord,
  ProductRecord,
  Role,
} from '@/shared/types'

const auth = useAuthStore()
const router = useRouter()
const featured = ref<ProductRecord[]>([])
const products = ref<ProductRecord[]>([])
const merchants = ref<MerchantRecord[]>([])
const areas = ref<MarketplaceAreaRecord[]>([])
const exactLocationSpotlights = ref<MerchantRecord[]>([])
const catalogMetadata = ref<CatalogMetadata | null>(null)
const loading = ref(true)

const valueProps = [
  {
    title: 'Shop what is actually available',
    copy: 'See which seller has the product, what stock looks like, and how to reach them before you make the trip.',
  },
  {
    title: 'Give merchants a stronger storefront',
    copy: 'Sellers can publish listings, keep details clean, and respond to real buying intent from one dashboard.',
  },
  {
    title: 'Keep the platform easy to manage',
    copy: 'Admins track users, merchant verification, and marketplace activity without needing a complicated backend.',
  },
]
const roleCards: Array<{ role: Role; title: string; copy: string; cta: string }> = [
  {
    role: 'user',
    title: 'Shopper view',
    copy: 'Search products, compare local shops in your exact area, and send a question before you buy.',
    cta: 'Browse as shopper',
  },
  {
    role: 'merchant',
    title: 'Seller view',
    copy: 'Manage product cards, highlight featured items, and keep stock information current.',
    cta: 'Open seller workspace',
  },
  {
    role: 'admin',
    title: 'Admin view',
    copy: 'Review platform health, merchant verification, and account activity in one place.',
    cta: 'Open admin console',
  },
]
const heroSearch = reactive({
  search: '',
  category: 'All',
  area: 'All Areas',
})

const accountArea = computed(() => api.getAreaLabel(auth.user?.location))
const selectedArea = computed(() =>
  heroSearch.area !== 'All Areas' ? heroSearch.area : accountArea.value || api.getPreferredMarketplaceArea(),
)

onMounted(async () => {
  const [allProducts, featuredProducts, merchantRecords, areaRecords, metadata] = await Promise.all([
    api.fetchProducts(),
    api.fetchFeaturedProducts(),
    api.fetchMerchants(),
    api.fetchMarketplaceAreas(),
    api.fetchCatalogMetadata(),
  ])

  products.value = allProducts
  featured.value = featuredProducts.slice(0, 6)
  merchants.value = merchantRecords
  areas.value = areaRecords
  catalogMetadata.value = metadata

  const initialArea = api.getPreferredMarketplaceArea() || accountArea.value
  if (initialArea) {
    heroSearch.area = initialArea
  }

  await refreshLocationSpotlights(selectedArea.value)
  loading.value = false
})

watch(
  () => heroSearch.area,
  async (area) => {
    if (area === 'All Areas') {
      await refreshLocationSpotlights(accountArea.value || api.getPreferredMarketplaceArea())
      return
    }

    api.savePreferredMarketplaceArea(area)
    await refreshLocationSpotlights(area)
  },
)

const productCategories = computed(() => [...new Set(products.value.map((product) => product.category))])
const searchCategories = computed(() => [
  'All',
  ...(catalogMetadata.value?.categories.length ? catalogMetadata.value.categories : productCategories.value),
])

const marketplaceStats = computed(() => [
  {
    label: 'Live listings',
    value: products.value.length || 0,
  },
  {
    label: 'Active sellers',
    value: merchants.value.length || 0,
  },
  {
    label: 'Verified shops',
    value: merchants.value.filter((merchant) => merchant.verified).length || 0,
  },
  {
    label: 'Neighborhoods',
    value:
      new Set(
        merchants.value.map((merchant) => {
          const [area] = merchant.location.split(',')
          return (area ?? merchant.location).trim()
        }),
      ).size || 0,
  },
])

const spotlightMerchants = computed(() => merchants.value.slice(0, 3))
const categoryHighlights = computed(() =>
  productCategories.value
    .slice(0, 5)
    .map((category) => ({
      name: category,
      count: products.value.filter((product) => product.category === category).length,
    })),
)
const areaHighlights = computed(() => areas.value.slice(0, 5))
const spotlightCards = computed(() =>
  exactLocationSpotlights.value.length
    ? exactLocationSpotlights.value.map((merchant) => ({ merchant }))
    : spotlightMerchants.value.map((merchant) => ({ merchant })),
)

async function openMarketplace() {
  if (heroSearch.area !== 'All Areas') {
    api.savePreferredMarketplaceArea(heroSearch.area)
  }

  await router.push({
    name: 'user-dashboard',
    query: {
      search: heroSearch.search || undefined,
      category: heroSearch.category !== 'All' ? heroSearch.category : undefined,
      area: heroSearch.area !== 'All Areas' ? heroSearch.area : undefined,
    },
  })
}

async function refreshLocationSpotlights(area?: string) {
  if (!area) {
    exactLocationSpotlights.value = []
    return
  }

  exactLocationSpotlights.value = await api.fetchMerchantsByArea(area, {
    limit: 3,
  })
}

async function useArea(area: string) {
  heroSearch.area = area
  await refreshLocationSpotlights(area)
}

function roleDestination(role: Role) {
  if (role === 'merchant') {
    return buildLoginLocation({ role: 'merchant' })
  }

  if (role === 'admin') {
    return buildLoginLocation({ role: 'admin' })
  }

  return auth.user?.role === 'user' ? routePaths.userDashboard : buildLoginLocation({ role: 'user' })
}
</script>

<template>
  <AppShell>
    <section class="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_420px]">
      <div class="shell-panel relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
        <div class="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.2),transparent_52%),radial-gradient(circle_at_top_right,rgba(201,105,61,0.16),transparent_42%)]" />
        <div class="relative">
          <p class="section-eyebrow">Business Linkage Marketplace</p>
          <h1 class="section-title max-w-3xl">
            Find trusted local products without jumping from shop to shop.
          </h1>
          <p class="section-copy max-w-2xl">
            Browse real-looking product listings, compare exact-location sellers, and send a question
            before you leave home. Merchants and admins get their own focused workspaces.
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink class="btn-primary" :to="routePaths.userDashboard">Explore marketplace</RouterLink>
            <RouterLink class="btn-secondary" :to="buildRegisterLocation('merchant')">Sell on Business Linkage</RouterLink>
          </div>

          <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div
              v-for="stat in marketplaceStats"
              :key="stat.label"
              class="rounded-[24px] border border-[var(--line)] bg-white/78 p-4 shadow-sm"
            >
              <p class="text-sm font-semibold text-[var(--muted)]">{{ stat.label }}</p>
              <p class="mt-3 font-heading text-3xl font-semibold text-[var(--text)]">{{ stat.value }}</p>
            </div>
          </div>

          <div class="mt-8 grid gap-4 md:grid-cols-3">
            <div v-for="item in valueProps" :key="item.title" class="rounded-[26px] bg-[var(--surface-alt)] p-5">
              <h2 class="font-heading text-xl font-semibold text-[var(--text)]">{{ item.title }}</h2>
              <p class="mt-3 text-sm leading-6 text-[var(--muted)]">{{ item.copy }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <section class="shell-panel px-6 py-7">
          <p class="section-eyebrow">Start with a search</p>
          <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
            Search the catalog
          </h2>
          <p class="mt-3 text-sm leading-6 text-[var(--muted)]">
            Try a product name, then narrow results by category before opening a listing.
          </p>

          <div class="mt-6 space-y-4">
            <label class="field-label">
              What are you looking for?
              <input
                v-model="heroSearch.search"
                class="input-field"
                type="text"
                placeholder="Speaker, wall clock, rice, baby feeding set..."
              />
            </label>

            <label class="field-label">
              Category
              <select v-model="heroSearch.category" class="select-field">
                <option v-for="category in searchCategories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </label>

            <label class="field-label">
              Location
              <select v-model="heroSearch.area" class="select-field">
                <option value="All Areas">All areas</option>
                <option v-for="area in areas" :key="area.area" :value="area.area">
                  {{ area.area }}
                </option>
              </select>
            </label>

            <button
              v-if="accountArea"
              class="btn-ghost w-full justify-center"
              type="button"
              @click="useArea(accountArea)"
            >
              Use my area: {{ accountArea }}
            </button>

            <button class="btn-primary w-full justify-center" type="button" @click="openMarketplace">
              Search marketplace
            </button>
          </div>
        </section>

        <section class="shell-panel px-6 py-7">
          <p class="section-eyebrow">Browse by area</p>
          <div class="mt-4 flex flex-wrap gap-3">
            <button
              v-for="area in areaHighlights"
              :key="area.area"
              class="chip !px-4 !py-2"
              type="button"
              @click="useArea(area.area)"
            >
              {{ area.area }} · {{ area.productCount }} listings
            </button>
          </div>

          <p class="mt-5 text-sm leading-6 text-[var(--muted)]">
            Popular categories:
            {{ categoryHighlights.map((category) => `${category.name} (${category.count})`).join(' · ') }}
          </p>
        </section>
      </div>
    </section>

    <section class="mt-8">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="section-eyebrow">Three-role app</p>
          <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
            Switch between shopper, seller, and admin flows
          </h2>
        </div>
        <p class="max-w-xl text-sm leading-6 text-[var(--muted)]">
          Each role uses the same mock API data, but the interface changes to match what that person actually needs to do.
        </p>
      </div>

      <div class="grid gap-5 lg:grid-cols-3">
        <article
          v-for="card in roleCards"
          :key="card.role"
          class="shell-panel flex h-full flex-col px-6 py-6"
        >
          <p class="section-eyebrow">{{ card.title }}</p>
          <h3 class="font-heading text-2xl font-semibold tracking-tight text-[var(--text)]">
            {{ card.role === 'user' ? 'Discover products faster' : card.role === 'merchant' ? 'Run a cleaner storefront' : 'See the platform at a glance' }}
          </h3>
          <p class="mt-4 flex-1 text-sm leading-6 text-[var(--muted)]">{{ card.copy }}</p>
          <RouterLink class="btn-secondary mt-6 w-fit" :to="roleDestination(card.role)">
            {{ card.cta }}
          </RouterLink>
        </article>
      </div>
    </section>

    <section class="mt-8">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="section-eyebrow">Featured right now</p>
          <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
            A marketplace homepage should feel shoppable
          </h2>
        </div>
        <RouterLink class="btn-ghost w-fit" :to="routePaths.userDashboard">See all listings</RouterLink>
      </div>

      <div v-if="loading" class="empty-panel">Loading featured products...</div>
      <div v-else class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ProductCard
          v-for="product in featured"
          :key="product.id"
          :product="product"
          :merchant="merchants.find((merchant) => merchant.id === product.merchantId)"
          :show-merchant-link="true"
        />
      </div>
    </section>

    <section class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section class="shell-panel px-6 py-7 sm:px-8">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="section-eyebrow">
              {{ selectedArea ? `Sellers in ${selectedArea}` : 'Seller spotlights' }}
            </p>
            <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
              {{ selectedArea ? 'Compare exact matches before you travel' : 'Meet the businesses behind the listings' }}
            </h2>
          </div>
          <RouterLink class="btn-ghost w-fit" :to="routePaths.userDashboard">Browse marketplace</RouterLink>
        </div>

        <div class="mt-6 grid gap-5 md:grid-cols-3">
          <RouterLink
            v-for="entry in spotlightCards"
            :key="entry.merchant.id"
            :to="`/merchants/${entry.merchant.id}`"
            class="rounded-[28px] border border-[var(--line)] bg-[var(--surface-alt)] p-5 transition hover:-translate-y-1 hover:bg-white"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-heading text-xl font-semibold text-[var(--text)]">
                  {{ entry.merchant.businessName }}
                </p>
                <p class="mt-2 text-sm text-[var(--muted)]">{{ entry.merchant.location }}</p>
              </div>
              <span class="chip" :class="entry.merchant.verified ? 'chip-good' : 'chip-muted'">
                {{ entry.merchant.verified ? 'Verified' : 'Reviewing' }}
              </span>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="chip chip-muted">
                Delivers to {{ entry.merchant.deliveryAreas.slice(0, 2).join(', ') }}
              </span>
            </div>
            <p class="mt-4 text-sm leading-6 text-[var(--muted)]">{{ entry.merchant.description }}</p>
          </RouterLink>
        </div>
      </section>

      <aside class="shell-panel px-6 py-7">
        <p class="section-eyebrow">Local mock model</p>
        <h2 class="font-heading text-2xl font-semibold tracking-tight text-[var(--text)]">
          Built against local business data
        </h2>
        <p class="mt-3 text-sm leading-6 text-[var(--muted)]">
          This build runs on local mock data in the browser, so the frontend stays aligned to your own
          users, merchants, products, and inquiries instead of a public placeholder API.
        </p>

        <div class="mt-6 space-y-4">
          <div class="rounded-[24px] bg-[var(--surface-alt)] p-4">
            <p class="text-sm font-semibold text-[var(--text)]">Auth and roles</p>
            <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
              Sign in is role-aware, registration is open for shoppers and merchants, and admin access remains separate.
            </p>
          </div>
          <div class="rounded-[24px] bg-[var(--surface-alt)] p-4">
            <p class="text-sm font-semibold text-[var(--text)]">Swappable backend boundary</p>
            <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
              The UI talks to a shared API boundary, so you can swap the current browser mock for `json-server` or a real backend without redesigning the screens.
            </p>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <RouterLink class="btn-primary" :to="buildLoginLocation({ role: 'user' })">Open sign in</RouterLink>
          <RouterLink class="btn-ghost" :to="buildRegisterLocation()">Create new account</RouterLink>
        </div>
      </aside>
    </section>
  </AppShell>
</template>
