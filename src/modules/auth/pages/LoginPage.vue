<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AuthFeedbackBanner from '@/modules/auth/components/AuthFeedbackBanner.vue'
import AuthNoteCard from '@/modules/auth/components/AuthNoteCard.vue'
import AuthPasswordField from '@/modules/auth/components/AuthPasswordField.vue'
import AuthScreen from '@/modules/auth/components/AuthScreen.vue'
import AuthTextField from '@/modules/auth/components/AuthTextField.vue'
import { useLoginPage } from '@/modules/auth/composables/useLoginPage'

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
</script>

<template>
  <AuthScreen
    kicker="Business Linkage sign in"
    :title="authTitle"
    :copy="authCopy"
  >
    <AuthNoteCard
      v-if="selectedRoleCardTitle && selectedRoleNoteBody"
      :title="selectedRoleCardTitle"
      :body="selectedRoleNoteBody"
    />

    <AuthFeedbackBanner
      :message="feedback.message"
      :type="feedback.type"
    />

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

    <!-- <div class="bl-auth-divider" aria-hidden="true">
      <span>or</span>
    </div>

    <AuthSocialButtons :loading="auth.loading" @social="handleSocialSignin" /> -->

    <p class="bl-auth-switch">
      Don't have an account?
      <RouterLink :to="createAccountLink" class="bl-auth-switch-link">
        Create account
      </RouterLink>
    </p>

    <p class="bl-auth-switch">
      <RouterLink to="/" class="bl-auth-switch-link">Back to marketplace home</RouterLink>
    </p>
  </AuthScreen>
</template>
