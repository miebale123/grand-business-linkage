<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'

import AuthIcon from '@/modules/auth/components/AuthIcon.vue'
import type { AuthIconName } from '@/modules/auth/auth-page.types'

defineOptions({
  inheritAttrs: false,
})

type AuthInputMode =
  | ''
  | 'decimal'
  | 'email'
  | 'none'
  | 'numeric'
  | 'search'
  | 'tel'
  | 'text'
  | 'url'

const model = defineModel<string>({
  default: '',
})

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    placeholder?: string
    type?: string
    autocomplete?: string
    inputmode?: AuthInputMode
    icon?: AuthIconName
    hint?: string
    required?: boolean
    fullWidth?: boolean
  }>(),
  {
    placeholder: '',
    type: 'text',
    autocomplete: '',
    inputmode: '',
    icon: undefined,
    hint: '',
    required: false,
    fullWidth: false,
  },
)

const attrs = useAttrs()
const slots = useSlots()

const hasTrailing = computed(() => Boolean(slots.trailing))
const inputClasses = computed(() => [
  'bl-auth-field__input',
  {
    'bl-auth-field__input--with-leading': Boolean(props.icon),
    'bl-auth-field__input--with-trailing': hasTrailing.value,
  },
])

function handleInput(event: Event) {
  model.value = (event.target as HTMLInputElement).value
}
</script>

<template>
  <label class="bl-auth-field" :class="{ 'bl-auth-field--full': fullWidth }" :for="id">
    <span class="bl-auth-field__label">{{ label }}</span>
    <span class="bl-auth-field__control">
      <span v-if="icon" class="bl-auth-field__leading" aria-hidden="true">
        <AuthIcon :name="icon" />
      </span>

      <input
        :id="id"
        :value="model"
        :type="type"
        :autocomplete="autocomplete || undefined"
        :inputmode="inputmode || undefined"
        :placeholder="placeholder"
        :required="required"
        :class="inputClasses"
        v-bind="attrs"
        @input="handleInput"
      />

      <span v-if="hasTrailing" class="bl-auth-field__trailing">
        <slot name="trailing" />
      </span>
    </span>

    <p v-if="hint" class="bl-auth-field__hint">{{ hint }}</p>
  </label>
</template>
