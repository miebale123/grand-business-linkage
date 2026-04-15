<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import AuthFeedbackBanner from '@/modules/auth/components/AuthFeedbackBanner.vue'
import AuthPasswordField from '@/modules/auth/components/AuthPasswordField.vue'
import AuthTextField from '@/modules/auth/components/AuthTextField.vue'
import { useRegisterPage } from '@/modules/auth/composables/useRegisterPage'

import '@/modules/auth/auth-page.css'

const {
  agreement,
  authCopy,
  authTitle,
  feedback,
  form,
  handleSubmit,
  isMerchant,
  onboardingBody,
  onboardingTitle,
  signInLink,
  submitting,
} = useRegisterPage()

const hasOnboarding = computed(() => Boolean(onboardingTitle.value && onboardingBody.value))
</script>

<template>
  <section class="bl-auth-shell">
    <div class="bl-auth-stage">
      <div class="bl-auth-card bl-auth-card--wide">
        <p class="bl-auth-kicker">Create account</p>
        <h1 class="bl-auth-title">{{ authTitle }}</h1>
        <p v-if="authCopy" class="bl-auth-copy">{{ authCopy }}</p>

        <div v-if="hasOnboarding" class="bl-auth-note">
          <p class="bl-auth-note__title">{{ onboardingTitle }}</p>
          <p class="bl-auth-note__body">{{ onboardingBody }}</p>
        </div>

        <AuthFeedbackBanner :message="feedback.message" :type="feedback.type" />

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
            <span> I agree to the terms and conditions. </span>
          </label>

          <button class="bl-auth-submit" type="submit" :disabled="submitting">
            <span v-if="submitting" class="bl-auth-submit__spinner" aria-hidden="true"></span>
            {{ submitting ? 'Creating account...' : 'Create account' }}
          </button>
        </form>

        <p class="bl-auth-switch">
          Already have an account?
          <RouterLink :to="signInLink" class="bl-auth-switch-link">Sign in</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>
