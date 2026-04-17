<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { buildLoginLocation, routePaths } from '@/app/router/paths'
import * as api from '@/shared/api/api'
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

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

function isAcceptedImageFile(file: File) {
  const name = file.name.toLowerCase()
  return (
    ACCEPTED_IMAGE_TYPES.has(file.type.toLowerCase()) ||
    ACCEPTED_IMAGE_EXTENSIONS.some((extension) => name.endsWith(extension))
  )
}

function assertReadableImageFile(file: File | null, label: string): asserts file is File {
  if (!file) {
    throw new Error(`${label} is required.`)
  }

  if (!isAcceptedImageFile(file)) {
    throw new Error(`${label} must be a JPG, JPEG, PNG, or WEBP image.`)
  }
}

function fileToDataUrl(file: File, label: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () =>
      reject(
        new Error(
          `Could not read ${label}. Please try another JPG, JPEG, PNG, or WEBP image.`,
        ),
      )
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

const isAuthenticated = computed(() => Boolean(auth.user))
const isUpgradeFlow = computed(() => isAuthenticated.value)

const form = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
  businessName: '',
  location: '',
  merchantLicenseId: '',
})

if (auth.user) {
  form.name = auth.user.name || ''
  form.businessName = auth.user.businessName || ''
  form.location = auth.user.location || ''
  form.phone = auth.user.phone || ''
}

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

  if (!isAuthenticated.value) {
    if (form.password.trim().length < 6) {
      setFeedback('error', 'Use at least 6 characters for a valid password.')
      return
    }
  }

  if (!hasRequiredBusinessFields.value) {
    setFeedback('error', 'Add your phone number and business name to continue.')
    return
  }

  if (isUpgradeFlow.value) {
    if (!form.merchantLicenseId.trim()) {
      setFeedback('error', 'Merchant license ID number is required.')
      return
    }
  } else {
    try {
      assertReadableImageFile(faydaFile.value, 'Fayda photo')
      assertReadableImageFile(tradeLicenseFile.value, 'Trade license photo')
    } catch (issue) {
      setFeedback('error', issue instanceof Error ? issue.message : 'Upload the required documents.')
      return
    }
  }

  submitting.value = true

  try {
    if (isAuthenticated.value && auth.user) {
      const updatedUser = await api.submitMerchantVerificationRequest(auth.user.id, {
        businessName: form.businessName,
        phone: form.phone,
        location: form.location,
        merchantLicenseId: form.merchantLicenseId,
      })
      auth.user = updatedUser
      setFeedback('success', 'Verification request submitted for admin review.')
      await nextTick()
      await router.push(routeForRole(updatedUser))
      return
    }

    {
      const faydaFileRecord = faydaFile.value!
      const tradeLicenseFileRecord = tradeLicenseFile.value!
      const faydaPhoto = await fileToDataUrl(faydaFileRecord, 'Fayda photo')
      const tradeLicensePhoto = await fileToDataUrl(
        tradeLicenseFileRecord,
        'Trade license photo',
      )
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
    }

    await nextTick()
    await router.push(routeForRole(auth.user ?? 'merchant'))
  } catch (issue) {
    setFeedback(
      'error',
      issue instanceof Error
        ? issue.message
        : isUpgradeFlow.value
          ? 'Verification request failed.'
          : 'Registration failed.',
    )
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="bl-auth-shell">
    <div class="bl-auth-stage">
      <div class="bl-auth-card bl-auth-card--wide">
        <p class="bl-auth-kicker">
          {{ isUpgradeFlow ? 'Verification request' : isAuthenticated ? 'Verification upgrade' : 'Merchant access' }}
        </p>
        <h1 class="bl-auth-title">
          {{
            isAuthenticated
              ? 'Submit your license ID for admin review'
              : 'Are you a real estate agent?'
          }}
        </h1>
        <p class="bl-auth-copy">
          {{
            isAuthenticated
              ? 'Submit your business details and merchant license ID so admin can review your upgrade to verified merchant.'
              : 'Log in or create an account.'
          }}
        </p>

        <AuthFeedbackBanner :message="feedback.message" :type="feedback.type" />

        <form class="bl-auth-form" novalidate @submit.prevent="handleSubmit">
          <div class="bl-auth-field-grid">
            <AuthTextField
              v-if="!isAuthenticated"
              id="merchant-register-name"
              v-model="form.name"
              label="Full name"
              autocomplete="name"
              placeholder="Abebe Kebede"
              icon="user"
              required
            />

            <AuthTextField
              v-if="!isAuthenticated"
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
              v-if="!isAuthenticated"
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

            <AuthTextField
              v-if="isUpgradeFlow"
              id="merchant-register-license-id"
              v-model="form.merchantLicenseId"
              label="Merchant license ID number"
              placeholder="Enter your merchant license ID"
              required
              full-width
            />

            <label
              v-if="!isUpgradeFlow"
              class="bl-auth-field bl-auth-field--full"
              for="merchant-register-fayda"
            >
              <span class="bl-auth-field__label">Fayda photo</span>
              <span class="bl-auth-field__control">
                <input
                  id="merchant-register-fayda"
                  class="bl-auth-field__input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  required
                  @change="handleFaydaChange"
                />
              </span>
              <span class="bl-auth-field__hint">
                {{
                  faydaFile
                    ? faydaFile.name
                    : 'Required. Upload a clear JPG, JPEG, PNG, or WEBP image.'
                }}
              </span>
            </label>

            <label
              v-if="!isUpgradeFlow"
              class="bl-auth-field bl-auth-field--full"
              for="merchant-register-trade-license"
            >
              <span class="bl-auth-field__label">Trade license photo</span>
              <span class="bl-auth-field__control">
                <input
                  id="merchant-register-trade-license"
                  class="bl-auth-field__input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  required
                  @change="handleTradeLicenseChange"
                />
              </span>
              <span class="bl-auth-field__hint">
                {{
                  tradeLicenseFile
                    ? tradeLicenseFile.name
                    : 'Required. Upload a clear JPG, JPEG, PNG, or WEBP image.'
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
            {{
              auth.loading || submitting
                ? 'Submitting...'
                : isUpgradeFlow
                  ? 'Submit for admin review'
                  : isAuthenticated
                    ? 'Save verification details'
                  : 'Create merchant account'
            }}
          </button>
        </form>

        <p v-if="!isAuthenticated" class="bl-auth-switch">
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
