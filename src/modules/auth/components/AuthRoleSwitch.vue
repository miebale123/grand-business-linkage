<script setup lang="ts">
import type { AuthRoleOption } from '@/modules/auth/auth-page.types'

const props = defineProps<{
  options: AuthRoleOption[]
  activeValue: string
  label: string
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

function handleSelect(value: string) {
  emit('select', value)
}
</script>

<template>
  <div
    class="bl-auth-role-switch"
    :class="{ 'bl-auth-role-switch--two': props.options.length === 2 }"
    role="tablist"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="bl-auth-role-button"
      :class="{ 'is-active': activeValue === option.value }"
      @click="handleSelect(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
