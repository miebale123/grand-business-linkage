<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppShell from '@/layouts/AppShell.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  email: 'selam@demo.com',
  password: 'demo123',
})

const localError = ref('')

async function handleSubmit() {
  localError.value = ''

  try {
    const user = await auth.login(form)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''

    if (redirect) {
      await router.push(redirect)
      return
    }

    if (user.role === 'merchant') {
      await router.push('/merchant')
      return
    }

    if (user.role === 'admin') {
      await router.push('/admin')
      return
    }

    await router.push('/user')
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Login failed.'
  }
}
</script>

<template>
  <AppShell>
    <section class="panel" style="padding: 28px; max-width: 620px; margin: 0 auto">
      <p class="eyebrow">Authentication</p>
      <h1 class="page-title" style="font-size: 2.2rem">Sign in to the MVP</h1>
      <p class="page-copy">
        Use one of the demo accounts or register a new user or merchant account. Admin is demo-only for this mock.
      </p>

      <form class="stack" style="margin-top: 22px" @submit.prevent="handleSubmit">
        <label class="label">
          Email
          <input v-model="form.email" class="input" type="email" placeholder="name@demo.com" required />
        </label>

        <label class="label">
          Password
          <input v-model="form.password" class="input" type="password" placeholder="demo123" required />
        </label>

        <p v-if="localError || auth.error" class="error-text">{{ localError || auth.error }}</p>

        <button class="button" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="hint" style="margin-top: 18px">
        Need a new account?
        <RouterLink to="/register" style="color: var(--primary); font-weight: 700">Register here</RouterLink>
      </p>
    </section>
  </AppShell>
</template>
