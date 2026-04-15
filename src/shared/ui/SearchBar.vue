<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <button
        class="search-icon search-icon-button"
        type="button"
        aria-label="Search"
        @click="emit('search', modelValue ?? '')"
      >
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
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
      <input
        :value="modelValue"
        class="search-input"
        type="text"
        :placeholder="placeholder"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="emit('search', modelValue ?? '')"
      />
      <button
        v-if="modelValue"
        class="clear-icon-button"
        type="button"
        aria-label="Clear search"
        @click="emit('update:modelValue', '')"
      >
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
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="location-dropdown">
      <div class="location-icon">
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
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <select
        v-model="selectedLocation"
        class="location-select"
        @change="emit('update:location', selectedLocation)"
      >
        <option v-for="location in locationOptions" :key="location" :value="location">
          {{ location }}
        </option>
      </select>
      <div class="dropdown-arrow">▼</div>
    </div>
    <div class="sort-dropdown">
      <div class="sort-icon">
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
          <path d="m3 16 4 4 4-4" />
          <path d="M7 20V4" />
          <path d="m21 8-4-4-4 4" />
          <path d="M17 4v16" />
        </svg>
      </div>
      <select
        v-model="selectedSort"
        class="sort-select"
        @change="emit('update:sort', selectedSort)"
      >
        <option value="">Sort by</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
      <div class="dropdown-arrow">▼</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  placeholder?: string
  locations?: string[]
  modelValue?: string
}>()

const emit = defineEmits<{
  search: [value: string]
  'update:modelValue': [value: string]
  'update:location': [value: string]
  'update:sort': [value: string]
}>()

const defaultLocations = [
  'All Areas',
  'Addis Ababa',
  'Dire Dawa',
  'Hawassa',
  'Bahir Dar',
  'Gondar',
  'Mekelle',
]

const locationOptions = computed(() => props.locations ?? defaultLocations)

const selectedLocation = ref('All Areas')
const selectedSort = ref('')
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 6px 6px 16px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.search-icon {
  color: var(--muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: var(--text);
  outline: none;
}

.search-input::placeholder {
  color: var(--muted);
}

.search-icon-button {
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.clear-icon-button {
  border: none;
  background: transparent;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.15s ease;
}

.clear-icon-button:hover {
  background-color: var(--surface-soft);
  color: var(--text);
}

.location-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--surface-soft);
  border-left: 1px solid var(--line);
  border-radius: 0 999px 999px 0;
  margin: -6px -6px -6px 0;
  position: relative;
  cursor: pointer;
}

.location-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.location-select {
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  outline: none;
  appearance: none;
  padding-right: 4px;
}

.dropdown-arrow {
  font-size: 0.65rem;
  color: var(--muted);
  flex-shrink: 0;
}

.sort-dropdown {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--surface-soft);
  border-left: 1px solid var(--line);
  position: relative;
  cursor: pointer;
}

.sort-icon {
  color: var(--muted);
  flex-shrink: 0;
}

.sort-select {
  border: none;
  background: transparent;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  outline: none;
  appearance: none;
  padding-right: 4px;
}
</style>
