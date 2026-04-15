<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { routePaths } from '@/app/router/paths'
import * as api from '@/shared/api/api'
import { useAuthStore } from '@/modules/auth'
import AppShell from '@/shared/layouts/AppShell.vue'
import ImageUpload from '@/shared/ui/ImageUpload.vue'
import type {
  CatalogMetadata,
  ListingType,
  MerchantRecord,
  ProductAvailability,
  ProductCondition,
  ProductPayload,
} from '@/shared/types'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const productId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => Boolean(productId.value))
const saving = ref(false)
const error = ref('')
const catalogMetadata = ref<CatalogMetadata | null>(null)
const merchant = ref<MerchantRecord | null>(null)
const catalogCategories = computed(() => catalogMetadata.value?.categories ?? [])
const availabilityOptions = computed(() => catalogMetadata.value?.availabilityOptions ?? [])
const listingTypeOptions = computed(
  () => catalogMetadata.value?.listingTypes ?? ['For Sale', 'For Rent'],
)
const conditionOptions = ['New', 'Used'] as const

const form = reactive({
  name: '',
  category: '',
  price: 0,
  reducedPrice: undefined as number | undefined,
  availability: 'In Stock' as ProductAvailability,
  condition: 'New' as ProductCondition,
  listingType: 'For Sale' as ListingType,
  shortDescription: '',
  description: '',
  image: '',
  images: [] as string[],
  location: '',
  subcity: '',
  city: '',
  region: '',
  phone: '',
  createdAt: '',
  featured: false,
})

const priceHasReduction = computed(
  () => form.reducedPrice !== undefined && form.reducedPrice > 0 && form.reducedPrice < form.price,
)
const finalPrice = computed(() => (priceHasReduction.value ? form.reducedPrice : form.price))

const previewPrice = computed(() =>
  form.price > 0 ? `ETB ${form.price.toLocaleString()}` : 'Set a price',
)
const previewImage = computed(
  () =>
    form.image ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
)
const submissionStatus = computed(() => (merchant.value?.verified ? 'approved' : 'pending'))
const submissionStatusLabel = computed(() =>
  submissionStatus.value === 'approved' ? 'Approved on save' : 'Pending admin review',
)
const submissionStatusCopy = computed(() =>
  submissionStatus.value === 'approved'
    ? 'Your verified merchant account publishes directly to the shopper marketplace.'
    : 'Because this merchant account is not verified yet, every create or update goes back into review.',
)

onMounted(async () => {
  if (auth.user) {
    merchant.value = await api.fetchMerchantByOwner(auth.user.id)
  }

  catalogMetadata.value = await api.fetchCatalogMetadata()
  form.category = catalogCategories.value[0] ?? form.category
  form.availability = availabilityOptions.value[0] ?? form.availability
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
    reducedPrice: record.reducedPrice,
    availability: record.availability,
    condition: record.condition,
    listingType: record.listingType,
    shortDescription: record.shortDescription,
    description: record.description,
    image: record.image,
    images: record.images.slice(1),
    location: record.location,
    subcity: record.subcity,
    city: record.city,
    region: record.region,
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
      reducedPrice: form.reducedPrice || undefined,
      availability: form.availability,
      condition: form.condition,
      listingType: form.listingType,
      shortDescription: form.shortDescription,
      description: form.description,
      image: form.image,
      images,
      location: form.location,
      subcity: form.subcity || undefined,
      city: form.city || undefined,
      region: form.region || undefined,
      phone: form.phone,
      createdAt: form.createdAt,
      featured: form.featured,
    }

    await api.saveMerchantProduct(auth.user.id, payload, productId.value)
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
</script>

<template>
  <AppShell>
    <section class="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_360px]">
      <section class="shell-panel px-6 py-7 sm:px-8">
        <p class="section-eyebrow">Product editor</p>
        <h1 class="section-title">
          {{
            isEditMode ? 'Update your product listing' : 'Create a product shoppers want to open'
          }}
        </h1>
        <p class="section-copy max-w-3xl">
          Strong listings usually win on clear names, helpful photos, believable prices, and a short
          description that sounds like a real product page.
        </p>

        <div class="mt-6 rounded-[24px] bg-[var(--surface-alt)] px-5 py-4">
          <div class="flex flex-wrap items-center gap-3">
            <span
              class="chip !px-4 !py-2"
              :class="submissionStatus === 'approved' ? 'chip-good' : 'chip-warn'"
            >
              {{ submissionStatusLabel }}
            </span>
            <p class="text-sm leading-6 text-[var(--muted)]">
              {{ submissionStatusCopy }}
            </p>
          </div>
        </div>

        <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
          <div class="grid gap-5 md:grid-cols-2">
            <label class="field-label">
              Product name
              <input
                v-model="form.name"
                class="input-field"
                type="text"
                placeholder="Portable Bluetooth Speaker"
                required
              />
            </label>

            <label class="field-label">
              Category
              <select v-model="form.category" class="select-field">
                <option v-for="category in catalogCategories" :key="category">
                  {{ category }}
                </option>
              </select>
            </label>

            <label class="field-label">
              Price (ETB)
              <input
                v-model.number="form.price"
                class="input-field"
                type="number"
                min="0"
                required
              />
            </label>

            <label class="field-label">
              Reduced price (optional)
              <input
                v-model.number="form.reducedPrice"
                class="input-field"
                type="number"
                min="0"
                placeholder="Leave empty if not reduced"
              />
            </label>

            <label class="field-label">
              Availability
              <select v-model="form.availability" class="select-field">
                <option v-for="option in availabilityOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </label>

            <label class="field-label">
              Condition
              <select v-model="form.condition" class="select-field">
                <option v-for="option in conditionOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </label>

            <label class="field-label">
              Listing type
              <select v-model="form.listingType" class="select-field">
                <option v-for="option in listingTypeOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </label>

            <label class="field-label">
              Listing phone
              <input
                v-model="form.phone"
                class="input-field"
                type="tel"
                placeholder="+251 91 000 0000"
                required
              />
            </label>

            <label class="field-label md:col-span-2">
              Listing location (informal)
              <input
                v-model="form.location"
                class="input-field"
                type="text"
                placeholder="Near Bole Atlas, Addis Ababa"
                required
              />
            </label>

            <label class="field-label">
              Subcity
              <input v-model="form.subcity" class="input-field" type="text" placeholder="Bole" />
            </label>

            <label class="field-label">
              City
              <input
                v-model="form.city"
                class="input-field"
                type="text"
                placeholder="Addis Ababa"
              />
            </label>

            <label class="field-label">
              Region
              <select v-model="form.region" class="select-field">
                <option value="">Select region</option>
                <option value="Addis Ababa">Addis Ababa</option>
                <option value="Afar">Afar</option>
                <option value="Amhara">Amhara</option>
                <option value="Benishangul-Gumuz">Benishangul-Gumuz</option>
                <option value="Gambela">Gambela</option>
                <option value="Harari">Harari</option>
                <option value="Oromia">Oromia</option>
                <option value="Somali">Somali</option>
                <option value="SNNPR">SNNPR</option>
                <option value="Tigray">Tigray</option>
              </select>
            </label>

            <label class="field-label md:col-span-2">
              Product image
              <ImageUpload
                v-model="form.image"
                placeholder="Upload main product image"
                alt="Main product image"
              />
            </label>

            <label class="field-label md:col-span-2">
              Additional images
              <div class="additional-images">
                <div v-for="(img, index) in form.images" :key="index" class="additional-image-slot">
                  <ImageUpload
                    v-model="form.images[index]"
                    :placeholder="`Gallery image ${index + 1}`"
                    :alt="`Gallery image ${index + 1}`"
                  />
                  <button type="button" class="remove-image-btn" @click="removeImageSlot(index)">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <button
                  v-if="form.images.length < 5"
                  type="button"
                  class="add-image-btn"
                  @click="addImageSlot"
                >
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
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add image ({{ form.images.length }}/5)
                </button>
              </div>
            </label>

            <label class="field-label md:col-span-2">
              Short description
              <input
                v-model="form.shortDescription"
                class="input-field"
                type="text"
                maxlength="120"
                placeholder="A quick, customer-facing summary"
                required
              />
            </label>

            <label class="field-label md:col-span-2">
              Full description
              <textarea
                v-model="form.description"
                class="textarea-field"
                placeholder="Explain who this is for, why people buy it, and what makes it useful."
                required
              />
            </label>

            <label class="field-label">
              Featured on marketplace
              <select v-model="form.featured" class="select-field">
                <option :value="true">Yes</option>
                <option :value="false">No</option>
              </select>
            </label>
          </div>

          <p v-if="error" class="error-text">{{ error }}</p>

          <div class="flex flex-wrap gap-3">
            <button class="btn-primary" type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : isEditMode ? 'Update product' : 'Create product' }}
            </button>
            <button
              class="btn-ghost"
              type="button"
              @click="router.push(routePaths.merchantDashboard)"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>

      <aside class="space-y-6">
        <section class="shell-panel overflow-hidden">
          <img
            :src="previewImage"
            :alt="form.name || 'Product preview'"
            class="h-56 w-full object-cover"
          />
          <div class="px-6 py-6">
            <div class="flex flex-wrap gap-3">
              <span class="chip !px-4 !py-2">{{ form.category || 'Category' }}</span>
              <span class="chip chip-muted !px-4 !py-2">{{ form.condition }}</span>
              <span class="chip !px-4 !py-2">{{ form.listingType }}</span>
              <span
                class="chip !px-4 !py-2"
                :class="submissionStatus === 'approved' ? 'chip-good' : 'chip-warn'"
              >
                {{ submissionStatusLabel }}
              </span>
            </div>
            <h2 class="mt-5 font-heading text-2xl font-semibold tracking-tight text-[var(--text)]">
              {{ form.name || 'Your product name will appear here' }}
            </h2>
            <p class="mt-3 text-lg font-semibold text-[var(--text)]">{{ previewPrice }}</p>
            <p class="mt-3 text-sm leading-6 text-[var(--muted)]">
              {{ form.shortDescription || 'Short description preview for marketplace cards.' }}
            </p>
            <p class="mt-4 text-sm leading-6 text-[var(--muted)]">
              {{ form.description || 'Longer product detail preview for the full item page.' }}
            </p>
            <div class="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <p>Location: {{ form.location || 'Add listing location' }}</p>
              <p>Phone: {{ form.phone || 'Add listing phone' }}</p>
            </div>
          </div>
        </section>

        <section class="shell-panel px-6 py-7">
          <p class="section-eyebrow">Quick tips</p>
          <div class="space-y-4">
            <div class="rounded-[24px] bg-[var(--surface-alt)] p-4">
              <p class="text-sm font-semibold text-[var(--text)]">Use natural product names</p>
              <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
                Shoppers search for everyday phrases, not internal SKU language.
              </p>
            </div>
            <div class="rounded-[24px] bg-[var(--surface-alt)] p-4">
              <p class="text-sm font-semibold text-[var(--text)]">Price honestly</p>
              <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
                Real-looking price points make the whole storefront feel more trustworthy.
              </p>
            </div>
          </div>
        </section>
      </aside>
    </section>
  </AppShell>
</template>

<style scoped>
.additional-images {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.additional-image-slot {
  position: relative;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;
  z-index: 10;
}

.remove-image-btn:hover {
  background: rgba(220, 38, 38, 0.8);
}

.add-image-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 2px dashed var(--line);
  border-radius: 12px;
  background: transparent;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-image-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}
</style>
