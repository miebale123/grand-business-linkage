<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AuthFeedbackBanner from '@/modules/auth/components/AuthFeedbackBanner.vue'
import AuthNoteCard from '@/modules/auth/components/AuthNoteCard.vue'
import AuthPasswordField from '@/modules/auth/components/AuthPasswordField.vue'
import AuthScreen from '@/modules/auth/components/AuthScreen.vue'
import AuthTextField from '@/modules/auth/components/AuthTextField.vue'
import { useRegisterPage } from '@/modules/auth/composables/useRegisterPage'

const {
  agreement,
  auth,
  authCopy,
  authTitle,
  feedback,
  form,
  handleSubmit,
  isMerchant,
  onboardingBody,
  onboardingTitle,
  signInLink,
} = useRegisterPage()
</script>

<template>
  <AuthScreen
    kicker="Create account"
    :title="authTitle"
    :copy="authCopy"
    wide
  >
    <AuthNoteCard v-if="onboardingTitle && onboardingBody" :title="onboardingTitle" :body="onboardingBody" />

    <AuthFeedbackBanner
      :message="feedback.message"
      :type="feedback.type"
    />

    <form class="bl-auth-form" novalidate @submit.prevent="handleSubmit">
      <div class="bl-auth-field-grid">
        <AuthTextField
          id="register-name"
          v-model="form.name"
          label="Full name"
          autocomplete="name"
          placeholder="Abebe Kebede"
          icon="user"
          required
        />

        <AuthTextField
          id="register-email"
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
          id="register-password"
          v-model="form.password"
          label="Password"
          autocomplete="new-password"
          placeholder="At least 6 characters"
          required
          />
          <!-- hint="Use at least 6 characters." -->

        <AuthTextField
          id="register-location"
          v-model="form.location"
          label="Location"
          autocomplete="address-level2"
          placeholder="Bole, Addis Ababa"
        />

        <AuthTextField
          v-if="isMerchant"
          id="register-business-name"
          v-model="form.businessName"
          label="Business name"
          placeholder="Your shop or business name"
          :required="isMerchant"
          full-width
        />
      </div>

      <label class="bl-auth-agreement" for="register-agreement">
        <input
          id="register-agreement"
          v-model="agreement"
          class="bl-auth-agreement__checkbox"
          type="checkbox"
          required
        />
        <span>
          I agree to the terms and conditions.
        </span>
      </label>

      <button class="bl-auth-submit" type="submit" :disabled="auth.loading">
        <span v-if="auth.loading" class="bl-auth-submit__spinner" aria-hidden="true"></span>
        {{ auth.loading ? 'Creating account...' : 'Create account' }}
      </button>
    </form>

    <!-- <div class="bl-auth-divider" aria-hidden="true">
      <span>or</span>
    </div>

    <AuthSocialButtons :loading="auth.loading" two-column @social="handleSocialSignup" /> -->

    <p class="bl-auth-switch">
      Already have an account?
      <RouterLink :to="signInLink" class="bl-auth-switch-link">Sign in</RouterLink>
    </p>
  </AuthScreen>
</template>
