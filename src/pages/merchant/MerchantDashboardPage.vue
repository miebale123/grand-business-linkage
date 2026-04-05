<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import AppShell from '@/layouts/AppShell.vue'
import StatCard from '@/components/StatCard.vue'
import * as mockApi from '@/services/mockApi'
import { useAuthStore } from '@/stores/auth'
import type { InquiryRecord, MerchantRecord, ProductRecord } from '@/types'

const auth = useAuthStore()

const merchant = ref<MerchantRecord | null>(null)
const products = ref<ProductRecord[]>([])
const inquiries = ref<InquiryRecord[]>([])
const busy = ref(true)

const stats = computed(() => [
  {
    label: 'Published products',
    value: products.value.length,
    detail: 'Listings visible to searching customers.',
  },
  {
    label: 'Inquiries received',
    value: inquiries.value.length,
    detail: 'Direct signals of product demand.',
  },
  {
    label: 'Featured items',
    value: products.value.filter((product) => product.featured).length,
    detail: 'Products highlighted in the marketplace preview.',
  },
  {
    label: 'Stock at risk',
    value: products.value.filter((product) => product.availability === 'Low Stock').length,
    detail: 'Listings that may need merchant attention.',
  },
])

async function refresh() {
  if (!auth.user) {
    return
  }

  busy.value = true
  merchant.value = await mockApi.fetchMerchantByOwner(auth.user.id)

  const merchantRecord = merchant.value
  products.value = merchantRecord ? await mockApi.fetchMerchantProducts(merchantRecord.id) : []
  inquiries.value = await mockApi.fetchMerchantInquiries(auth.user.id)
  busy.value = false
}

async function removeProduct(productId: string) {
  if (!auth.user) {
    return
  }

  await mockApi.deleteMerchantProduct(auth.user.id, productId)
  await refresh()
}

onMounted(refresh)
</script>

<template>
  <AppShell>
    <section class="page-header">
      <div>
        <p class="eyebrow">Merchant workspace</p>
        <h1 class="page-title">Make your products visible to customers who are already searching.</h1>
        <p class="page-copy">
          This dashboard is the merchant-side answer to the discovery problem. Publish listings,
          keep availability current, and monitor inquiry demand.
        </p>
      </div>

      <RouterLink class="button" to="/merchant/products/new">Add product</RouterLink>
    </section>

    <section class="stats-grid" style="margin-bottom: 24px">
      <StatCard
        v-for="metric in stats"
        :key="metric.label"
        :label="metric.label"
        :value="metric.value"
        :detail="metric.detail"
      />
    </section>

    <section class="split">
      <article class="panel" style="padding: 22px">
        <div class="page-header" style="margin-bottom: 14px">
          <div>
            <p class="eyebrow">Product list</p>
            <h2 style="margin: 0">Current inventory visibility</h2>
          </div>
        </div>

        <div v-if="busy" class="empty-state">Loading merchant catalog...</div>
        <div v-else-if="products.length" class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Availability</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td>{{ product.name }}</td>
                <td>{{ product.category }}</td>
                <td>{{ product.availability }}</td>
                <td>ETB {{ product.price.toLocaleString() }}</td>
                <td>
                  <div class="inline">
                    <RouterLink class="button-secondary" :to="`/merchant/products/${product.id}/edit`">
                      Edit
                    </RouterLink>
                    <button class="button-ghost" type="button" @click="removeProduct(product.id)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No products yet. Add your first listing to join the search results.</div>
      </article>

      <aside class="stack">
        <section class="panel" style="padding: 22px">
          <p class="eyebrow">Business profile</p>
          <h2 style="margin: 0 0 8px">{{ merchant?.businessName }}</h2>
          <p class="muted" style="margin: 0 0 12px">{{ merchant?.description }}</p>
          <div class="stack" style="gap: 8px">
            <span class="tag">{{ merchant?.category }}</span>
            <span class="tag">{{ merchant?.location }}</span>
            <span class="tag">{{ merchant?.verified ? 'Verified merchant' : 'Pending verification' }}</span>
          </div>
        </section>

        <section class="panel" style="padding: 22px">
          <p class="eyebrow">Latest inquiries</p>
          <div v-if="inquiries.length" class="stack">
            <article v-for="inquiry in inquiries.slice(0, 4)" :key="inquiry.id" class="content-card">
              <strong>{{ inquiry.customerName }}</strong>
              <p class="muted" style="margin: 8px 0">{{ inquiry.message }}</p>
              <span class="hint">{{ new Date(inquiry.createdAt).toLocaleString() }}</span>
            </article>
          </div>
          <div v-else class="empty-state">No inquiries yet. Search-driven messages will appear here.</div>
        </section>
      </aside>
    </section>
  </AppShell>
</template>
