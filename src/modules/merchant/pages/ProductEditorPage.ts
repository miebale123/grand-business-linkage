import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { routePaths } from '@/app/router/paths'
import * as api from '@/shared/api/api'
import { useAuthStore } from '@/modules/auth'
import type {
  CatalogMetadata,
  ListingType,
  MarketplaceConfig,
  MerchantRecord,
  ProductAvailability,
  ProductCondition,
  ProductPayload,
} from '@/shared/types'

export function useProductEditorPage() {
  const auth = useAuthStore()
  const route = useRoute()
  const router = useRouter()

  const productId = computed(() => route.params.id as string | undefined)
  const isEditMode = computed(() => Boolean(productId.value))
  const saving = ref(false)
  const error = ref('')
  const catalogMetadata = ref<CatalogMetadata | null>(null)
  const marketplaceConfig = ref<MarketplaceConfig | null>(null)
  const merchant = ref<MerchantRecord | null>(null)
  const catalogCategories = computed(() => catalogMetadata.value?.categories ?? [])
  const listingTypeOptions = computed(
    () => catalogMetadata.value?.listingTypes ?? ['For Sale', 'For Rent'],
  )
  const conditionOptions = ['New', 'Used'] as const

  const form = reactive({
    name: '',
    category: '',
    price: 0,
    salePrice: undefined as number | undefined,
    availability: 'In Stock' as ProductAvailability,
    condition: 'New' as ProductCondition,
    listingType: 'For Sale' as ListingType,
    shortDescription: '',
    description: '',
    image: '',
    images: [] as string[],
    location: '',
    phone: '',
    createdAt: '',
    featured: false,
  })

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

  const previewImage = computed(() => {
    const src = form.image
    if (!src) return 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=800&q=80'
    if (src.startsWith('data:')) return src
    if (src.startsWith('http')) return src
    return `${API_BASE_URL}${src}`
  })

  const isVerified = computed(() => merchant.value?.verified ?? false)

  async function logout() {
    await auth.logout()
    await router.push(routePaths.home)
  }

  onMounted(async () => {
    if (auth.user) {
      try {
        merchant.value = await api.fetchMerchantByOwner(auth.user.id)
      } catch {
        merchant.value = null
      }
    }

    const [metadata, config] = await Promise.all([
      api.fetchCatalogMetadata(),
      api.fetchMarketplaceConfig(),
    ])
    catalogMetadata.value = metadata
    marketplaceConfig.value = config
    form.category = catalogCategories.value[0] ?? form.category
    form.availability = catalogMetadata.value?.availabilityOptions?.[0] ?? form.availability
    form.location = merchant.value?.location || auth.user?.location || ''
    form.phone = auth.user?.phone || ''

    if (!productId.value) {
      return
    }

    const record = await api.fetchProductById(productId.value)
    Object.assign(form, {
      name: record.name,
      category: record.category,
      price: record.price,
      salePrice: record.salePrice,
      availability: record.availability,
      condition: record.condition,
      listingType: record.listingType,
      shortDescription: record.shortDescription,
      description: record.description,
      image: record.image,
      images: record.images.slice(1),
      location: record.location,
      phone: record.phone,
      createdAt: record.createdAt,
      featured: record.featured,
    })
  })

  async function handleSubmit() {
    if (!auth.user) {
      return
    }

    error.value = ''
    saving.value = true

    try {
      if (!form.image) {
        error.value = 'Please upload a main product image'
        saving.value = false
        return
      }

      const images = [form.image, ...form.images.filter(Boolean)]
      const payload: ProductPayload = {
        name: form.name,
        category: form.category,
        price: form.price,
        salePrice: form.salePrice || undefined,
        availability: form.availability,
        condition: form.condition,
        listingType: form.listingType,
        shortDescription: form.shortDescription,
        description: form.description,
        image: form.image,
        images,
        location: form.location,
        phone: form.phone,
        createdAt: form.createdAt,
        featured: form.featured,
      }

      await api.saveMerchantProduct(auth.user.id, payload, productId.value)

      if (auth.token) {
        auth.user = await api.getCurrentUser(auth.token)
      }

      await router.push(routePaths.merchantDashboard)
    } catch (issue) {
      error.value = issue instanceof Error ? issue.message : 'Could not save product.'
    } finally {
      saving.value = false
    }
  }

  function addImageSlot() {
    if (form.images.length < 5) {
      form.images.push('')
    }
  }

  function removeImageSlot(index: number) {
    form.images.splice(index, 1)
  }

  return {
    productId,
    isEditMode,
    saving,
    error,
    catalogMetadata,
    marketplaceConfig,
    merchant,
    catalogCategories,
    listingTypeOptions,
    conditionOptions,
    form,
    previewImage,
    isVerified,
    logout,
    handleSubmit,
    addImageSlot,
    removeImageSlot,
  }
}