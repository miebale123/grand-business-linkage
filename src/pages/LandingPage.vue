<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import AppShell from '@/layouts/AppShell.vue'
import ProductCard from '@/components/ProductCard.vue'
import { fetchFeaturedProducts } from '@/services/mockApi'
import { useAuthStore } from '@/stores/auth'
import type { ProductRecord } from '@/types'

const auth = useAuthStore()
const featured = ref<ProductRecord[]>([])
const loading = ref(true)

const demoAccounts = computed(() => [
  { role: 'User', email: 'selam@demo.com', password: 'demo123' },
  { role: 'Merchant', email: 'kalayu@demo.com', password: 'demo123' },
  { role: 'Admin', email: 'admin@demo.com', password: 'demo123' },
])

onMounted(async () => {
  featured.value = await fetchFeaturedProducts()
  loading.value = false
})
</script>

<template>
  <AppShell>
    <section class="panel" style="padding: 28px; overflow: hidden">
      <div class="split" style="align-items: center">
        <div class="stack" style="gap: 18px">
          <div>
            <p class="eyebrow">Business Linkage MVP</p>
            <h1 class="page-title">Help customers find the right item and the right merchant faster.</h1>
            <p class="page-copy">
              This Vue MVP focuses on the problem your senior described: discovery, visibility,
              and inquiry. Users search across merchants, merchants publish products, and admins
              oversee the ecosystem.
            </p>
          </div>

          <div class="inline">
            <RouterLink class="button" :to="auth.user ? '/user' : '/login'">
              {{ auth.user ? 'Open workspace' : 'Sign in to demo' }}
            </RouterLink>
            <RouterLink class="button-ghost" to="/register">Create account</RouterLink>
          </div>

          <div class="card-grid">
            <div class="content-card">
              <h3>Search and discovery</h3>
              <p class="muted">Users can search products, filter results, and identify which merchant has the item.</p>
            </div>
            <div class="content-card">
              <h3>Merchant visibility</h3>
              <p class="muted">Merchants can manage products and expose unique or hard-to-find items through listings.</p>
            </div>
            <div class="content-card">
              <h3>Inquiry flow</h3>
              <p class="muted">Users contact merchants directly from the product page without requiring checkout complexity.</p>
            </div>
          </div>
        </div>

        <div class="panel" style="padding: 22px; background: linear-gradient(180deg, #fff, #f6f1ff)">
          <p class="eyebrow">Demo accounts</p>
          <div class="stack">
            <div v-for="account in demoAccounts" :key="account.role" class="content-card">
              <div class="inline" style="justify-content: space-between">
                <strong>{{ account.role }}</strong>
                <span class="tag">{{ account.password }}</span>
              </div>
              <p class="muted" style="margin: 10px 0 0">{{ account.email }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section style="margin-top: 24px">
      <div class="page-header">
        <div>
          <p class="eyebrow">Featured products</p>
          <h2 class="page-title" style="font-size: 2rem">Marketplace preview</h2>
        </div>
      </div>

      <div v-if="loading" class="empty-state">Loading featured products...</div>
      <div v-else class="card-grid">
        <ProductCard v-for="product in featured" :key="product.id" :product="product" />
      </div>
    </section>
  </AppShell>
</template>
