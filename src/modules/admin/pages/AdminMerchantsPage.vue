<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as api from '@/shared/api/api'
import AdminShell from '@/shared/layouts/AdminShell.vue'
import type { MerchantRecord, ProductRecord, UserRecord } from '@/shared/types'

const loading = ref(true)
const merchants = ref<MerchantRecord[]>([])
const products = ref<ProductRecord[]>([])
const users = ref<UserRecord[]>([])
const actioningId = ref('')

const pendingMerchants = computed(() => merchants.value.filter((merchant) => !merchant.verified))

const verifiedMerchants = computed(() => merchants.value.filter((merchant) => merchant.verified))

const statusCounts = computed(() => ({
  total: merchants.value.length,
  verified: verifiedMerchants.value.length,
  pending: pendingMerchants.value.length,
}))

const userById = computed(() =>
  users.value.reduce<Record<string, UserRecord>>((map, user) => {
    map[user.id] = user
    return map
  }, {}),
)

const productCountByMerchant = computed(() =>
  products.value.reduce<Record<string, number>>((map, product) => {
    map[product.merchantId] = (map[product.merchantId] || 0) + 1
    return map
  }, {}),
)

async function refresh() {
  loading.value = true
  const [merchantRecords, productRecords, userRecords] = await Promise.all([
    api.fetchMerchants(),
    api.fetchProducts(),
    api.fetchUsersByRole('merchant'),
  ])
  merchants.value = merchantRecords
  products.value = productRecords
  users.value = userRecords
  loading.value = false
}

async function updateVerification(merchantId: string, verified: boolean) {
  actioningId.value = merchantId
  try {
    await api.updateMerchantVerification(merchantId, verified)
    await refresh()
  } catch (error) {
    console.error('Failed to update verification:', error)
    alert('Failed to update merchant verification. Please try again.')
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
              <h1 class="page-title">Merchant management</h1>
              <p class="page-copy">
                Review merchant applications, verify trusted sellers, and manage marketplace trust
                controls.
              </p>
            </div>
            <button class="button" type="button" @click="refresh">Refresh</button>
          </div>
        </section>

        <section class="stats-grid">
          <article class="panel stat-card">
            <p class="stat-card__label">Total merchants</p>
            <p class="stat-card__value">{{ statusCounts.total }}</p>
          </article>
          <article class="panel stat-card">
            <p class="stat-card__label">Verified</p>
            <p class="stat-card__value stat-card__value--good">{{ statusCounts.verified }}</p>
          </article>
          <article class="panel stat-card">
            <p class="stat-card__label">Pending review</p>
            <p class="stat-card__value stat-card__value--warn">{{ statusCounts.pending }}</p>
          </article>
        </section>

        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Verification queue</p>
              <h2 class="section-title">Merchants awaiting review</h2>
            </div>
            <p class="section-copy-sm">
              {{ pendingMerchants.length }} application{{
                pendingMerchants.length === 1 ? '' : 's'
              }}
            </p>
          </div>

          <div v-if="loading" class="empty-panel">Loading verification queue...</div>
          <div v-else-if="pendingMerchants.length" class="queue-list">
            <article v-for="merchant in pendingMerchants" :key="merchant.id" class="queue-card">
              <div class="queue-card__head">
                <div>
                  <p class="queue-card__title">{{ merchant.businessName }}</p>
                  <p class="queue-card__meta">
                    {{ merchant.category }} · {{ merchant.area }}, {{ merchant.city }}
                  </p>
                </div>
                <span class="status-pill status-pill--pending">Pending review</span>
              </div>

              <p class="queue-card__copy">{{ merchant.description }}</p>

              <div class="queue-card__chips">
                <span class="status-pill status-pill--neutral">
                  {{ productCountByMerchant[merchant.id] || 0 }} listing{{
                    (productCountByMerchant[merchant.id] || 0) === 1 ? '' : 's'
                  }}
                </span>
                <span class="status-pill status-pill--neutral">
                  {{ merchant.deliveryAreas?.length || 0 }} delivery area{{
                    (merchant.deliveryAreas?.length || 0) === 1 ? '' : 's'
                  }}
                </span>
                <span v-if="userById[merchant.ownerId]" class="status-pill status-pill--neutral">
                  {{ userById[merchant.ownerId]?.name }}
                </span>
              </div>

              <div class="queue-card__footer">
                <p class="queue-card__date">Owner ID: {{ merchant.ownerId }}</p>
                <div class="queue-card__actions">
                  <button
                    class="button-ghost button-danger"
                    type="button"
                    :disabled="actioningId === merchant.id"
                    @click="updateVerification(merchant.id, false)"
                  >
                    Reject
                  </button>
                  <button
                    class="button"
                    type="button"
                    :disabled="actioningId === merchant.id"
                    @click="updateVerification(merchant.id, true)"
                  >
                    Approve & Verify
                  </button>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="empty-panel">
            <p>No pending merchant applications right now.</p>
          </div>
        </section>

        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Verified merchants</p>
              <h2 class="section-title">Trusted sellers on the platform</h2>
            </div>
            <p class="section-copy-sm">
              {{ verifiedMerchants.length }} verified merchant{{
                verifiedMerchants.length === 1 ? '' : 's'
              }}
            </p>
          </div>

          <div v-if="loading" class="empty-panel">Loading verified merchants...</div>
          <div v-else-if="verifiedMerchants.length" class="verified-table">
            <article v-for="merchant in verifiedMerchants" :key="merchant.id" class="verified-row">
              <div class="verified-row__info">
                <p class="verified-row__title">{{ merchant.businessName }}</p>
                <p class="verified-row__meta">
                  {{ merchant.category }} · {{ merchant.area }}, {{ merchant.city }}
                </p>
                <p class="verified-row__desc">{{ merchant.description }}</p>
              </div>
              <div class="verified-row__stats">
                <span class="verified-stat">
                  <span class="verified-stat__value">{{
                    productCountByMerchant[merchant.id] || 0
                  }}</span>
                  <span class="verified-stat__label">listings</span>
                </span>
              </div>
              <div class="verified-row__status">
                <span class="status-pill status-pill--approved">Verified</span>
              </div>
              <div class="verified-row__actions">
                <button
                  class="button-ghost button-sm"
                  type="button"
                  :disabled="actioningId === merchant.id"
                  @click="updateVerification(merchant.id, false)"
                >
                  Revoke
                </button>
              </div>
            </article>
          </div>
          <div v-else class="empty-panel">
            <p>No verified merchants yet.</p>
          </div>
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

.stat-card__value--good {
  color: #0f766e;
}

.stat-card__value--warn {
  color: #b37512;
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

.empty-panel {
  border: 1px dashed var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: var(--muted);
}

.queue-list {
  display: grid;
  gap: 1rem;
}

.queue-card {
  border: 1px solid var(--line);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  padding: 1.25rem;
}

.queue-card__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.queue-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text);
}

.queue-card__meta {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1.1rem;
}

.queue-card__date {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.queue-card__actions {
  display: flex;
  gap: 0.75rem;
}

.verified-table {
  display: grid;
  gap: 0.8rem;
}

.verified-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 1.5rem;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  padding: 1rem 1.1rem;
}

.verified-row__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--text);
}

.verified-row__meta {
  margin: 0.25rem 0 0;
  font-size: 0.88rem;
  color: var(--muted);
}

.verified-row__desc {
  margin: 0.5rem 0 0;
  font-size: 0.88rem;
  color: var(--muted);
  line-height: 1.5;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.verified-row__stats {
  display: flex;
  gap: 1rem;
}

.verified-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.verified-stat__value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text);
}

.verified-stat__label {
  font-size: 0.75rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.verified-row__actions {
  display: flex;
  gap: 0.5rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
}

.status-pill--pending {
  background: rgba(201, 105, 61, 0.15);
  color: #a85029;
}

.status-pill--approved {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.status-pill--neutral {
  background: rgba(15, 23, 42, 0.06);
  color: var(--muted);
  text-transform: none;
}

.button-danger {
  color: #be185d;
}

.button-danger:hover {
  background: rgba(190, 24, 93, 0.08);
}

.button-sm {
  padding: 0.5rem 0.85rem;
  font-size: 0.85rem;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section-head,
  .queue-card__head,
  .queue-card__footer,
  .verified-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .verified-row {
    grid-template-columns: 1fr;
  }

  .verified-row__stats,
  .verified-row__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
