<script setup lang="ts">
import { onMounted, ref } from 'vue'

import AppShell from '@/layouts/AppShell.vue'
import StatCard from '@/components/StatCard.vue'
import * as mockApi from '@/services/mockApi'
import type { MerchantRecord, UserRecord } from '@/types'

const summary = ref<{
  totalUsers: number
  totalMerchants: number
  verifiedMerchants: number
  totalProducts: number
  totalInquiries: number
  latestMerchants: MerchantRecord[]
} | null>(null)

const users = ref<UserRecord[]>([])

onMounted(async () => {
  const [summaryResponse, userRecords] = await Promise.all([
    mockApi.fetchAdminSummary(),
    mockApi.fetchUsersByRole(),
  ])

  summary.value = summaryResponse
  users.value = userRecords
})
</script>

<template>
  <AppShell>
    <section class="page-header">
      <div>
        <p class="eyebrow">Admin workspace</p>
        <h1 class="page-title">Monitor ecosystem growth and merchant participation.</h1>
        <p class="page-copy">
          The admin side is lighter in this MVP. It demonstrates role separation and a platform-level view of users, merchants, products, and inquiries.
        </p>
      </div>
    </section>

    <section v-if="summary" class="stats-grid" style="margin-bottom: 24px">
      <StatCard label="Users" :value="summary.totalUsers" detail="Customer accounts in the mock database." />
      <StatCard
        label="Merchants"
        :value="summary.totalMerchants"
        detail="Businesses currently linked to the platform."
      />
      <StatCard
        label="Products"
        :value="summary.totalProducts"
        detail="Listings visible or manageable in the system."
      />
      <StatCard
        label="Inquiries"
        :value="summary.totalInquiries"
        detail="Messages sent from customers to merchants."
      />
    </section>

    <section class="split">
      <article class="panel" style="padding: 22px">
        <div class="page-header" style="margin-bottom: 14px">
          <div>
            <p class="eyebrow">User and role overview</p>
            <h2 style="margin: 0">Current accounts</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role }}</td>
                <td>{{ user.location || 'Not set' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <aside class="stack">
        <section class="panel" style="padding: 22px">
          <p class="eyebrow">Merchant activity</p>
          <div v-if="summary" class="stack">
            <div v-for="merchant in summary.latestMerchants" :key="merchant.id" class="content-card">
              <div class="inline" style="justify-content: space-between">
                <strong>{{ merchant.businessName }}</strong>
                <span class="tag">{{ merchant.verified ? 'Verified' : 'Pending' }}</span>
              </div>
              <p class="muted" style="margin: 8px 0 0">{{ merchant.location }}</p>
            </div>
          </div>
        </section>

        <section v-if="summary" class="panel" style="padding: 22px">
          <p class="eyebrow">Platform health</p>
          <div class="stack">
            <div class="content-card">
              <strong>Verified merchants</strong>
              <p class="muted" style="margin: 8px 0 0">
                {{ summary.verifiedMerchants }} of {{ summary.totalMerchants }} merchants have approved status.
              </p>
            </div>
            <div class="content-card">
              <strong>Inquiry conversion signal</strong>
              <p class="muted" style="margin: 8px 0 0">
                {{ summary.totalInquiries }} discovery-driven inquiries have been created in the mock environment.
              </p>
            </div>
          </div>
        </section>
      </aside>
    </section>
  </AppShell>
</template>
