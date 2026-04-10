import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { buildLoginLocation } from '@/app/router/paths'
import type { AuthFeedbackState } from '@/modules/auth/auth-page.types'
import { routeForRole } from '@/modules/auth/access.redirects'
import { useAuthStore } from '@/modules/auth'
import type { Role } from '@/shared/types'

function roleFromQuery(value: unknown): Role {
  return value === 'merchant' ? 'merchant' : 'user'
}

function createEmptyFeedback(): AuthFeedbackState {
  return {
    type: 'info',
    message: '',
  }
}

export function useRegisterPage() {
  const auth = useAuthStore()
  const route = useRoute()
  const router = useRouter()
  const agreement = ref(false)
  const feedback = ref<AuthFeedbackState>(createEmptyFeedback())
  const form = reactive({
    name: '',
    email: '',
    password: '',
    role: roleFromQuery(route.query.role) as Role,
    businessName: '',
    location: '',
  })

  const isMerchant = computed(() => form.role === 'merchant')
  const authTitle = computed(() =>
    isMerchant.value ? 'Open your seller account' : '',
  )
  const authCopy = computed(() =>
    isMerchant.value
      ? 'Set up a merchant profile, publish inventory, and start receiving buyer interest from one workspace.'
      : '',
  )
  const signInLink = computed(() => buildLoginLocation({ role: isMerchant.value ? 'merchant' : 'user' }))
  const onboardingTitle = computed(() =>
    isMerchant.value ? 'Merchant onboarding' : '',
  )
  const onboardingBody = computed(() =>
    isMerchant.value
      ? 'Merchant accounts start with a workspace and a basic storefront profile. Admin approval remains separate.'
      : '',
  )
  const submitting = computed(() => auth.loading)

  watch(
    () => route.query.role,
    (role) => {
      form.role = roleFromQuery(role)
    },
  )

  function setFeedback(type: AuthFeedbackState['type'], message: string) {
    feedback.value = { type, message }
  }

  function clearFeedback() {
    feedback.value = createEmptyFeedback()
  }

  async function handleSubmit() {
    clearFeedback()

    if (form.password.trim().length < 6) {
      setFeedback('error', 'Use at least 6 characters for a valid password.')
      return
    }

    if (!agreement.value) {
      setFeedback('error', 'Please agree to the terms and conditions before continuing.')
      return
    }

    try {
      const account = await auth.register(form)
      await router.push(routeForRole(account?.role))
    } catch (error) {
      setFeedback('error', error instanceof Error ? error.message : 'Registration failed.')
    }
  }

  return {
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
    submitting,
  }
}
