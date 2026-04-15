<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { buildLoginLocation, routePaths } from '@/app/router/paths'
import AuthFeedbackBanner from '@/modules/auth/components/AuthFeedbackBanner.vue'
import AuthPasswordField from '@/modules/auth/components/AuthPasswordField.vue'
import AuthTextField from '@/modules/auth/components/AuthTextField.vue'
import { routeForRole } from '@/modules/auth/access.redirects'
import { useAuthStore } from '@/modules/auth'

import '@/modules/auth/auth-page.css'

type FeedbackState = {
  type: 'info' | 'success' | 'error'
  message: string
}

function emptyFeedback(): FeedbackState {
  return { type: 'info', message: '' }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}

const router = useRouter()
const auth = useAuthStore()
const feedback = ref<FeedbackState>(emptyFeedback())
const faydaFile = ref<File | null>(null)
const tradeLicenseFile = ref<File | null>(null)
const submitting = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
  businessName: '',
  location: '',
})

const hasRequiredBusinessFields = computed(() =>
  Boolean(form.phone.trim() && form.businessName.trim()),
)

function setFeedback(type: FeedbackState['type'], message: string) {
  feedback.value = { type, message }
}

function clearFeedback() {
  feedback.value = emptyFeedback()
}

function handleFaydaChange(event: Event) {
  const input = event.target as HTMLInputElement
  faydaFile.value = input.files?.[0] ?? null
}

function handleTradeLicenseChange(event: Event) {
  const input = event.target as HTMLInputElement
  tradeLicenseFile.value = input.files?.[0] ?? null
}

async function handleSubmit() {
  clearFeedback()

  if (form.password.trim().length < 6) {
    setFeedback('error', 'Use at least 6 characters for a valid password.')
    return
  }

  if (!hasRequiredBusinessFields.value) {
    setFeedback('error', 'Add your phone number and business name to continue.')
    return
  }

  submitting.value = true

  try {
    const faydaPhoto = faydaFile.value ? await fileToDataUrl(faydaFile.value) : undefined
    const tradeLicensePhoto = tradeLicenseFile.value
      ? await fileToDataUrl(tradeLicenseFile.value)
      : undefined

    await auth.register({
      name: form.name,
      email: form.email,
      password: form.password,
      role: 'merchant',
      businessName: form.businessName,
      phone: form.phone,
      location: form.location,
      faydaPhoto,
      tradeLicensePhoto,
    })

    await router.push(routeForRole('merchant'))
  } catch (issue) {
    setFeedback('error', issue instanceof Error ? issue.message : 'Registration failed.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="bl-auth-shell">
    <div class="bl-auth-stage">
      <div class="bl-auth-card bl-auth-card--wide">
        <p class="bl-auth-kicker">Merchant access</p>
        <h1 class="bl-auth-title">Are you a real estate agent?</h1>
        <p class="bl-auth-copy">Log in or create an account.</p>

        <AuthFeedbackBanner :message="feedback.message" :type="feedback.type" />

        <form class="bl-auth-form" novalidate @submit.prevent="handleSubmit">
          <div class="bl-auth-field-grid">
            <AuthTextField
              id="merchant-register-name"
              v-model="form.name"
              label="Full name"
              autocomplete="name"
              placeholder="Abebe Kebede"
              icon="user"
              required
            />

            <AuthTextField
              id="merchant-register-email"
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
              id="merchant-register-password"
              v-model="form.password"
              label="Password"
              autocomplete="new-password"
              placeholder="At least 6 characters"
              hint="Use at least 6 characters."
              required
            />

            <AuthTextField
              id="merchant-register-phone"
              v-model="form.phone"
              label="Phone number"
              type="tel"
              autocomplete="tel"
              inputmode="tel"
              placeholder="+251 9xx xxx xxx"
              required
            />

            <AuthTextField
              id="merchant-register-location"
              v-model="form.location"
              label="Location"
              autocomplete="address-level2"
              placeholder="Bole, Addis Ababa"
            />

            <AuthTextField
              id="merchant-register-business-name"
              v-model="form.businessName"
              label="Business name"
              placeholder="Your shop or business name"
              required
              full-width
            />

            <label class="bl-auth-field bl-auth-field--full" for="merchant-register-fayda">
              <span class="bl-auth-field__label">Fayda photo (optional)</span>
              <span class="bl-auth-field__control">
                <input
                  id="merchant-register-fayda"
                  class="bl-auth-field__input"
                  type="file"
                  accept="image/*"
                  @change="handleFaydaChange"
                />
              </span>
              <span class="bl-auth-field__hint">
                {{ faydaFile ? faydaFile.name : 'Optional. Upload a clear photo if available.' }}
              </span>
            </label>

            <label class="bl-auth-field bl-auth-field--full" for="merchant-register-trade-license">
              <span class="bl-auth-field__label">Trade license photo (optional)</span>
              <span class="bl-auth-field__control">
                <input
                  id="merchant-register-trade-license"
                  class="bl-auth-field__input"
                  type="file"
                  accept="image/*"
                  @change="handleTradeLicenseChange"
                />
              </span>
              <span class="bl-auth-field__hint">
                {{
                  tradeLicenseFile
                    ? tradeLicenseFile.name
                    : 'Optional. Upload a clear photo if available.'
                }}
              </span>
            </label>
          </div>

          <button class="bl-auth-submit" type="submit" :disabled="auth.loading || submitting">
            <span
              v-if="auth.loading || submitting"
              class="bl-auth-submit__spinner"
              aria-hidden="true"
            ></span>
            {{ auth.loading || submitting ? 'Creating account...' : 'Create merchant account' }}
          </button>
        </form>

        <p class="bl-auth-switch">
          Already have an account?
          <RouterLink :to="buildLoginLocation({ role: 'merchant' })" class="bl-auth-switch-link"
            >Sign in</RouterLink
          >
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
