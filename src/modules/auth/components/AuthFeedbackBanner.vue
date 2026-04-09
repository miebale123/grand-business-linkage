<script setup lang="ts">
import type { AuthFeedbackType } from '@/modules/auth/auth-page.types'

withDefaults(
  defineProps<{
    message?: string
    type?: AuthFeedbackType
  }>(),
  {
    message: '',
    type: 'info',
  },
)
</script>

<template>
  <p
    v-if="message"
    :class="['bl-auth-feedback', `bl-auth-feedback--${type}`]"
    role="status"
    aria-live="polite"
  >
    {{ message }}
  </p>
</template>
