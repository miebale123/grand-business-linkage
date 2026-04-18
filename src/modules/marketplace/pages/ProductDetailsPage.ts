import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import * as api from '@/shared/api/api'
import { normalizeImageUrl } from '@/shared/api/images'
import type { MerchantRecord, ProductRecord } from '@/shared/types'

export function useProductDetailsPage() {
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
  const normalizedProduct = computed(() => {
    if (!product.value) return null
    return {
      ...product.value,
      image: normalizeImageUrl(product.value.image),
      images: product.value.images.map((img: string) => normalizeImageUrl(img)),
    }
  })
  const galleryImages = computed(() =>
    normalizedProduct.value ? (normalizedProduct.value.images.length ? normalizedProduct.value.images : [normalizedProduct.value.image]) : [],
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
      relatedProducts.value = merchantCatalog
        .filter((item) => item.id !== record.id)
        .slice(0, 3)
        .map((p) => ({ ...p, image: normalizeImageUrl(p.image) }))

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

  return {
    product: normalizedProduct,
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
  }
}