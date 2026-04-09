<script setup lang="ts">
import { ref } from 'vue'

import AuthIcon from '@/modules/auth/components/AuthIcon.vue'
import AuthTextField from '@/modules/auth/components/AuthTextField.vue'

const model = defineModel<string>({
  default: '',
})

withDefaults(
  defineProps<{
    id: string
    label: string
    placeholder?: string
    autocomplete?: string
    hint?: string
    required?: boolean
    fullWidth?: boolean
  }>(),
  {
    placeholder: '',
    autocomplete: 'current-password',
    hint: '',
    required: false,
    fullWidth: false,
  },
)

const showPassword = ref(false)

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <AuthTextField
    :id="id"
    v-model="model"
    :label="label"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    :hint="hint"
    :required="required"
    :full-width="fullWidth"
    :type="showPassword ? 'text' : 'password'"
    icon="password"
  >
    <template #trailing>
      <button
        type="button"
        class="bl-auth-field__toggle"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        @click="togglePasswordVisibility"
      >
        <AuthIcon :name="showPassword ? 'eye-off' : 'eye'" />
        <span class="bl-auth-sr-only">
          {{ showPassword ? 'Hide password' : 'Show password' }}
        </span>
      </button>
    </template>
  </AuthTextField>
</template>
