<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  categoryOptions: string[]
  selectedCategory: string
  minPrice: number | null
  maxPrice: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:selectedCategory': [value: string]
  'update:minPrice': [value: number | null]
  'update:maxPrice': [value: number | null]
  apply: []
  reset: []
}>()

const localCategory = ref(props.selectedCategory)
const localMinPrice = ref(props.minPrice ?? '')
const localMaxPrice = ref(props.maxPrice ?? '')

watch(
  () => props.selectedCategory,
  (val) => {
    localCategory.value = val
  },
)

watch(
  () => props.minPrice,
  (val) => {
    localMinPrice.value = val ?? ''
  },
)

watch(
  () => props.maxPrice,
  (val) => {
    localMaxPrice.value = val ?? ''
  },
)

function selectCategory(cat: string) {
  localCategory.value = localCategory.value === cat ? '' : cat
}

function close() {
  emit('update:modelValue', false)
}

function onApply() {
  emit('update:selectedCategory', localCategory.value)
  emit('update:minPrice', localMinPrice.value ? Number(localMinPrice.value) : null)
  emit('update:maxPrice', localMaxPrice.value ? Number(localMaxPrice.value) : null)
  emit('apply')
  close()
}

function onReset() {
  localCategory.value = ''
  localMinPrice.value = ''
  localMaxPrice.value = ''
  emit('reset')
  close()
}

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sidebar">
      <div v-if="modelValue" class="filters-overlay" @click="onOverlayClick" @keydown="onKeydown">
        <div class="filters-sidebar" role="dialog" aria-modal="true">
          <div class="filters-header">
            <h2>Filters</h2>
            <button class="filters-close" type="button" @click="close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="filters-content">
            <div class="filter-section">
              <h3>Price Range</h3>
              <div class="price-inputs">
                <input
                  v-model="localMinPrice"
                  type="number"
                  placeholder="Min price"
                  inputmode="numeric"
                />
                <span>—</span>
                <input
                  v-model="localMaxPrice"
                  type="number"
                  placeholder="Max price"
                  inputmode="numeric"
                />
              </div>
            </div>

            <div class="filter-section">
              <h3>Category</h3>
              <div class="category-list">
                <button
                  type="button"
                  class="category-option"
                  :class="{ 'is-selected': localCategory === '' }"
                  @click="localCategory = ''"
                >
                  <span class="radio-dot"></span>
                  <span>All Categories</span>
                </button>
                <button
                  v-for="cat in categoryOptions"
                  :key="cat"
                  type="button"
                  class="category-option"
                  :class="{ 'is-selected': localCategory === cat }"
                  @click="selectCategory(cat)"
                >
                  <span class="radio-dot"></span>
                  <span>{{ cat }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="filters-footer">
            <button class="btn-ghost" type="button" @click="onReset">Reset</button>
            <button class="btn-primary" type="button" @click="onApply">Apply Filters</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.filters-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
}

.filters-sidebar {
  width: 640px;
  max-width: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
}

.filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line, #e5e7eb);
}

.filters-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.filters-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--muted, #6b7280);
}

.filters-close:hover {
  color: var(--text, #111827);
}

.filters-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-section h3 {
  margin: 0 0 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text, #111827);
}

.price-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-inputs input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--line, #e5e7eb);
  border-radius: 8px;
  font-size: 0.875rem;
}

.price-inputs input:focus {
  outline: none;
  border-color: var(--primary, #3b82f6);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  text-align: left;
  font-size: 0.875rem;
  color: var(--text, #111827);
  cursor: pointer;
  transition: background 0.15s ease;
}

.category-option:hover {
  background: var(--bg-muted, #f3f4f6);
}

.category-option.is-selected {
  background: var(--primary-light, #eff6ff);
  color: var(--primary, #3b82f6);
}

.radio-dot {
  width: 18px;
  height: 18px;
  border: 2px solid var(--line, #d1d5db);
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  transition: all 0.15s ease;
}

.category-option.is-selected .radio-dot {
  border-color: var(--primary, #3b82f6);
}

.category-option.is-selected .radio-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: var(--primary, #3b82f6);
  border-radius: 50%;
}

.filters-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--line, #e5e7eb);
}

.filters-footer .btn-ghost {
  flex: 1;
  padding: 10px 16px;
  font-size: 0.875rem;
}

.filters-footer .btn-primary {
  flex: 1;
  padding: 10px 16px;
  font-size: 0.875rem;
}

.sidebar-enter-active,
.sidebar-leave-active {
  transition: opacity 0.25s ease;
}

.sidebar-enter-active .filters-sidebar,
.sidebar-leave-active .filters-sidebar {
  transition: transform 0.25s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
}

.sidebar-enter-from .filters-sidebar,
.sidebar-leave-to .filters-sidebar {
  transform: translateX(100%);
}

@media (max-width: 480px) {
  .filters-sidebar {
    width: 100%;
  }
}
</style>
