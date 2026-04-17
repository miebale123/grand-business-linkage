<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { routePaths } from '@/app/router/paths'
import * as api from '@/shared/api/api'
import { useAuthStore } from '@/modules/auth'
import ImageUpload from '@/shared/ui/ImageUpload.vue'
import type {
  CatalogMetadata,
  ListingType,
  MarketplaceConfig,
  MerchantRecord,
  ProductAvailability,
  ProductCondition,
  ProductPayload,
} from '@/shared/types'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

async function logout() {
  await auth.logout()
  await router.push(routePaths.home)
}

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

const previewImage = computed(
  () =>
    form.image ||
    'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=800&q=80',
)

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

const isVerified = computed(() => merchant.value?.verified ?? false)
</script>

<template>
  <div class="product-editor">
    <header class="editor-header">
      <RouterLink :to="routePaths.merchantDashboard" class="brand-link">
        <span class="brand-mark">BH</span>
        <span class="brand-name">Business Hub</span>
      </RouterLink>
      <nav class="editor-nav">
        <RouterLink :to="routePaths.merchantDashboard" class="nav-item">Dashboard</RouterLink>
        <RouterLink :to="routePaths.home" class="nav-item">Back to marketplace</RouterLink>
      </nav>
      <div class="editor-actions">
        <button class="logout-btn" type="button" @click="logout">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
        <div class="user-avatar">{{ auth.user?.name?.[0] || 'U' }}</div>
      </div>
    </header>

    <main class="editor-main">
      <section class="editor-hero">
        <h1 class="hero-title">
          {{ isEditMode ? 'Update your listing' : 'Create a new listing' }}
        </h1>
        <p class="hero-description">
          Add details that help shoppers discover and trust your product. Clear photos and
          descriptions win.
        </p>

        <div v-if="!isVerified" class="upgrade-banner">
          <div class="upgrade-content">
            <div class="upgrade-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div class="upgrade-text">
              <span class="upgrade-title">Want to auto-publish your products?</span>
              <span class="upgrade-subtitle"
                >Click here to become a verified merchant and enable instant publishing.</span
              >
            </div>
          </div>
          <RouterLink :to="routePaths.merchantVerificationUpgrade" class="upgrade-btn">
            Click here
          </RouterLink>
        </div>
      </section>

      <div class="editor-layout">
        <div class="editor-content">
          <div class="status-banner" :class="{ verified: isVerified }">
            <div class="status-indicator"></div>
            <span class="status-text">{{
              isVerified ? 'Your shop is verified' : 'Pending verification'
            }}</span>
          </div>

          <form class="product-form" @submit.prevent="handleSubmit">
            <section class="form-section">
              <h2 class="section-title">Basic Details</h2>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Product name</label>
                  <input
                    v-model="form.name"
                    class="form-input"
                    type="text"
                    placeholder="e.g. Portable Bluetooth Speaker"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select v-model="form.category" class="form-select">
                    <option v-for="cat in catalogCategories" :key="cat" :value="cat">
                      {{ cat }}
                    </option>
                  </select>
                </div>
              </div>
            </section>

            <section class="form-section">
              <h2 class="section-title">Pricing</h2>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Regular price (ETB)</label>
                  <input
                    v-model.number="form.price"
                    class="form-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Sale price (optional)</label>
                  <input
                    v-model.number="form.salePrice"
                    class="form-input"
                    type="number"
                    min="0"
                    placeholder="Leave empty if not on sale"
                  />
                </div>
              </div>
            </section>

            <section class="form-section">
              <h2 class="section-title">Product Information</h2>
              <div class="form-grid triple">
                <div class="form-group">
                  <label class="form-label">Condition</label>
                  <select v-model="form.condition" class="form-select">
                    <option v-for="opt in conditionOptions" :key="opt" :value="opt">
                      {{ opt }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Listing type</label>
                  <select v-model="form.listingType" class="form-select">
                    <option v-for="opt in listingTypeOptions" :key="opt" :value="opt">
                      {{ opt }}
                    </option>
                  </select>
                </div>
              </div>
            </section>

            <section class="form-section">
              <h2 class="section-title">Location & Contact</h2>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Phone number</label>
                  <input
                    v-model="form.phone"
                    class="form-input"
                    type="tel"
                    placeholder="+251 91 000 0000"
                    required
                  />
                </div>

                <div class="form-group full">
                  <label class="form-label">Location (display address)</label>
                  <input
                    v-model="form.location"
                    class="form-input"
                    type="text"
                    placeholder="e.g. Near Bole Atlas, Addis Ababa"
                    required
                  />
                </div>
              </div>
            </section>

            <section class="form-section">
              <h2 class="section-title">Product Images</h2>
              <div class="form-group full">
                <label class="form-label">Main product image</label>
                <ImageUpload
                  v-model="form.image"
                  placeholder="Upload main product image"
                  alt="Main product image"
                />
              </div>
            </section>

            <section class="form-section">
              <h2 class="section-title">Descriptions</h2>
              <div class="form-group full">
                <label class="form-label">Short description</label>
                <input
                  v-model="form.shortDescription"
                  class="form-input"
                  type="text"
                  maxlength="120"
                  placeholder="A quick summary for cards and search results"
                  required
                />
                <span class="char-count">{{ form.shortDescription.length }}/120</span>
              </div>

              <div class="form-group full">
                <label class="form-label">Full description</label>
                <textarea
                  v-model="form.description"
                  class="form-textarea"
                  placeholder="Describe features, benefits, and who this product is for..."
                  rows="5"
                  required
                />
              </div>
            </section>

            <section class="form-section">
              <h2 class="section-title">Featured</h2>
              <div class="form-group">
                <label class="toggle-label">
                  <span class="toggle-text">Show on marketplace homepage</span>
                  <select v-model="form.featured" class="form-select small">
                    <option :value="false">No</option>
                    <option :value="true">Yes</option>
                  </select>
                </label>
              </div>
            </section>

            <p v-if="error" class="form-error">{{ error }}</p>

            <div class="form-actions">
              <button
                class="btn-cancel"
                type="button"
                @click="router.push(routePaths.merchantDashboard)"
              >
                Cancel
              </button>
              <button class="btn-submit" type="submit" :disabled="saving">
                {{ saving ? 'Saving...' : isEditMode ? 'Update listing' : 'Create listing' }}
              </button>
            </div>
          </form>
        </div>

        <aside class="editor-sidebar">
          <div class="preview-card">
            <div class="preview-image-wrap">
              <img
                :src="previewImage"
                :alt="form.name || 'Product preview'"
                class="preview-image"
              />
              <div class="preview-badges">
                <span class="preview-badge">{{ form.category || 'Category' }}</span>
                <span class="preview-badge secondary">{{ form.condition }}</span>
                <span class="preview-badge">{{ form.listingType }}</span>
              </div>
            </div>
            <div class="preview-body">
              <h3 class="preview-title">{{ form.name || 'Your product name here' }}</h3>
              <p class="preview-price">
                <template v-if="form.salePrice && form.salePrice > 0 && form.price > 0">
                  <span class="line-through">ETB {{ form.price.toLocaleString() }}</span>
                  <span class="preview-sale">ETB {{ form.salePrice.toLocaleString() }}</span>
                </template>
                <template v-else-if="form.price > 0">
                  ETB {{ form.price.toLocaleString() }}
                </template>
                <template v-else>Set a price</template>
              </p>
              <p class="preview-desc">{{ form.shortDescription || 'Short description preview' }}</p>
              <div class="preview-meta">
                <span v-if="form.location">{{ form.location }}</span>
                <span v-if="form.phone">{{ form.phone }}</span>
              </div>
            </div>
          </div>

          <div class="tips-card">
            <h3 class="tips-title">Listing tips</h3>
            <ul class="tips-list">
              <li>
                <strong>Use real names</strong>
                <span>Shoppers search everyday words, not SKU codes</span>
              </li>
              <li>
                <strong>Add multiple photos</strong>
                <span>Show different angles and details</span>
              </li>
              <li>
                <strong>Price competitively</strong>
                <span>Research similar items in your area</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<style>
:root {
  --pe-bg: #fcfbf9;
  --pe-surface: #ffffff;
  --pe-text: #1c1917;
  --pe-text-muted: #78716c;
  --pe-accent: #b91c1c;
  --pe-accent-soft: #fef2f2;
  --pe-border: #e7e5e4;
  --pe-border-light: #f5f5f4;
  --pe-success: #16a34a;
  --pe-warning: #d97706;
}
</style>

<style scoped>
.product-editor {
  min-height: 100vh;
  background: var(--pe-bg);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  background: var(--pe-surface);
  border-bottom: 1px solid var(--pe-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--pe-text);
}

.brand-mark {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--pe-accent);
  color: white;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 700;
  font-size: 14px;
  border-radius: 4px;
}

.brand-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.02em;
}

.editor-nav {
  display: flex;
  gap: 8px;
}

.nav-item {
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--pe-text-muted);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: var(--pe-border-light);
  color: var(--pe-text);
}

.nav-item.active {
  background: var(--pe-accent-soft);
  color: var(--pe-accent);
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logout-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--pe-border);
  border-radius: 50%;
  color: var(--pe-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  border-color: var(--pe-accent);
  color: var(--pe-accent);
}

.user-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--pe-border-light);
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
  color: var(--pe-text-muted);
}

.editor-main {
  padding: 48px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.editor-hero {
  margin-bottom: 48px;
}

.hero-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 36px;
  font-weight: 600;
  color: var(--pe-text);
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.hero-description {
  font-size: 16px;
  color: var(--pe-text-muted);
  margin: 0;
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 40px;
  align-items: start;
}

.editor-content {
  background: var(--pe-surface);
  border-radius: 16px;
  padding: 40px;
  border: 1px solid var(--pe-border);
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fef3c7;
  border-radius: 12px;
  margin-bottom: 32px;
}

.status-banner.verified {
  background: #dcfce7;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--pe-warning);
}

.status-banner.verified .status-indicator {
  background: var(--pe-success);
}

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--pe-text);
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--pe-text);
  margin: 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--pe-accent);
  display: inline-block;
  width: fit-content;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-grid.triple {
  grid-template-columns: repeat(3, 1fr);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--pe-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input,
.form-select,
.form-textarea {
  padding: 14px 16px;
  border: 1px solid var(--pe-border);
  border-radius: 10px;
  font-size: 15px;
  color: var(--pe-text);
  background: var(--pe-surface);
  transition: all 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--pe-accent);
  box-shadow: 0 0 0 3px var(--pe-accent-soft);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--pe-text-muted);
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 44px;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.char-count {
  font-size: 12px;
  color: var(--pe-text-muted);
  text-align: right;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
}

.gallery-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;
}

.gallery-remove:hover {
  background: var(--pe-accent);
}

.gallery-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border: 2px dashed var(--pe-border);
  border-radius: 12px;
  background: none;
  color: var(--pe-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gallery-add:hover {
  border-color: var(--pe-accent);
  color: var(--pe-accent);
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-text {
  font-size: 14px;
  color: var(--pe-text);
}

.form-select.small {
  width: 120px;
}

.form-error {
  padding: 14px 18px;
  background: var(--pe-accent-soft);
  border: 1px solid var(--pe-accent);
  border-radius: 10px;
  color: var(--pe-accent);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--pe-border);
}

.btn-cancel {
  padding: 14px 28px;
  border: 1px solid var(--pe-border);
  border-radius: 10px;
  background: var(--pe-surface);
  color: var(--pe-text-muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  border-color: var(--pe-text-muted);
  color: var(--pe-text);
}

.btn-submit {
  flex: 1;
  padding: 14px 28px;
  border: none;
  border-radius: 10px;
  background: var(--pe-accent);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit:hover {
  background: #991b1b;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 100px;
}

.preview-card {
  background: var(--pe-surface);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--pe-border);
}

.preview-image-wrap {
  position: relative;
  aspect-ratio: 4/3;
  background: var(--pe-border-light);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-badges {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
}

.preview-badge {
  padding: 6px 12px;
  background: var(--pe-surface);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--pe-text);
}

.preview-badge.secondary {
  background: var(--pe-border-light);
}

.preview-body {
  padding: 20px;
}

.preview-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--pe-text);
  margin: 0 0 8px;
}

.preview-price {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px;
}

.preview-price .line-through {
  font-size: 14px;
  font-weight: 600;
  text-decoration: line-through;
  color: var(--pe-text-muted);
  margin-right: 8px;
}

.preview-sale {
  font-size: 20px;
  font-weight: 700;
  color: var(--pe-accent);
}

.preview-desc {
  font-size: 14px;
  color: var(--pe-text-muted);
  margin: 0 0 12px;
  line-height: 1.5;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--pe-text-muted);
  padding-top: 12px;
  border-top: 1px solid var(--pe-border-light);
}

.tips-card {
  background: var(--pe-surface);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--pe-border);
}

.tips-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--pe-text);
  margin: 0 0 20px;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tips-list li {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tips-list strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--pe-text);
}

.tips-list span {
  font-size: 13px;
  color: var(--pe-text-muted);
}

.upgrade-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
  border: 1px solid #f59e0b;
  border-radius: 12px;
}

.upgrade-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.upgrade-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 50%;
  color: #d97706;
}

.upgrade-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.upgrade-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--pe-text);
}

.upgrade-subtitle {
  font-size: 12px;
  color: var(--pe-text-muted);
}

.upgrade-btn {
  padding: 10px 20px;
  background: #d97706;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.upgrade-btn:hover {
  background: #b45309;
}

@media (max-width: 1200px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .editor-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .editor-header {
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px 20px;
  }

  .editor-nav {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .editor-main {
    padding: 24px 20px;
  }

  .editor-content {
    padding: 24px;
  }

  .form-grid,
  .form-grid.triple {
    grid-template-columns: 1fr;
  }

  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
