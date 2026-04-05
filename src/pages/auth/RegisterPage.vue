<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import AppShell from '@/layouts/AppShell.vue'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types'

const auth = useAuthStore()
const router = useRouter()
const localError = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user' as Role,
  businessName: '',
  location: '',
})

const isMerchant = computed(() => form.role === 'merchant')

async function handleSubmit() {
  localError.value = ''

  try {
    const account = await auth.register(form)
    await router.push(account.role === 'merchant' ? '/merchant' : '/user')
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Registration failed.'
  }
}
</script>

<template>
  <AppShell>
    <section class="panel" style="padding: 28px; max-width: 760px; margin: 0 auto">
      <p class="eyebrow">Registration</p>
      <h1 class="page-title" style="font-size: 2.2rem">Create a test account</h1>
      <p class="page-copy">
        Register as a user to search products or as a merchant to list inventory and respond to demand.
      </p>

      <form class="stack" style="margin-top: 22px" @submit.prevent="handleSubmit">
        <div class="form-grid">
          <label class="label">
            Full name
            <input v-model="form.name" class="input" type="text" placeholder="Your name" required />
          </label>

          <label class="label">
            Email
            <input v-model="form.email" class="input" type="email" placeholder="you@example.com" required />
          </label>

          <label class="label">
            Password
            <input v-model="form.password" class="input" type="password" placeholder="At least 6 characters" required />
          </label>

          <label class="label">
            Role
            <select v-model="form.role" class="select">
              <option value="user">User / Customer</option>
              <option value="merchant">Merchant</option>
            </select>
          </label>

          <label class="label">
            Location
            <input v-model="form.location" class="input" type="text" placeholder="Bole, Addis Ababa" />
          </label>

          <label v-if="isMerchant" class="label">
            Business name
            <input
              v-model="form.businessName"
              class="input"
              type="text"
              placeholder="Merchant or pharmacy name"
              :required="isMerchant"
            />
          </label>
        </div>

        <p v-if="localError || auth.error" class="error-text">{{ localError || auth.error }}</p>

        <button class="button" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="hint" style="margin-top: 18px">
        Already have an account?
        <RouterLink to="/login" style="color: var(--primary); font-weight: 700">Sign in</RouterLink>
      </p>
    </section>
  </AppShell>
</template>
