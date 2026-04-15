<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { routePaths } from '@/app/router/paths'
import AuthFeedbackBanner from '@/modules/auth/components/AuthFeedbackBanner.vue'
import AuthPasswordField from '@/modules/auth/components/AuthPasswordField.vue'
import AuthTextField from '@/modules/auth/components/AuthTextField.vue'
import { useLoginPage } from '@/modules/auth/composables/useLoginPage'

import '@/modules/auth/auth-page.css'

const {
  auth,
  authCopy,
  authTitle,
  createAccountLink,
  feedback,
  form,
  handleSubmit,
  selectedRoleCardTitle,
  selectedRoleNoteBody,
} = useLoginPage()

const props = withDefaults(
  defineProps<{
    wide?: boolean
  }>(),
  {
    wide: false,
  },
)

const hasNote = computed(() => Boolean(selectedRoleCardTitle.value && selectedRoleNoteBody.value))
</script>

<template>
  <section class="bl-auth-shell">
    <div class="bl-auth-stage">
      <div class="bl-auth-card" :class="{ 'bl-auth-card--wide': props.wide }">
        <p class="bl-auth-kicker">Business Linkage sign in</p>
        <h1 class="bl-auth-title">{{ authTitle }}</h1>
        <p v-if="authCopy" class="bl-auth-copy">{{ authCopy }}</p>

        <div v-if="hasNote" class="bl-auth-note">
          <p class="bl-auth-note__title">{{ selectedRoleCardTitle }}</p>
          <p class="bl-auth-note__body">{{ selectedRoleNoteBody }}</p>
        </div>

        <AuthFeedbackBanner :message="feedback.message" :type="feedback.type" />

        <form class="bl-auth-form" novalidate @submit.prevent="handleSubmit">
          <AuthTextField
            id="login-email"
            v-model="form.email"
            label="Email"
            type="email"
            autocomplete="email"
            inputmode="email"
            placeholder="you@example.com"
            icon="email"
            required
          />

          <AuthPasswordField
            id="login-password"
            v-model="form.password"
            label="Password"
            autocomplete="current-password"
            placeholder="Enter your password"
            required
          />

          <button class="bl-auth-submit" type="submit" :disabled="auth.loading">
            <span v-if="auth.loading" class="bl-auth-submit__spinner" aria-hidden="true"></span>
            {{ auth.loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <p class="bl-auth-switch">
          Don't have an account?
          <RouterLink :to="createAccountLink" class="bl-auth-switch-link">
            Create account
          </RouterLink>
        </p>

        <p class="bl-auth-switch">
          <RouterLink :to="routePaths.home" class="bl-auth-switch-link"
            >Back to marketplace home</RouterLink
          >
        </p>
      </div>
    </div>
  </section>
</template>
