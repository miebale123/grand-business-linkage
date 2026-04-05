<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/layouts/AppShell.vue'
import * as mockApi from '@/services/mockApi'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const productId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => Boolean(productId.value))
const saving = ref(false)
const error = ref('')

const catalogCategories = [
  'Pharmacy',
  'Medical Devices',
  'Medical Supplies',
  'Supplements',
  'Beauty & Personal Care',
  'Home Essentials',
  'Baby Care',
  'Electronics',
]

const form = reactive({
  name: '',
  category: 'Pharmacy',
  price: 0,
  availability: 'In Stock' as 'In Stock' | 'Low Stock' | 'Out of Stock',
  shortDescription: '',
  description: '',
  image: '',
  featured: false,
})

onMounted(async () => {
  if (!productId.value) {
    return
  }

  const record = await mockApi.fetchProductById(productId.value)
  Object.assign(form, record)
})

async function handleSubmit() {
  if (!auth.user) {
    return
  }

  error.value = ''
  saving.value = true

  try {
    await mockApi.saveMerchantProduct(auth.user.id, form, productId.value)
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
    <section class="panel" style="padding: 28px; max-width: 920px; margin: 0 auto">
      <p class="eyebrow">Merchant editor</p>
      <h1 class="page-title" style="font-size: 2.2rem">
        {{ isEditMode ? 'Update product listing' : 'Create a product listing' }}
      </h1>
      <p class="page-copy">
        The form is intentionally business-focused: clear naming, searchable categories,
        availability status, and enough description for discovery.
      </p>

      <div class="panel" style="padding: 18px; margin-top: 20px; background: rgba(255, 255, 255, 0.72)">
        <div class="market-toolbar">
          <div class="stack" style="gap: 6px">
            <strong>Listing guidance</strong>
            <span class="muted">
              Think like a merchant catalog. Strong titles, clear categories, and stock confidence improve discovery.
            </span>
          </div>
          <div class="inline">
            <span class="tag">Search-ready title</span>
            <span class="tag">Accurate category</span>
            <span class="tag">Current availability</span>
          </div>
        </div>
      </div>

      <form class="stack" style="margin-top: 24px" @submit.prevent="handleSubmit">
        <div class="form-grid">
          <label class="label">
            Product name
            <input v-model="form.name" class="input" type="text" required />
          </label>

          <label class="label">
            Category
            <select v-model="form.category" class="select">
              <option v-for="category in catalogCategories" :key="category">
                {{ category }}
              </option>
            </select>
          </label>

          <label class="label">
            Price (ETB)
            <input v-model.number="form.price" class="input" type="number" min="0" required />
          </label>

          <label class="label">
            Availability
            <select v-model="form.availability" class="select">
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </label>

          <label class="label">
            Product image URL
            <input
              v-model="form.image"
              class="input"
              type="url"
              placeholder="https://images.unsplash.com/..."
              required
            />
          </label>

          <label class="label">
            Featured in marketplace
            <select v-model="form.featured" class="select">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </label>
        </div>

        <label class="label">
          Short description
          <input
            v-model="form.shortDescription"
            class="input"
            type="text"
            maxlength="120"
            placeholder="One-line marketplace summary"
            required
          />
        </label>

        <label class="label">
          Full description
          <textarea
            v-model="form.description"
            class="textarea"
            placeholder="Explain how this product helps, who it is for, or why it is worth discovering."
            required
          />
        </label>

        <p v-if="error" class="error-text">{{ error }}</p>

        <div class="inline">
          <button class="button" type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : isEditMode ? 'Update product' : 'Create product' }}
          </button>
          <button class="button-ghost" type="button" @click="router.push('/merchant')">Cancel</button>
        </div>
      </form>
    </section>
  </AppShell>
</template>
