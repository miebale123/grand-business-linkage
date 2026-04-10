import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { buildRegisterLocation } from '@/app/router/paths'
import type { AuthFeedbackState } from '@/modules/auth/auth-page.types'
import { routeForRole } from '@/modules/auth/access.redirects'
import { useAuthStore } from '@/modules/auth'
import type { Role } from '@/shared/types'

const loginRoleContent: Record<Role, { title: string; copy: string }> = {
  user: {
    title: '',
    copy: '',
  },
  merchant: {
    title: 'Open your seller workspace',
    copy: 'Keep listings fresh, respond to shoppers fast, and make your best products easy to discover.',
  },
  admin: {
    title: 'Enter the admin console',
    copy: 'Review platform activity, merchant quality, and marketplace health from one secure workspace.',
  },
}

const loginRoleNotes: Record<Role, { title: string; body: string }> = {
  user: {
    title: '',
    body: '',
  },
  merchant: {
    title: 'Merchant access',
    body: 'Sign in with an existing merchant account to manage listings, track inquiries, and update your storefront.',
  },
  admin: {
    title: 'Admin access',
    body: 'Admin accounts are provisioned separately and redirect into the admin console after authentication.',
  },
}

function roleFromQuery(value: unknown): Role {
  if (value === 'merchant' || value === 'admin') {
    return value
  }

  return 'user'
}

function createEmptyFeedback(): AuthFeedbackState {
  return {
    type: 'info',
    message: '',
  }
}

export function useLoginPage() {
  const auth = useAuthStore()
  const route = useRoute()
  const router = useRouter()
  const feedback = ref<AuthFeedbackState>(createEmptyFeedback())
  const selectedRole = ref<Role>(roleFromQuery(route.query.role))
  const form = reactive({
    email: '',
    password: '',
  })

  const authTitle = computed(() => loginRoleContent[selectedRole.value].title)
  const authCopy = computed(() => loginRoleContent[selectedRole.value].copy)
  const selectedRoleCardTitle = computed(() => loginRoleNotes[selectedRole.value].title)
  const selectedRoleNoteBody = computed(() => loginRoleNotes[selectedRole.value].body)
  const createAccountLink = computed(() => buildRegisterLocation(selectedRole.value === 'merchant' ? 'merchant' : 'user'))

  watch(
    () => route.query.role,
    (role) => {
      selectedRole.value = roleFromQuery(role)
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

    try {
      const user = await auth.login(form)
      selectedRole.value = user?.role ?? selectedRole.value

      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''

      if (redirect) {
        await router.push(redirect)
        return
      }

      await router.push(routeForRole(user?.role))
    } catch (error) {
      setFeedback('error', error instanceof Error ? error.message : 'Login failed.')
    }
  }

  return {
    auth,
    authCopy,
    authTitle,
    createAccountLink,
    feedback,
    form,
    handleSubmit,
    selectedRole,
    selectedRoleCardTitle,
    selectedRoleNoteBody,
  }
}
