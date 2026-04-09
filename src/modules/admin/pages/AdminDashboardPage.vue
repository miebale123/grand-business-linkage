<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as api from '@/shared/api/api'
import AppShell from '@/shared/layouts/AppShell.vue'
import type {
  AdminDashboardAnalytics,
  AdminInsights,
  AnalyticsChart,
} from '@/shared/types'
import AnalyticsChartCard from '@/shared/ui/AnalyticsChartCard.vue'
import StatCard from '@/shared/ui/StatCard.vue'

const insights = ref<AdminInsights | null>(null)
const analytics = ref<AdminDashboardAnalytics | null>(null)
const loading = ref(true)
const emptyChart: AnalyticsChart = {
  labels: [],
  series: [],
}

const productById = computed(() =>
  (insights.value?.demandProducts ?? []).reduce<Record<string, string>>((map, entry) => {
    map[entry.product.id] = entry.product.name
    return map
  }, {}),
)

const executiveMetrics = computed(() => insights.value?.executiveMetrics ?? [])
const stockHealth = computed(() => insights.value?.stockHealth ?? [])
const demandMetrics = computed(() => insights.value?.demandMetrics ?? [])
const recentInquiries = computed(() => insights.value?.recentInquiries ?? [])
const merchantPerformance = computed(() => insights.value?.merchantPerformance ?? [])
const areaPerformance = computed(() => insights.value?.areaPerformance ?? [])
const demandProducts = computed(() => insights.value?.demandProducts ?? [])
const categoryMix = computed(() => insights.value?.categoryMix ?? [])
const pendingMerchants = computed(() => insights.value?.pendingMerchants ?? [])
const latestAccounts = computed(() => insights.value?.latestAccounts ?? [])
const topArea = computed(() => insights.value?.topArea ?? null)
const topCategory = computed(() => insights.value?.topCategory ?? null)
const stockCounts = computed(() => insights.value?.stockCounts ?? { inStock: 0, lowStock: 0, outOfStock: 0, featured: 0 })
const merchantDemandRate = computed(() => insights.value?.merchantDemandRate ?? 0)
const uniqueMerchantsWithInquiries = computed(() => insights.value?.uniqueMerchantsWithInquiries ?? 0)
const totalProducts = computed(() => merchantPerformance.value.reduce((total, entry) => total + entry.listingCount, 0))
const totalAreas = computed(() => areaPerformance.value.length)
const marketplaceMomentumChart = computed(() => analytics.value?.marketplaceMomentum ?? emptyChart)
const supplyReadinessChart = computed(() => analytics.value?.supplyReadiness ?? emptyChart)

onMounted(async () => {
  const [adminInsights, adminAnalytics] = await Promise.all([
    api.fetchAdminInsights(),
    api.fetchAdminDashboardAnalytics(),
  ])

  insights.value = adminInsights
  analytics.value = adminAnalytics
  loading.value = false
})
</script>

<template>
  <AppShell>
    <section class="shell-panel px-6 py-7 sm:px-8">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div>
          <p class="section-eyebrow">Admin console</p>
          <h1 class="section-title">Run the marketplace from real operating signals.</h1>
          <p class="section-copy max-w-3xl">
            This view is built around marketplace health, supply quality, buyer demand, and geographic coverage.
            The goal is to tell an operator where the platform is strong, where it is fragile, and what needs action next.
          </p>

          <div class="mt-5 flex flex-wrap gap-3">
            <span class="chip !px-4 !py-2">
              Top area · {{ topArea ? `${topArea.area} (${topArea.productCount} listings)` : 'No data' }}
            </span>
            <span class="chip !px-4 !py-2">
              Top category · {{ topCategory ? `${topCategory.category} (${topCategory.count})` : 'No data' }}
            </span>
            <span class="chip !px-4 !py-2">
              Avg listings / merchant · {{ demandMetrics[3]?.value ?? '0.0' }}
            </span>
            <span class="chip !px-4 !py-2">
              Merchant demand reach · {{ merchantDemandRate }}%
            </span>
          </div>
        </div>

        <div class="rounded-[28px] bg-[var(--surface-alt)] p-5">
          <p class="text-sm font-semibold text-[var(--text)]">Action queue</p>
          <div class="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
            <p>
              {{ pendingMerchants.length }} merchant{{ pendingMerchants.length === 1 ? '' : 's' }}
              waiting for verification review.
            </p>
            <p>
              {{ stockCounts.outOfStock }} out-of-stock listing{{ stockCounts.outOfStock === 1 ? '' : 's' }}
              reducing catalog quality right now.
            </p>
            <p>
              {{ uniqueMerchantsWithInquiries }} merchant{{ uniqueMerchantsWithInquiries === 1 ? '' : 's' }}
              have active shopper demand.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section v-if="loading" class="empty-panel mt-8">Loading admin overview...</section>

    <template v-else>
      <section class="stats-grid mt-8">
        <StatCard
          v-for="metric in executiveMetrics"
          :key="metric.label"
          :label="metric.label"
          :value="metric.value"
          :detail="metric.detail"
        />
      </section>

      <section class="mt-8 grid gap-8 xl:grid-cols-2">
        <AnalyticsChartCard
          title="Marketplace momentum"
          subtitle="Reach versus inquiry demand over the last 6 weeks"
          :labels="marketplaceMomentumChart.labels"
          :series="marketplaceMomentumChart.series"
          variant="area"
        />
        <AnalyticsChartCard
          title="Supply readiness"
          subtitle="Live listings and verified merchants by week"
          :labels="supplyReadinessChart.labels"
          :series="supplyReadinessChart.series"
          variant="line"
        />
      </section>

      <section class="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <article class="shell-panel px-6 py-7">
          <div class="mb-5">
            <p class="section-eyebrow">Marketplace health</p>
            <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
              Supply quality and catalog resilience
            </h2>
          </div>

          <div class="space-y-5">
            <div
              v-for="item in stockHealth"
              :key="item.label"
              class="rounded-[26px] bg-[var(--surface-alt)] p-5"
            >
              <div class="flex items-center justify-between gap-4">
                <p class="text-sm font-semibold text-[var(--text)]">{{ item.label }}</p>
                <p class="text-sm font-medium text-[var(--muted)]">
                  {{ item.count }} listings · {{ item.percent }}%
                </p>
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                <div class="h-full rounded-full" :style="{ width: `${item.percent}%`, backgroundColor: item.tone }" />
              </div>
              <p class="mt-3 text-sm leading-6 text-[var(--muted)]">{{ item.detail }}</p>
            </div>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-3">
            <div class="rounded-[24px] bg-[var(--surface-alt)] p-4">
              <p class="text-sm font-semibold text-[var(--text)]">Featured share</p>
              <p class="mt-3 font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
                {{ totalProducts ? Math.round((stockCounts.featured / totalProducts) * 100) : 0 }}%
              </p>
              <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
                {{ stockCounts.featured }} listings are currently pushed harder in discovery.
              </p>
            </div>

            <div class="rounded-[24px] bg-[var(--surface-alt)] p-4">
              <p class="text-sm font-semibold text-[var(--text)]">Area coverage</p>
              <p class="mt-3 font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
                {{ totalAreas }}
              </p>
              <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
                Active neighborhood clusters with live merchant supply.
              </p>
            </div>

            <div class="rounded-[24px] bg-[var(--surface-alt)] p-4">
              <p class="text-sm font-semibold text-[var(--text)]">Verification backlog</p>
              <p class="mt-3 font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
                {{ pendingMerchants.length }}
              </p>
              <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
                Merchant profile{{ pendingMerchants.length === 1 ? '' : 's' }} still waiting for trust review.
              </p>
            </div>
          </div>
        </article>

        <aside class="shell-panel px-6 py-7">
          <div class="mb-5">
            <p class="section-eyebrow">Demand signals</p>
            <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
              Where buyer intent is showing up
            </h2>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div
              v-for="metric in demandMetrics"
              :key="metric.label"
              class="rounded-[24px] bg-[var(--surface-alt)] p-4"
            >
              <p class="text-sm font-semibold text-[var(--text)]">{{ metric.label }}</p>
              <p class="mt-3 font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
                {{ metric.value }}
              </p>
              <p class="mt-2 text-sm leading-6 text-[var(--muted)]">{{ metric.detail }}</p>
            </div>
          </div>

          <div class="mt-6">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Recent inquiries
            </p>
            <div class="mt-4 space-y-3">
              <article
                v-for="inquiry in recentInquiries"
                :key="inquiry.id"
                class="rounded-[24px] bg-[var(--surface-alt)] p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-[var(--text)]">{{ inquiry.customerName }}</p>
                    <p class="mt-1 text-sm text-[var(--muted)]">
                      {{ productById[inquiry.productId] || 'Product inquiry' }}
                    </p>
                  </div>
                  <span class="text-xs font-medium text-[var(--muted)]">
                    {{ new Date(inquiry.createdAt).toLocaleDateString() }}
                  </span>
                </div>
                <p class="mt-3 text-sm leading-6 text-[var(--muted)]">{{ inquiry.message }}</p>
              </article>
            </div>
          </div>
        </aside>
      </section>

      <section class="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <article class="shell-panel px-6 py-7">
          <div class="mb-5">
            <p class="section-eyebrow">Merchant performance</p>
            <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
              Top merchants by demand and catalog strength
            </h2>
          </div>

          <div class="table-shell">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Area</th>
                  <th>Listings</th>
                  <th>Inquiries</th>
                  <th>In Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in merchantPerformance" :key="entry.merchant.id">
                  <td>
                    <div class="space-y-1">
                      <div class="font-medium text-[var(--text)]">{{ entry.merchant.businessName }}</div>
                      <div class="text-sm text-[var(--muted)]">{{ entry.merchant.category }}</div>
                    </div>
                  </td>
                  <td>{{ entry.merchant.area }}</td>
                  <td>{{ entry.listingCount }}</td>
                  <td>{{ entry.inquiryCount }}</td>
                  <td>{{ entry.inStockCount }}</td>
                  <td>{{ entry.merchant.verified ? 'Verified' : 'Pending' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <aside class="shell-panel px-6 py-7">
          <div class="mb-5">
            <p class="section-eyebrow">Area performance</p>
            <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
              Coverage and demand by area
            </h2>
          </div>

          <div class="space-y-4">
            <article
              v-for="area in areaPerformance.slice(0, 5)"
              :key="area.area"
              class="rounded-[24px] bg-[var(--surface-alt)] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-[var(--text)]">{{ area.area }}</p>
                  <p class="mt-1 text-sm text-[var(--muted)]">{{ area.city }}</p>
                </div>
                <span class="chip chip-good">{{ area.demandRate }}% demand rate</span>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <span class="chip !px-4 !py-2">Merchants · {{ area.merchantCount }}</span>
                <span class="chip !px-4 !py-2">Listings · {{ area.productCount }}</span>
                <span class="chip !px-4 !py-2">Inquiries · {{ area.inquiryCount }}</span>
                <span class="chip !px-4 !py-2">Verified · {{ area.verificationRate }}%</span>
              </div>
            </article>
          </div>
        </aside>
      </section>

      <section class="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article class="shell-panel px-6 py-7">
          <div class="mb-5">
            <p class="section-eyebrow">Demand leaders</p>
            <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
              Products generating the strongest shopper interest
            </h2>
          </div>

          <div class="table-shell">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Inquiries</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in demandProducts" :key="entry.product.id">
                  <td>{{ entry.product.name }}</td>
                  <td>{{ entry.merchant?.businessName || 'Unknown merchant' }}</td>
                  <td>{{ entry.product.category }}</td>
                  <td>{{ entry.inquiryCount }}</td>
                  <td>{{ entry.product.availability }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <span v-for="category in categoryMix" :key="category.category" class="chip !px-4 !py-2">
              {{ category.category }} · {{ category.share }}%
            </span>
          </div>
        </article>

        <aside class="space-y-6">
          <section class="shell-panel px-6 py-7">
            <div class="mb-5">
              <p class="section-eyebrow">Governance queue</p>
              <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
                Merchants needing attention
              </h2>
            </div>

            <div v-if="pendingMerchants.length" class="space-y-3">
              <article
                v-for="merchant in pendingMerchants"
                :key="merchant.id"
                class="rounded-[24px] bg-[var(--surface-alt)] p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-[var(--text)]">{{ merchant.businessName }}</p>
                    <p class="mt-1 text-sm text-[var(--muted)]">{{ merchant.location }}</p>
                  </div>
                  <span class="chip chip-muted">Pending</span>
                </div>
                <p class="mt-3 text-sm leading-6 text-[var(--muted)]">{{ merchant.description }}</p>
              </article>
            </div>
            <div v-else class="empty-panel">No merchants are waiting for review.</div>
          </section>

          <section class="shell-panel px-6 py-7">
            <div class="mb-5">
              <p class="section-eyebrow">Recent accounts</p>
              <h2 class="font-heading text-3xl font-semibold tracking-tight text-[var(--text)]">
                Latest platform signups
              </h2>
            </div>

            <div class="space-y-3">
              <article
                v-for="user in latestAccounts"
                :key="user.id"
                class="rounded-[24px] bg-[var(--surface-alt)] p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-[var(--text)]">{{ user.name }}</p>
                    <p class="mt-1 text-sm text-[var(--muted)]">{{ user.email }}</p>
                  </div>
                  <span class="chip !px-4 !py-2">{{ user.role }}</span>
                </div>
                <p class="mt-3 text-sm text-[var(--muted)]">{{ user.location || 'Location not set' }}</p>
              </article>
            </div>
          </section>
        </aside>
      </section>
    </template>
  </AppShell>
</template>
