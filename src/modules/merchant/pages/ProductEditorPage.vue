<script setup lang="ts">
import { routePaths } from '@/app/router/paths'
import ImageUpload from '@/shared/ui/ImageUpload.vue'
import { useProductEditorPage } from './ProductEditorPage'
import './ProductEditorPage.css'

const {
  isEditMode,
  saving,
  error,
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
} = useProductEditorPage()
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
        <div class="user-avatar">U</div>
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
                @click="$router.push('/merchant')"
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