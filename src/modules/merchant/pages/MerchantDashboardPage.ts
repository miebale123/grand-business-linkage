import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { getMerchantProductEditPath, routePaths } from '@/app/router/paths'
import * as api from '@/shared/api/api'
import { normalizeImageUrl } from '@/shared/api/images'
import type {
  InquiryRecord,
  MarketplaceConfig,
  MerchantRecord,
  ProductRecord,
} from '@/shared/types'
import { useAuthStore } from '@/modules/auth'

export function useMerchantDashboardPage() {
  const auth = useAuthStore()
  const router = useRouter()

  const merchant = ref<MerchantRecord | null>(null)
  const products = ref<ProductRecord[]>([])
  const inquiries = ref<InquiryRecord[]>([])
  const marketplaceConfig = ref<MarketplaceConfig | null>(null)
  const busy = ref(true)
  const searchQuery = ref('')
  const activeCategory = ref('All')
  const mobileMenuOpen = ref(false)

  const categories = computed(() => [
    'All',
    ...Array.from(new Set(products.value.map((p) => p.category))).sort(),
  ])

  const productById = computed(() =>
    products.value.reduce<Record<string, ProductRecord>>((map, p) => {
      map[p.id] = p
      return map
    }, {}),
  )

  const filteredProducts = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    const category = activeCategory.value

    return products.value
      .filter((p) => {
        if (category !== 'All' && p.category !== category) return false
        if (query) {
          return (
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.shortDescription?.toLowerCase().includes(query)
          )
        }
        return true
      })
      .map((p) => ({ ...p, image: normalizeImageUrl(p.image) }))
  })

  const latestInquiries = computed(() =>
    [...inquiries.value]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  )

  const statusCounts = computed(() => ({
    pending: products.value.filter((p) => p.status === 'pending').length,
    approved: products.value.filter((p) => p.status === 'approved').length,
    rejected: products.value.filter((p) => p.status === 'rejected').length,
  }))

  const workflowRules = computed(() => marketplaceConfig.value?.sellerWorkflowRules)
  const isVerified = computed(() => merchant.value?.verified ?? false)
  const reviewPolicy = computed(() =>
    isVerified.value
      ? (workflowRules.value?.verifiedReviewPolicy ?? 'Verified sellers publish directly.')
      : (workflowRules.value?.standardReviewPolicy ?? 'All listings are reviewed before publishing.'),
  )

  const stats = computed(() => [
    { label: 'Total listings', value: products.value.length, color: 'default' },
    { label: 'Pending review', value: statusCounts.value.pending, color: 'warn' },
    { label: 'Live on market', value: statusCounts.value.approved, color: 'success' },
  ])

  async function refresh() {
    if (!auth.user) return
    busy.value = true

    merchant.value = await api.fetchMerchantByOwner(auth.user.id)
    const m = merchant.value

    const [merchantProducts, merchantInquiries, config] = await Promise.all([
      m ? api.fetchMerchantProducts(m.id) : Promise.resolve([]),
      api.fetchMerchantInquiries(auth.user.id),
      api.fetchMarketplaceConfig(),
    ])

    products.value = merchantProducts
    inquiries.value = merchantInquiries
    marketplaceConfig.value = config
    busy.value = false
  }

  async function removeProduct(productId: string) {
    if (!auth.user) return
    if (!confirm('Are you sure you want to delete this listing?')) return
    await api.deleteMerchantProduct(auth.user.id, productId)
    await refresh()
  }

  async function logout() {
    await auth.logout()
    await router.push(routePaths.home)
  }

  onMounted(refresh)

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function getStatusClass(status: string) {
    if (status === 'approved') return 'approved'
    if (status === 'pending') return 'pending'
    return 'rejected'
  }

  function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value
  }

  function closeMobileMenu() {
    mobileMenuOpen.value = false
  }

  return {
    merchant,
    products,
    inquiries,
    marketplaceConfig,
    busy,
    searchQuery,
    activeCategory,
    mobileMenuOpen,
    categories,
    productById,
    filteredProducts,
    latestInquiries,
    statusCounts,
    isVerified,
    reviewPolicy,
    stats,
    refresh,
    removeProduct,
    logout,
    formatDate,
    getStatusClass,
    toggleMobileMenu,
    closeMobileMenu,
  }
}