<script setup lang="ts">
import AuthIcon from '@/modules/auth/components/AuthIcon.vue'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    twoColumn?: boolean
  }>(),
  {
    loading: false,
    twoColumn: false,
  },
)

const emit = defineEmits<{
  social: [provider: 'Google' | 'Apple']
}>()

function handleSocial(provider: 'Google' | 'Apple') {
  emit('social', provider)
}
</script>

<template>
  <div
    class="bl-auth-social-stack"
    :class="{ 'bl-auth-social-stack--two': props.twoColumn }"
  >
    <button
      type="button"
      class="bl-auth-social-button bl-auth-social-button--google"
      :disabled="loading"
      @click="handleSocial('Google')"
    >
      <span class="bl-auth-social-icon" aria-hidden="true">
        <AuthIcon name="google" />
      </span>
      <span>Continue with Google</span>
    </button>

    <button
      type="button"
      class="bl-auth-social-button bl-auth-social-button--apple"
      :disabled="loading"
      @click="handleSocial('Apple')"
    >
      <span class="bl-auth-social-icon" aria-hidden="true">
        <AuthIcon name="apple" />
      </span>
      <span>Continue with Apple</span>
    </button>
  </div>
</template>
