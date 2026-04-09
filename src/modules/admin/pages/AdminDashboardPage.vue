<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as api from '@/shared/api/api'
import AdminShell from '@/shared/layouts/AdminShell.vue'
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
  <AdminShell>
    <div class="shell">
      <div class="container">
        <header class="panel shell-header">
          <p class="eyebrow">Admin console</p>
          <h1 class="page-title">Run the marketplace from real operating signals.</h1>
          <p class="page-copy">
            Track supply health, buyer demand, and the merchants that need attention next.
          </p>

          <div class="inline" style="margin-top: 14px">
            <span class="tag">
              Top area · {{ topArea ? `${topArea.area} (${topArea.productCount} listings)` : 'No data' }}
            </span>
            <span class="tag">
              Top category · {{ topCategory ? `${topCategory.category} (${topCategory.count})` : 'No data' }}
            </span>
            <span class="tag">
              Avg listings / merchant · {{ demandMetrics[3]?.value ?? '0.0' }}
            </span>
            <span class="tag">
              Merchant demand reach · {{ merchantDemandRate }}%
            </span>
          </div>
        </header>

        <section v-if="loading" class="empty-state" style="margin-top: 18px">
          Loading admin overview...
        </section>

        <template v-else>
          <section class="stats-grid" style="margin-top: 18px">
            <StatCard
              v-for="metric in executiveMetrics"
              :key="metric.label"
              :label="metric.label"
              :value="metric.value"
              :detail="metric.detail"
            />
          </section>

          <section class="split" style="margin-top: 18px">
            <AnalyticsChartCard
              title="Marketplace momentum"
              subtitle="Reach versus inquiry demand (last 6 weeks)"
              :labels="marketplaceMomentumChart.labels"
              :series="marketplaceMomentumChart.series"
              variant="area"
            />
            <AnalyticsChartCard
              title="Supply readiness"
              subtitle="Listings and verified merchants (last 6 weeks)"
              :labels="supplyReadinessChart.labels"
              :series="supplyReadinessChart.series"
              variant="line"
            />
          </section>

          <section class="split" style="margin-top: 18px">
            <article class="panel content-card">
              <div class="page-header">
                <div>
                  <p class="eyebrow">Merchant performance</p>
                  <h2 class="page-title" style="font-size: 1.75rem">Top merchants by demand</h2>
                  <p class="page-copy">Listings, inquiries, and catalog quality by seller.</p>
                </div>
              </div>

              <div class="table-wrap">
                <table class="table">
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
                        <div class="stack" style="gap: 4px">
                          <div style="font-weight: 700">{{ entry.merchant.businessName }}</div>
                          <div class="muted" style="font-size: 0.92rem">{{ entry.merchant.category }}</div>
                        </div>
                      </td>
                      <td>{{ entry.merchant.area }}</td>
                      <td>{{ entry.listingCount }}</td>
                      <td>{{ entry.inquiryCount }}</td>
                      <td>{{ entry.inStockCount }}</td>
                      <td>
                        <span class="tag" :class="entry.merchant.verified ? 'tag-good' : 'tag-muted'">
                          {{ entry.merchant.verified ? 'Verified' : 'Pending' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            <aside class="panel content-card">
              <div class="page-header">
                <div>
                  <p class="eyebrow">Action queue</p>
                  <h2 class="page-title" style="font-size: 1.75rem">What needs attention</h2>
                  <p class="page-copy">Verification and supply issues that block growth.</p>
                </div>
              </div>

              <div class="stack">
                <div class="content-card admin-mini-card">
                  <p style="margin: 0; font-weight: 700">Verification backlog</p>
                  <p class="muted" style="margin: 8px 0 0">
                    {{ pendingMerchants.length }} merchant{{ pendingMerchants.length === 1 ? '' : 's' }} waiting for review.
                  </p>
                </div>

                <div class="content-card admin-mini-card">
                  <p style="margin: 0; font-weight: 700">Out of stock</p>
                  <p class="muted" style="margin: 8px 0 0">
                    {{ stockCounts.outOfStock }} listing{{ stockCounts.outOfStock === 1 ? '' : 's' }} reducing catalog quality.
                  </p>
                </div>

                <div class="content-card admin-mini-card">
                  <p style="margin: 0; font-weight: 700">Active demand</p>
                  <p class="muted" style="margin: 8px 0 0">
                    {{ uniqueMerchantsWithInquiries }} merchant{{ uniqueMerchantsWithInquiries === 1 ? '' : 's' }} receiving inquiries.
                  </p>
                </div>

                <div v-if="pendingMerchants.length" class="stack">
                  <p class="eyebrow" style="margin-top: 6px">Pending merchants</p>
                  <article
                    v-for="merchant in pendingMerchants.slice(0, 4)"
                    :key="merchant.id"
                    class="content-card admin-mini-card"
                  >
                    <div class="inline" style="justify-content: space-between; width: 100%">
                      <div class="stack" style="gap: 4px">
                        <div style="font-weight: 700">{{ merchant.businessName }}</div>
                        <div class="muted" style="font-size: 0.92rem">{{ merchant.location }}</div>
                      </div>
                      <span class="tag tag-muted">Pending</span>
                    </div>
                    <p class="muted" style="margin: 10px 0 0">{{ merchant.description }}</p>
                  </article>
                </div>
              </div>
            </aside>
          </section>
        </template>
      </div>
    </div>
  </AdminShell>
</template>
