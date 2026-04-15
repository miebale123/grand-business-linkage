<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import * as api from '@/shared/api/api'
import AdminShell from '@/shared/layouts/AdminShell.vue'
import type { MerchantRecord, ProductRecord, ProductStatus } from '@/shared/types'

const loading = ref(true)
const pendingProducts = ref<ProductRecord[]>([])
const allProducts = ref<ProductRecord[]>([])
const merchants = ref<MerchantRecord[]>([])
const actioningId = ref('')

const merchantById = computed(() =>
  merchants.value.reduce<Record<string, MerchantRecord>>((map, merchant) => {
    map[merchant.id] = merchant
    return map
  }, {}),
)

const statusCounts = computed(() => ({
  pending: allProducts.value.filter((product) => product.status === 'pending').length,
  approved: allProducts.value.filter((product) => product.status === 'approved').length,
  rejected: allProducts.value.filter((product) => product.status === 'rejected').length,
}))

const recentlyModerated = computed(() =>
  allProducts.value.filter((product) => product.status !== 'pending').slice(0, 8),
)

async function refresh() {
  loading.value = true

  const [pendingRecords, productRecords, merchantRecords] = await Promise.all([
    api.fetchPendingProducts(),
    api.fetchProducts(),
    api.fetchMerchants(),
  ])

  pendingProducts.value = pendingRecords
  allProducts.value = productRecords
  merchants.value = merchantRecords
  loading.value = false
}

async function updateStatus(productId: string, status: ProductStatus) {
  actioningId.value = productId

  try {
    await api.updateProductStatus(productId, status)
    await refresh()
  } finally {
    actioningId.value = ''
  }
}

onMounted(refresh)
</script>

<template>
  <AdminShell>
    <div class="shell">
      <div class="container space-y-6">
        <section class="panel shell-header">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p class="eyebrow">Admin</p>
              <h1 class="page-title">Listing moderation</h1>
              <p class="page-copy">
                Review pending submissions, approve verified-quality listings, and reject low-trust
                catalog entries without leaving the admin workspace.
              </p>
            </div>

            <button class="button" type="button" @click="refresh">Refresh queue</button>
          </div>
        </section>

        <section class="stats-grid">
          <article class="panel stat-card">
            <p class="stat-card__label">Pending</p>
            <p class="stat-card__value">{{ statusCounts.pending }}</p>
          </article>
          <article class="panel stat-card">
            <p class="stat-card__label">Approved</p>
            <p class="stat-card__value">{{ statusCounts.approved }}</p>
          </article>
          <article class="panel stat-card">
            <p class="stat-card__label">Rejected</p>
            <p class="stat-card__value">{{ statusCounts.rejected }}</p>
          </article>
        </section>

        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Pending queue</p>
              <h2 class="section-title">Listings waiting for review</h2>
            </div>
            <p class="section-copy-sm">
              {{ pendingProducts.length }} submission{{ pendingProducts.length === 1 ? '' : 's' }}
            </p>
          </div>

          <div v-if="loading" class="empty-panel">Loading moderation queue...</div>
          <div v-else-if="pendingProducts.length" class="queue-grid">
            <article v-for="product in pendingProducts" :key="product.id" class="queue-card">
              <div class="queue-card__head">
                <div>
                  <p class="queue-card__title">{{ product.name }}</p>
                  <p class="queue-card__meta">
                    {{ merchantById[product.merchantId]?.businessName || 'Merchant' }} ·
                    {{ product.category }}
                  </p>
                </div>
                <span class="status-pill status-pill--pending">{{ product.status }}</span>
              </div>

              <p class="queue-card__copy">{{ product.shortDescription }}</p>

              <div class="queue-card__chips">
                <span class="status-pill status-pill--neutral">{{ product.condition }}</span>
                <span class="status-pill status-pill--neutral">{{ product.location }}</span>
                <span class="status-pill status-pill--neutral"
                  >ETB {{ product.price.toLocaleString() }}</span
                >
                <span
                  class="status-pill"
                  :class="
                    merchantById[product.merchantId]?.verified
                      ? 'status-pill--approved'
                      : 'status-pill--pending'
                  "
                >
                  {{
                    merchantById[product.merchantId]?.verified
                      ? 'Verified merchant'
                      : 'Unverified merchant'
                  }}
                </span>
              </div>

              <div class="queue-card__footer">
                <p class="queue-card__date">
                  Submitted {{ new Date(product.createdAt).toLocaleDateString() }}
                </p>
                <div class="queue-card__actions">
                  <button
                    class="button-secondary"
                    type="button"
                    :disabled="actioningId === product.id"
                    @click="updateStatus(product.id, 'rejected')"
                  >
                    Reject
                  </button>
                  <button
                    class="button"
                    type="button"
                    :disabled="actioningId === product.id"
                    @click="updateStatus(product.id, 'approved')"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="empty-panel">No pending listings right now.</div>
        </section>

        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Recent decisions</p>
              <h2 class="section-title">Recently moderated listings</h2>
            </div>
          </div>

          <div v-if="loading" class="empty-panel">Loading moderated listings...</div>
          <div v-else-if="recentlyModerated.length" class="moderated-table">
            <article v-for="product in recentlyModerated" :key="product.id" class="moderated-row">
              <div>
                <p class="moderated-row__title">{{ product.name }}</p>
                <p class="moderated-row__meta">
                  {{ merchantById[product.merchantId]?.businessName || 'Merchant' }} ·
                  {{ product.location }}
                </p>
              </div>
              <span
                class="status-pill"
                :class="
                  product.status === 'approved' ? 'status-pill--approved' : 'status-pill--rejected'
                "
              >
                {{ product.status }}
              </span>
            </article>
          </div>
          <div v-else class="empty-panel">No moderated listings yet.</div>
        </section>
      </div>
    </div>
  </AdminShell>
</template>

<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-card {
  padding: 1.25rem;
}

.stat-card__label {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.stat-card__value {
  margin: 0.5rem 0 0;
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.section-title {
  margin: 0.35rem 0 0;
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text);
}

.section-copy-sm {
  margin: 0;
  color: var(--muted);
}

.queue-grid {
  display: grid;
  gap: 1rem;
}

.queue-card {
  border: 1px solid var(--line);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  padding: 1.25rem;
}

.queue-card__head,
.queue-card__footer,
.moderated-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.queue-card__title,
.moderated-row__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text);
}

.queue-card__meta,
.queue-card__date,
.moderated-row__meta {
  margin: 0.3rem 0 0;
  font-size: 0.92rem;
  color: var(--muted);
}

.queue-card__copy {
  margin: 1rem 0 0;
  line-height: 1.6;
  color: var(--muted);
}

.queue-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}

.queue-card__footer {
  align-items: center;
  margin-top: 1.1rem;
}

.queue-card__actions {
  display: flex;
  gap: 0.75rem;
}

.moderated-table {
  display: grid;
  gap: 0.8rem;
}

.moderated-row {
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  padding: 1rem 1.1rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: capitalize;
}

.status-pill--pending {
  background: rgba(201, 105, 61, 0.15);
  color: #a85029;
}

.status-pill--approved {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.status-pill--rejected {
  background: rgba(190, 24, 93, 0.12);
  color: #be185d;
}

.status-pill--neutral {
  background: rgba(15, 23, 42, 0.06);
  color: var(--muted);
  text-transform: none;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section-head,
  .queue-card__head,
  .queue-card__footer,
  .moderated-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
