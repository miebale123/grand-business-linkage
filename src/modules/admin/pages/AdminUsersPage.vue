<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as api from '@/shared/api/api'
import AdminShell from '@/shared/layouts/AdminShell.vue'
import type { Role, UserRecord } from '@/shared/types'

type RoleFilter = 'all' | Role

const loading = ref(true)
const users = ref<UserRecord[]>([])
const activeFilter = ref<RoleFilter>('all')

const roleOptions: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All users' },
  { value: 'admin', label: 'Admins' },
  { value: 'merchant', label: 'Merchants' },
  { value: 'user', label: 'Shoppers' },
]

const statusCounts = computed(() => {
  const counts = { all: users.value.length, admin: 0, merchant: 0, user: 0 }
  users.value.forEach((user) => {
    if (user.role in counts) {
      counts[user.role as Role]++
    }
  })
  return counts
})

const filteredUsers = computed(() => {
  if (activeFilter.value === 'all') {
    return users.value
  }
  return users.value.filter((user) => user.role === activeFilter.value)
})

async function refresh() {
  loading.value = true
  users.value = await api.fetchUsersByRole()
  loading.value = false
}

function setFilter(filter: RoleFilter) {
  activeFilter.value = filter
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
              <h1 class="page-title">User management</h1>
              <p class="page-copy">View and manage all accounts across the platform.</p>
            </div>
            <button class="button" type="button" @click="refresh">Refresh</button>
          </div>
        </section>

        <section class="filter-bar">
          <div class="filter-group">
            <button
              v-for="option in roleOptions"
              :key="option.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': activeFilter === option.value }"
              type="button"
              @click="setFilter(option.value)"
            >
              {{ option.label }}
              <span class="filter-chip__count">{{ statusCounts[option.value] }}</span>
            </button>
          </div>
        </section>

        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Accounts</p>
              <h2 class="section-title">
                {{ roleOptions.find((o) => o.value === activeFilter)?.label }}
              </h2>
            </div>
            <p class="section-copy-sm">
              {{ filteredUsers.length }} account{{ filteredUsers.length === 1 ? '' : 's' }}
            </p>
          </div>

          <div v-if="loading" class="empty-panel">Loading users...</div>
          <div v-else-if="filteredUsers.length" class="users-table">
            <article v-for="user in filteredUsers" :key="user.id" class="user-row">
              <div class="user-row__avatar">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div class="user-row__info">
                <p class="user-row__name">{{ user.name }}</p>
                <p class="user-row__meta">{{ user.email }}</p>
              </div>
              <div class="user-row__details">
                <span v-if="user.businessName" class="user-row__detail">
                  {{ user.businessName }}
                </span>
                <span v-if="user.location" class="user-row__detail">
                  {{ user.location }}
                </span>
                <span v-if="user.phone" class="user-row__detail">
                  {{ user.phone }}
                </span>
              </div>
              <div class="user-row__role">
                <span
                  class="status-pill"
                  :class="{
                    'status-pill--admin': user.role === 'admin',
                    'status-pill--merchant': user.role === 'merchant',
                    'status-pill--shopper': user.role === 'user',
                  }"
                >
                  {{ user.role }}
                </span>
              </div>
            </article>
          </div>
          <div v-else class="empty-panel">
            <p>No {{ activeFilter === 'all' ? '' : activeFilter }} users found.</p>
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

.filter-bar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-chip:hover {
  background: rgba(255, 255, 255, 0.92);
  border-color: var(--text);
  color: var(--text);
}

.filter-chip--active {
  background: var(--text);
  border-color: var(--text);
  color: white;
}

.filter-chip--active:hover {
  background: var(--text);
  color: white;
}

.filter-chip__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.1);
  font-size: 0.75rem;
  font-weight: 700;
}

.filter-chip--active .filter-chip__count {
  background: rgba(255, 255, 255, 0.2);
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

.users-table {
  display: grid;
  gap: 0.75rem;
}

.user-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 1rem;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  padding: 1rem 1.1rem;
}

.user-row__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--text);
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
}

.user-row__name {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--text);
}

.user-row__meta {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: var(--muted);
}

.user-row__details {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.user-row__detail {
  font-size: 0.85rem;
  color: var(--muted);
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

.status-pill--admin {
  background: rgba(190, 24, 93, 0.12);
  color: #be185d;
}

.status-pill--merchant {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.status-pill--shopper {
  background: rgba(15, 23, 42, 0.06);
  color: var(--muted);
}

@media (max-width: 900px) {
  .user-row {
    grid-template-columns: auto 1fr;
    gap: 0.75rem;
  }

  .user-row__details {
    grid-column: 1 / -1;
  }

  .user-row__role {
    grid-column: 2 / -1;
    justify-self: start;
  }
}
</style>
