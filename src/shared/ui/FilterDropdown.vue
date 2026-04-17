<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  options: string[]
  selected: string
  label: string
  placeholder?: string
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}

function select(value: string) {
  emit('select', value)
  isOpen.value = false
}
</script>

<template>
  <div class="filter-dropdown">
    <button class="filter-dropdown__trigger" type="button" @click="toggle">
      <span class="filter-dropdown__label">{{ label }}:</span>
      <span class="filter-dropdown__value">{{ selected === placeholder ? 'Any' : selected }}</span>
      <svg
        class="filter-dropdown__chevron"
        :class="{ 'is-open': isOpen }"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    <Transition name="dropdown">
      <div v-if="isOpen" class="filter-dropdown__menu">
        <button
          v-for="opt in options"
          :key="opt"
          class="filter-dropdown__option"
          :class="{ 'is-selected': opt === selected }"
          type="button"
          @click="select(opt)"
        >
          {{ opt === placeholder ? 'Any' : opt }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.filter-dropdown {
  position: relative;
  display: inline-block;
}

.filter-dropdown__trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--line, #e5e7eb);
  border-radius: 8px;
  background: white;
  color: var(--text, #111827);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-dropdown__trigger:hover {
  border-color: var(--primary, #3b82f6);
}

.filter-dropdown__label {
  color: var(--muted, #6b7280);
  font-weight: 500;
}

.filter-dropdown__value {
  font-weight: 600;
}

.filter-dropdown__chevron {
  transition: transform 0.2s ease;
}

.filter-dropdown__chevron.is-open {
  transform: rotate(180deg);
}

.filter-dropdown__menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 160px;
  background: white;
  border: 1px solid var(--line, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
  overflow: hidden;
}

.filter-dropdown__option {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  text-align: left;
  font-size: 0.875rem;
  color: var(--text, #111827);
  cursor: pointer;
  transition: background 0.15s ease;
}

.filter-dropdown__option:hover {
  background: var(--bg-muted, #f3f4f6);
}

.filter-dropdown__option.is-selected {
  background: var(--primary-light, #eff6ff);
  color: var(--primary, #3b82f6);
  font-weight: 600;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
