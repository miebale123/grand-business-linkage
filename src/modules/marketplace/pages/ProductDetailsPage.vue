<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRoute } from 'vue-router'

import ProductCard from '@/modules/marketplace/components/ProductCard.vue'
import { useAuthStore, useAuthorization } from '@/modules/auth'
import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import type { MerchantRecord, ProductRecord } from '@/shared/types'

const auth = useAuthStore()
const authorization = useAuthorization()
const route = useRoute()
const product = ref<ProductRecord | null>(null)
const merchant = ref<MerchantRecord | null>(null)
const relatedProducts = ref<ProductRecord[]>([])
const areaMerchants = ref<MerchantRecord[]>([])
const preferredArea = ref(api.getPreferredMarketplaceArea())
const loading = ref(true)
const success = ref('')
const error = ref('')

const inquiry = reactive({
  message: '',
})

const priceLabel = computed(() =>
  product.value ? `ETB ${product.value.price.toLocaleString()}` : '',
)
const signInTarget = computed(() => ({
  path: '/login',
  query: {
    role: 'user',
    redirect: route.fullPath,
  },
}))
const canInquire = computed(() => authorization.hasRole('user'))

onMounted(async () => {
  const record = await api.fetchProductById(route.params.id as string)
  const [merchantRecord, merchantCatalog] = await Promise.all([
    api.fetchMerchantById(record.merchantId),
    api.fetchMerchantCatalog(record.merchantId),
  ])

  product.value = record
  merchant.value = merchantRecord
  relatedProducts.value = merchantCatalog.filter((item) => item.id !== record.id).slice(0, 3)

  if (preferredArea.value) {
    areaMerchants.value = await api.fetchMerchantsByArea(preferredArea.value, {
      excludeMerchantId: merchantRecord.id,
      limit: 3,
    })
  }

  loading.value = false
})

async function submitInquiry() {
  if (!product.value || !merchant.value || !auth.user || !authorization.hasRole('user')) {
    return
  }

  error.value = ''
  success.value = ''

  try {
    await api.createInquiry({
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
    <section v-if="loading" class="empty-panel">Loading product details...</section>

    <template v-else-if="product && merchant">
      <section class="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_360px]">
        <article class="shell-panel overflow-hidden">
          <img :src="product.image" :alt="product.name" class="h-[340px] w-full object-cover sm:h-[440px]" />

          <div class="px-6 py-7 sm:px-8">
            <div class="flex flex-wrap gap-3">
              <span class="chip !px-4 !py-2">{{ product.category }}</span>
              <span
                class="chip !px-4 !py-2"
                :class="
                  product.availability === 'In Stock'
                    ? 'chip-good'
                    : product.availability === 'Low Stock'
                      ? 'chip-warn'
                      : 'chip-muted'
                "
              >
                {{ product.availability }}
              </span>
            </div>

            <h1 class="mt-5 font-heading text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
              {{ product.name }}
            </h1>
            <p class="mt-4 text-lg font-semibold text-[var(--text)]">{{ priceLabel }}</p>
            <p class="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">{{ product.description }}</p>

            <div class="mt-8 grid gap-4 sm:grid-cols-3">
              <div class="rounded-[24px] bg-[var(--surface-alt)] p-4">
                <p class="text-sm font-semibold text-[var(--text)]">Seller</p>
                <p class="mt-2 text-sm text-[var(--muted)]">{{ merchant.businessName }}</p>
              </div>
              <div class="rounded-[24px] bg-[var(--surface-alt)] p-4">
                <p class="text-sm font-semibold text-[var(--text)]">Location</p>
                <p class="mt-2 text-sm text-[var(--muted)]">{{ merchant.location }}</p>
              </div>
              <div class="rounded-[24px] bg-[var(--surface-alt)] p-4">
                <p class="text-sm font-semibold text-[var(--text)]">Store status</p>
                <p class="mt-2 text-sm text-[var(--muted)]">
                  {{ merchant.verified ? 'Verified on Business Linkage' : 'Under review' }}
                </p>
              </div>
            </div>
          </div>
        </article>

        <aside class="space-y-6">
          <section class="shell-panel px-6 py-7">
            <p class="section-eyebrow">Storefront</p>
            <h2 class="font-heading text-2xl font-semibold tracking-tight text-[var(--text)]">
              {{ merchant.businessName }}
            </h2>
            <p class="mt-3 text-sm leading-6 text-[var(--muted)]">{{ merchant.description }}</p>
            <div class="mt-5 flex flex-wrap gap-3">
              <span class="chip !px-4 !py-2">{{ merchant.category }}</span>
              <span class="chip !px-4 !py-2">{{ merchant.location }}</span>
              <span
                v-for="area in merchant.deliveryAreas.slice(0, 3)"
                :key="area"
                class="chip chip-muted !px-4 !py-2"
              >
                Delivers to {{ area }}
              </span>
            </div>
            <RouterLink class="btn-secondary mt-6" :to="`/merchants/${merchant.id}`">
              Visit storefront
            </RouterLink>
          </section>

          <section class="shell-panel px-6 py-7">
            <p class="section-eyebrow">Message seller</p>
            <h2 class="font-heading text-2xl font-semibold tracking-tight text-[var(--text)]">
              Confirm details before you go
            </h2>
            <p class="mt-3 text-sm leading-6 text-[var(--muted)]">
              Ask about stock, colors, pickup timing, delivery areas, or alternative options.
            </p>

            <div v-if="!auth.user" class="mt-6 rounded-[24px] bg-[var(--surface-alt)] p-5">
              <p class="text-sm leading-6 text-[var(--muted)]">
                Sign in with a shopper account to send inquiries and keep the conversation tied to your profile.
              </p>
              <RouterLink class="btn-primary mt-4" :to="signInTarget">Sign in to message seller</RouterLink>
            </div>

            <div v-else-if="!canInquire" class="mt-6 rounded-[24px] bg-[var(--surface-alt)] p-5">
              <p class="text-sm leading-6 text-[var(--muted)]">
                Merchant and admin accounts can browse the catalog, but inquiries are reserved for shopper accounts.
              </p>
            </div>

            <div v-else class="mt-6 space-y-4">
              <label class="field-label">
                Your message
                <textarea
                  v-model="inquiry.message"
                  class="textarea-field"
                  placeholder="Ask about availability, delivery, colors, sizing, or anything else that helps you decide."
                />
              </label>

              <p v-if="error" class="error-text">{{ error }}</p>
              <p v-if="success" class="success-text">{{ success }}</p>

              <button class="btn-primary" type="button" @click="submitInquiry">Send inquiry</button>
            </div>
          </section>
        </aside>
      </section>

      <section v-if="relatedProducts.length" class="mt-8">
        <div class="mb-5">
          <p class="section-eyebrow">More from this seller</p>
          <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
            Related products from {{ merchant.businessName }}
          </h2>
        </div>

        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <ProductCard v-for="item in relatedProducts" :key="item.id" :product="item" />
        </div>
      </section>

      <section v-if="preferredArea && areaMerchants.length" class="mt-8">
        <div class="mb-5">
          <p class="section-eyebrow">Other sellers in {{ preferredArea }}</p>
          <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
            Compare listings from the same exact area
          </h2>
        </div>

      <div class="grid gap-5 md:grid-cols-3">
        <RouterLink
          v-for="merchantRecord in areaMerchants"
          :key="merchantRecord.id"
          :to="`/merchants/${merchantRecord.id}`"
          class="shell-panel px-5 py-5 transition hover:-translate-y-1"
        >
          <p class="font-heading text-2xl font-semibold tracking-tight text-[var(--text)]">
            {{ merchantRecord.businessName }}
          </p>
          <p class="mt-2 text-sm text-[var(--muted)]">{{ merchantRecord.location }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="chip chip-muted">{{ merchantRecord.category }}</span>
          </div>
        </RouterLink>
      </div>
    </section>
    </template>
  </AppShell>
</template>
