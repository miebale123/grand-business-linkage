import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/modules/auth'
import { useFavorites } from '@/modules/marketplace/composables/useFavorites'
import * as api from '@/shared/api/api'
import { normalizeImageUrl } from '@/shared/api/images'
import type {
  CatalogMetadata,
  MarketplaceAreaRecord,
  MarketplaceConfig,
  MerchantRecord,
  ProductRecord,
} from '@/shared/types'

export function useLandingPage() {
  const auth = useAuthStore()
  const router = useRouter()
  const { isFavorite, toggleFavorite } = useFavorites()

  const featured = ref<ProductRecord[]>([])
  const products = ref<ProductRecord[]>([])
  const merchants = ref<MerchantRecord[]>([])
  const areas = ref<MarketplaceAreaRecord[]>([])
  const exactLocationSpotlights = ref<MerchantRecord[]>([])
  const catalogMetadata = ref<CatalogMetadata | null>(null)
  const marketplaceConfig = ref<MarketplaceConfig | null>(null)
  const loading = ref(true)
  const isSearchActive = ref(false)

  const defaultArea = computed(() => marketplaceConfig.value?.defaultArea ?? 'Addis Ababa')

  const heroSearch = reactive({
    search: '',
    category: 'All',
    area: 'All Areas',
    sortBy: '' as '' | 'price_asc' | 'price_desc' | 'newest' | 'oldest',
  })

  const accountArea = computed(() => api.getAreaLabel(auth.user?.location))
  const selectedArea = computed(() =>
    heroSearch.area !== 'All Areas'
      ? heroSearch.area
      : accountArea.value || api.getPreferredMarketplaceArea(),
  )

  const areaOptions = computed(() => {
    const normalized = areas.value
      .map((record) => record.area.trim())
      .filter((area) => area.length > 0)
      .reduce<Map<string, string>>((map, area) => {
        const key = area.toLowerCase()
        if (!map.has(key)) {
          map.set(key, area)
        }
        return map
      }, new Map())

    if (!normalized.has(defaultArea.value.toLowerCase())) {
      normalized.set(defaultArea.value.toLowerCase(), defaultArea.value)
    }

    const uniqueAreas = Array.from(normalized.values()).sort((a, b) => a.localeCompare(b))
    return [
      defaultArea.value,
      ...uniqueAreas.filter((area) => area.toLowerCase() !== defaultArea.value.toLowerCase()),
    ]
  })

  onMounted(async () => {
    const [allProducts, featuredProducts, merchantRecords, areaRecords, metadata, config] =
      await Promise.all([
        api.fetchProducts({ status: 'approved' }),
        api.fetchFeaturedProducts(),
        api.fetchMerchants(),
        api.fetchMarketplaceAreas(),
        api.fetchCatalogMetadata(),
        api.fetchMarketplaceConfig(),
      ])

    products.value = allProducts
    featured.value = featuredProducts.slice(0, 6)
    merchants.value = merchantRecords
    areas.value = areaRecords
    catalogMetadata.value = metadata
    marketplaceConfig.value = config

    heroSearch.area = api.getPreferredMarketplaceArea() || accountArea.value || defaultArea.value

    await refreshLocationSpotlights(selectedArea.value)
    loading.value = false
  })

  watch(
    () => heroSearch.area,
    async (area) => {
      if (area === 'All Areas') {
        api.savePreferredMarketplaceArea()
        await refreshLocationSpotlights(accountArea.value || api.getPreferredMarketplaceArea())
        return
      }

      api.savePreferredMarketplaceArea(area)
      await refreshLocationSpotlights(area)
    },
  )

  const productCategories = computed(() => [
    ...new Set(products.value.map((product) => product.category)),
  ])
  const searchCategories = computed(() => [
    'All',
    ...(catalogMetadata.value?.categories.length
      ? catalogMetadata.value.categories
      : productCategories.value),
  ])

  const categoryHighlights = computed(() =>
    productCategories.value.slice(0, 5).map((category) => ({
      name: category,
      count: products.value.filter((product) => product.category === category).length,
    })),
  )
  const spotlightMerchants = computed(() => merchants.value.slice(0, 3))
  const spotlightCards = computed(() =>
    exactLocationSpotlights.value.length
      ? exactLocationSpotlights.value.map((merchant) => ({ merchant }))
      : spotlightMerchants.value.map((merchant) => ({ merchant })),
  )

  const searchResults = computed(() => {
    if (!isSearchActive.value) return []

    let filtered = products.value.filter((p) => p.status === 'approved')

    if (heroSearch.search) {
      const query = heroSearch.search.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.shortDescription.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query),
      )
    }

    if (heroSearch.area && heroSearch.area !== 'All Areas') {
      filtered = filtered.filter((p) => {
        const merchant = merchants.value.find((m) => m.id === p.merchantId)
        return p.location === heroSearch.area || merchant?.location === heroSearch.area
      })
    }

    if (heroSearch.category && heroSearch.category !== 'All') {
      filtered = filtered.filter((p) => p.category === heroSearch.category)
    }

    if (heroSearch.sortBy === 'price_asc') {
      filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price))
    } else if (heroSearch.sortBy === 'price_desc') {
      filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price))
    } else if (heroSearch.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (heroSearch.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }

    return filtered
  })

  function openMarketplace(term?: string) {
    const query: Record<string, string> = {}

    const nextSearch = (term ?? heroSearch.search)?.trim()
    if (nextSearch) {
      query.q = nextSearch
    }
    if (heroSearch.area && heroSearch.area !== 'All Areas') {
      query.area = heroSearch.area
      api.savePreferredMarketplaceArea(heroSearch.area)
    }
    if (heroSearch.category && heroSearch.category !== 'All') {
      query.category = heroSearch.category
    }

    router.push({ path: '/buy', query })
  }

  function clearSearch() {
    isSearchActive.value = false
    heroSearch.search = ''
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

  function setSearch(term: string) {
    heroSearch.search = term
    openMarketplace()
  }

  const searchResultsNormalized = computed(() =>
    searchResults.value.map((p) => ({ ...p, image: normalizeImageUrl(p.image) })),
  )
  const featuredNormalized = computed(() =>
    featured.value.map((p) => ({ ...p, image: normalizeImageUrl(p.image) })),
  )

  function getMerchant(id: string) {
    return merchants.value.find((m) => m.id === id)
  }

  return {
    auth,
    featured: featuredNormalized,
    products,
    merchants,
    areas,
    exactLocationSpotlights,
    catalogMetadata,
    marketplaceConfig,
    loading,
    isSearchActive,
    heroSearch,
    areaOptions,
    productCategories,
    searchCategories,
    categoryHighlights,
    spotlightMerchants,
    spotlightCards,
    searchResults: searchResultsNormalized,
    isFavorite,
    toggleFavorite,
    openMarketplace,
    clearSearch,
    refreshLocationSpotlights,
    setSearch,
    getMerchant,
  }
}