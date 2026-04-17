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
        @keydown.enter="emit('search', ($event.target as HTMLInputElement).value)"
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

    <div class="location-wrapper">
      <div class="location-input-container">
        <svg
          class="location-icon"
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
        <input
          ref="locationInput"
          v-model="locationQuery"
          type="text"
          class="location-input"
          placeholder="Enter location"
          @focus="showDropdown = true"
          @input="showDropdown = true"
          @keydown.down.prevent="navigateSuggestions(1)"
          @keydown.up.prevent="navigateSuggestions(-1)"
          @keydown.enter.prevent="selectHighlighted()"
          @keydown.escape="showDropdown = false"
        />
        <button
          v-if="locationQuery"
          class="location-clear"
          type="button"
          aria-label="Clear location"
          @click="clearLocation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <ul v-if="showDropdown && filteredLocations.length" class="location-dropdown">
        <li
          v-for="(loc, index) in filteredLocations"
          :key="loc"
          class="location-option"
          :class="{ highlighted: index === highlightedIndex }"
          @click="selectLocation(loc)"
          @mouseenter="highlightedIndex = index"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {{ loc }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  placeholder?: string
  locations?: string[]
  modelValue?: string
  initialLocation?: string
}>()

const emit = defineEmits<{
  search: [value: string]
  'update:modelValue': [value: string]
  'update:location': [value: string]
}>()

const locationQuery = ref(props.initialLocation ?? '')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const locationInput = ref<HTMLInputElement | null>(null)

// Keep the displayed location in sync with route/query-driven initialLocation changes.
watch(
  () => props.initialLocation,
  (next) => {
    if (typeof next === 'string') {
      locationQuery.value = next
    }
  },
)

const filteredLocations = computed(() => {
  if (!locationQuery.value) return props.locations ?? []
  const query = locationQuery.value.toLowerCase()
  return (props.locations ?? []).filter((loc) => loc.toLowerCase().includes(query))
})

function selectLocation(loc: string) {
  locationQuery.value = loc
  showDropdown.value = false
  highlightedIndex.value = -1
  emit('update:location', loc)
}

function clearLocation() {
  locationQuery.value = ''
  highlightedIndex.value = -1
  emit('update:location', '')
}

function navigateSuggestions(direction: number) {
  if (!filteredLocations.value.length) return

  highlightedIndex.value += direction

  if (highlightedIndex.value < 0) {
    highlightedIndex.value = filteredLocations.value.length - 1
  } else if (highlightedIndex.value >= filteredLocations.value.length) {
    highlightedIndex.value = 0
  }
}

function selectHighlighted() {
  const highlighted = filteredLocations.value[highlightedIndex.value]
  if (highlightedIndex.value >= 0 && highlighted) {
    selectLocation(highlighted)
  } else if (filteredLocations.value.length === 1) {
    const firstLoc = filteredLocations.value[0]
    if (firstLoc) selectLocation(firstLoc)
  } else {
    showDropdown.value = false
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.location-wrapper')) {
    showDropdown.value = false
  }
}

document.addEventListener('click', handleClickOutside)
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
  position: relative;
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

.location-wrapper {
  position: relative;
}

.location-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--surface-soft);
  border-left: 1px solid var(--line);
  border-radius: 0 999px 999px 0;
  margin: -6px -6px -6px 0;
}

.location-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.location-input {
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text);
  outline: none;
  width: 140px;
}

.location-input::placeholder {
  color: var(--muted);
}

.location-clear {
  border: none;
  background: transparent;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.15s ease;
}

.location-clear:hover {
  background-color: var(--line);
  color: var(--text);
}

.location-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  list-style: none;
  margin: 0;
  padding: 8px 0;
  z-index: 100;
}

.location-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 0.95rem;
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.location-option:hover,
.location-option.highlighted {
  background-color: var(--surface-soft);
}

.location-option svg {
  color: var(--muted);
  flex-shrink: 0;
}
</style>
