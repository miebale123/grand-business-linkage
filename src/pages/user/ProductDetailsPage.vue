<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppShell from '@/layouts/AppShell.vue'
import * as mockApi from '@/services/mockApi'
import { useAuthStore } from '@/stores/auth'
import type { MerchantRecord, ProductRecord } from '@/types'

const auth = useAuthStore()
const route = useRoute()
const product = ref<ProductRecord | null>(null)
const merchant = ref<MerchantRecord | null>(null)
const success = ref('')
const error = ref('')

const inquiry = reactive({
  message: '',
})

const priceLabel = computed(() =>
  product.value ? `ETB ${product.value.price.toLocaleString()}` : '',
)

onMounted(async () => {
  const record = await mockApi.fetchProductById(route.params.id as string)
  product.value = record
  merchant.value = await mockApi.fetchMerchantById(record.merchantId)
})

async function submitInquiry() {
  if (!product.value || !merchant.value || !auth.user) {
    return
  }

  error.value = ''
  success.value = ''

  try {
    await mockApi.createInquiry({
      productId: product.value.id,
      merchantId: merchant.value.id,
      userId: auth.user.id,
      customerName: auth.user.name,
      message: inquiry.message,
    })

    inquiry.message = ''
    success.value = 'Inquiry sent to the merchant.'
  } catch (issue) {
    error.value = issue instanceof Error ? issue.message : 'Could not send inquiry.'
  }
}
</script>

<template>
  <AppShell>
    <section v-if="product && merchant" class="split">
      <article class="panel" style="padding: 24px">
        <img
          :src="product.image"
          :alt="product.name"
          style="width: 100%; height: 320px; object-fit: cover; border-radius: 22px"
        />

        <div class="stack" style="gap: 12px; margin-top: 20px">
          <div class="inline">
            <span class="tag">{{ product.category }}</span>
            <span class="tag">{{ product.availability }}</span>
          </div>
          <h1 class="page-title" style="font-size: 2.1rem">{{ product.name }}</h1>
          <p class="muted" style="margin: 0">{{ product.description }}</p>
          <strong style="font-size: 1.5rem">{{ priceLabel }}</strong>
        </div>
      </article>

      <aside class="stack">
        <section class="panel" style="padding: 24px">
          <p class="eyebrow">Merchant information</p>
          <h2 style="margin: 0 0 8px">{{ merchant.businessName }}</h2>
          <p class="muted" style="margin: 0 0 10px">{{ merchant.description }}</p>
          <div class="stack" style="gap: 8px">
            <span class="tag">{{ merchant.category }}</span>
            <span class="tag">{{ merchant.location }}</span>
            <span class="tag">{{ merchant.verified ? 'Verified merchant' : 'Pending verification' }}</span>
          </div>
        </section>

        <section class="panel" style="padding: 24px">
          <p class="eyebrow">Send inquiry</p>
          <label class="label">
            Message
            <textarea
              v-model="inquiry.message"
              class="textarea"
              placeholder="Ask about availability, alternatives, pricing, or delivery options..."
            />
          </label>

          <p v-if="error" class="error-text">{{ error }}</p>
          <p v-if="success" class="success-text">{{ success }}</p>

          <button class="button" type="button" style="margin-top: 14px" @click="submitInquiry">
            Send inquiry
          </button>
        </section>
      </aside>
    </section>

    <section v-else class="empty-state">Loading product details...</section>
  </AppShell>
</template>
