import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { routePaths } from '@/app/router/paths'
import * as api from '@/shared/api/api'
import { useAuthStore } from '@/modules/auth'
import type { MerchantRecord, ProductRecord, UserRecord } from '@/shared/types'

export function useAdminMerchantsPage() {
  const auth = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const loading = ref(true)
  const merchants = ref<MerchantRecord[]>([])
  const products = ref<ProductRecord[]>([])
  const users = ref<UserRecord[]>([])
  const actioningId = ref('')
  const actioningProductId = ref('')

  const pendingMerchants = computed(() => merchants.value.filter((merchant) => !merchant.verified))
  const verifiedMerchants = computed(() => merchants.value.filter((merchant) => merchant.verified))
  const basicMerchants = computed(() => pendingMerchants.value)

  const statusCounts = computed(() => ({
    total: merchants.value.length,
    verified: verifiedMerchants.value.length,
    pending: pendingMerchants.value.length,
  }))

  const userById = computed(() =>
    users.value.reduce<Record<string, UserRecord>>((map, user) => {
      map[user.id] = user
      return map
    }, {}),
  )

  const productCountByMerchant = computed(() =>
    products.value.reduce<Record<string, number>>((map, product) => {
      map[product.merchantId] = (map[product.merchantId] || 0) + 1
      return map
    }, {}),
  )

  const pendingProducts = computed(() =>
    products.value.filter((product) => product.status === 'pending'),
  )

  const allProducts = computed(() => products.value)

  const merchantById = computed(() =>
    merchants.value.reduce<Record<string, MerchantRecord>>((map, merchant) => {
      map[merchant.id] = merchant
      return map
    }, {}),
  )

  function getVerificationStatusLabel(user: UserRecord | undefined) {
    if (user?.verificationRequestStatus === 'pending') return 'Request submitted'
    if (user?.verificationRequestStatus === 'rejected') return 'Needs resubmission'
    return 'No request yet'
  }

  async function refresh() {
    loading.value = true
    const [merchantRecords, productRecords, userRecords] = await Promise.all([
      api.fetchMerchants(),
      api.fetchProducts(),
      api.fetchUsersByRole('merchant'),
    ])
    merchants.value = merchantRecords
    products.value = productRecords
    users.value = userRecords
    loading.value = false
  }

  async function updateVerification(merchantId: string, verified: boolean) {
    actioningId.value = merchantId
    try {
      await api.updateMerchantVerification(merchantId, verified)
      await refresh()
    } catch (error) {
      console.error('Failed to update verification:', error)
      alert('Failed to update merchant verification. Please try again.')
    } finally {
      actioningId.value = ''
    }
  }

  async function updateProductStatus(productId: string, status: 'approved' | 'rejected') {
    actioningProductId.value = productId
    try {
      await api.updateProductStatus(productId, status)
      await refresh()
    } catch (error) {
      console.error('Failed to update product status:', error)
      alert('Failed to update product status. Please try again.')
    } finally {
      actioningProductId.value = ''
    }
  }

  async function logout() {
    await auth.logout()
    await router.push(routePaths.home)
  }

  onMounted(refresh)

  return {
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
  }
}