<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import * as api from '@/shared/api/api'
import { useAuthStore } from '@/modules/auth'
import AppShell from '@/shared/layouts/AppShell.vue'
import type { CatalogMetadata, ProductAvailability } from '@/shared/types'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const productId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => Boolean(productId.value))
const saving = ref(false)
const error = ref('')
const catalogMetadata = ref<CatalogMetadata | null>(null)
const catalogCategories = computed(() => catalogMetadata.value?.categories ?? [])
const availabilityOptions = computed(() => catalogMetadata.value?.availabilityOptions ?? [])

const form = reactive({
  name: '',
  category: '',
  price: 0,
  availability: 'In Stock' as ProductAvailability,
  shortDescription: '',
  description: '',
  image: '',
  featured: false,
})

const previewPrice = computed(() =>
  form.price > 0 ? `ETB ${form.price.toLocaleString()}` : 'Set a price',
)
const previewImage = computed(
  () =>
    form.image ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
)

onMounted(async () => {
  catalogMetadata.value = await api.fetchCatalogMetadata()
  form.category = catalogCategories.value[0] ?? form.category
  form.availability = availabilityOptions.value[0] ?? form.availability

  if (!productId.value) {
    return
  }

  const record = await api.fetchProductById(productId.value)
  Object.assign(form, record)
})

async function handleSubmit() {
  if (!auth.user) {
    return
  }

  error.value = ''
  saving.value = true

  try {
    await api.saveMerchantProduct(auth.user.id, form, productId.value)
    await router.push('/merchant')
  } catch (issue) {
    error.value = issue instanceof Error ? issue.message : 'Could not save product.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppShell>
    <section class="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_360px]">
      <section class="shell-panel px-6 py-7 sm:px-8">
        <p class="section-eyebrow">Product editor</p>
        <h1 class="section-title">
          {{ isEditMode ? 'Update your product listing' : 'Create a product shoppers want to open' }}
        </h1>
        <p class="section-copy max-w-3xl">
          Strong listings usually win on clear names, helpful photos, believable prices, and a short description that sounds like a real product page.
        </p>

        <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
          <div class="grid gap-5 md:grid-cols-2">
            <label class="field-label">
              Product name
              <input v-model="form.name" class="input-field" type="text" placeholder="Portable Bluetooth Speaker" required />
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
              <input v-model.number="form.price" class="input-field" type="number" min="0" required />
            </label>

            <label class="field-label">
              Availability
              <select v-model="form.availability" class="select-field">
                <option v-for="option in availabilityOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </label>

            <label class="field-label md:col-span-2">
              Product image URL
              <input
                v-model="form.image"
                class="input-field"
                type="url"
                placeholder="https://images.unsplash.com/..."
                required
              />
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
            <button class="btn-ghost" type="button" @click="router.push('/merchant')">Cancel</button>
          </div>
        </form>
      </section>

      <aside class="space-y-6">
        <section class="shell-panel overflow-hidden">
          <img :src="previewImage" :alt="form.name || 'Product preview'" class="h-56 w-full object-cover" />
          <div class="px-6 py-6">
            <div class="flex flex-wrap gap-3">
              <span class="chip !px-4 !py-2">{{ form.category || 'Category' }}</span>
              <span class="chip !px-4 !py-2">
                {{ form.availability }}
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
