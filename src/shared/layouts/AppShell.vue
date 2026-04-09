<!-- <script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/modules/auth'

type NavLink = {
  label: string
  to: string
  names?: string[]
  prefixes?: string[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navLinks = computed<NavLink[]>(() => {
  if (authStore.user?.role === 'merchant') {
    return [
      { label: 'Home', to: '/', names: ['home'] },
      { label: 'Marketplace', to: '/marketplace', names: ['user-dashboard', 'product-details', 'merchant-profile'] },
      { label: 'Seller Hub', to: '/merchant', names: ['merchant-dashboard'], prefixes: ['merchant-product-'] },
      { label: 'New Listing', to: '/merchant/products/new', prefixes: ['merchant-product-'] },
    ]
  }

  if (authStore.user?.role === 'admin') {
    return [
      { label: 'Home', to: '/', names: ['home'] },
      { label: 'Marketplace', to: '/marketplace', names: ['user-dashboard', 'product-details', 'merchant-profile'] },
      { label: 'Admin', to: '/admin', names: ['admin-dashboard'] },
    ]
  }

  return [
    { label: 'Home', to: '/', names: ['home'] },
    { label: 'Marketplace', to: '/marketplace', names: ['user-dashboard', 'product-details', 'merchant-profile'] },
    { label: 'For Sellers', to: '/merchant-signup' },
  ]
})

const workspaceLabel = computed(() => {
  if (authStore.user?.role === 'merchant') {
    return 'Merchant workspace'
  }

  if (authStore.user?.role === 'admin') {
    return 'Admin control'
  }

  if (authStore.user?.role === 'user') {
    return 'Shopper account'
  }

  return 'Guest mode'
})

const dashboardPath = computed(() => {
  if (authStore.user?.role === 'merchant') {
    return '/merchant'
  }

  if (authStore.user?.role === 'admin') {
    return '/admin'
  }

  return '/marketplace'
})

function isLinkActive(link: NavLink) {
  const routeName = route.name?.toString() ?? ''

  if (link.names?.includes(routeName)) {
    return true
  }

  return link.prefixes?.some((prefix) => routeName.startsWith(prefix)) ?? false
}

async function logout() {
  authStore.logout()
  await router.push('/')
}
</script>

<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(246,241,232,0.86)] backdrop-blur-xl">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex min-w-0 items-center gap-4">
          <RouterLink to="/" class="flex min-w-0 items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-xs font-bold uppercase tracking-[0.28em] text-white">
              BL
            </div>
            <div class="min-w-0">
              <p class="font-heading truncate text-xl font-semibold tracking-tight">Business Linkage</p>
              <p class="truncate text-xs text-[var(--muted)]">
                Local products, trusted sellers, faster conversations
              </p>
            </div>
          </RouterLink>

          <span
            v-if="authStore.user"
            class="hidden rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold text-[var(--primary)] shadow-sm xl:inline-flex"
          >
            {{ workspaceLabel }}
          </span>
        </div>

        <nav class="hidden items-center gap-2 lg:flex">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="rounded-full px-4 py-2 text-sm font-medium transition"
            :class="
              isLinkActive(link)
                ? 'bg-[var(--text)] text-white shadow-sm'
                : 'text-[var(--muted)] hover:bg-white hover:text-[var(--text)]'
            "
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <div class="flex shrink-0 items-center gap-3">
          <template v-if="authStore.user">
            <RouterLink
              :to="dashboardPath"
              class="hidden rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm md:inline-flex"
            >
              {{ authStore.user.name.split(' ')[0] }}
            </RouterLink>
            <button class="btn-ghost !px-4 !py-2" type="button" @click="logout">Sign out</button>
          </template>

          <template v-else>
            <RouterLink class="btn-ghost !px-4 !py-2" to="/login">Sign in</RouterLink>
            <RouterLink class="btn-primary !px-4 !py-2" to="/register">Create account</RouterLink>
          </template>
        </div>
      </div>

      <div class="border-t border-[var(--line)] bg-white/70 lg:hidden">
        <div class="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          <RouterLink
            v-for="link in navLinks"
            :key="`mobile-${link.to}`"
            :to="link.to"
            class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
            :class="
              isLinkActive(link)
                ? 'bg-[var(--text)] text-white shadow-sm'
                : 'bg-white text-[var(--muted)] hover:text-[var(--text)]'
            "
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <slot />
    </main>

    <footer class="pb-10">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="shell-panel grid gap-8 px-6 py-8 md:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))] lg:px-8">
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-xs font-bold uppercase tracking-[0.28em] text-white">
                BL
              </div>
              <div>
                <p class="font-heading text-lg font-semibold">Business Linkage</p>
                <p class="text-sm text-[var(--muted)]">Built for local discovery</p>
              </div>
            </div>
            <p class="max-w-md text-sm leading-6 text-[var(--muted)]">
              A modern marketplace where shoppers compare real inventory, merchants stay visible,
              and platform teams can track activity without extra complexity.
            </p>
          </div>

          <div class="space-y-3">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Explore
            </p>
            <RouterLink class="footer-link" to="/">Home</RouterLink>
            <RouterLink class="footer-link" to="/marketplace">Marketplace</RouterLink>
            <RouterLink class="footer-link" to="/login?role=user">Shopper sign in</RouterLink>
          </div>

          <div class="space-y-3">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Business
            </p>
            <RouterLink class="footer-link" to="/merchant-signup">Become a seller</RouterLink>
            <RouterLink class="footer-link" to="/merchant">Seller hub</RouterLink>
            <RouterLink class="footer-link" to="/admin">Admin console</RouterLink>
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-3 px-2 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {{ new Date().getFullYear() }} Business Linkage. Designed for realistic local marketplace workflows.</p>
          <div class="flex items-center gap-4">
            <a href="#" class="footer-link">Privacy</a>
            <a href="#" class="footer-link">Terms</a>
            <a href="#" class="footer-link">Support</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template> -->



<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth'

type NavLink = {
  label: string
  to: string
  names?: string[]
  prefixes?: string[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isMobileSidebarOpen = ref(false)

// Global Top Navigation
const navLinks = computed<NavLink[]>(() => {
  if (authStore.user?.role === 'merchant') {
    return [
      { label: 'Home', to: '/', names: ['home'] },
      { label: 'Marketplace', to: '/marketplace', names: ['user-dashboard', 'product-details', 'merchant-profile'] },
      { label: 'Seller Hub', to: '/merchant', names: ['merchant-dashboard'], prefixes: ['merchant-product-'] },
      { label: 'New Listing', to: '/merchant/products/new', prefixes: ['merchant-product-'] },
    ]
  }

  if (authStore.user?.role === 'admin') {
    return [
      { label: 'Home', to: '/', names: ['home'] },
      { label: 'Marketplace', to: '/marketplace', names: ['user-dashboard', 'product-details', 'merchant-profile'] },
      { label: 'Admin', to: '/admin', names: ['admin-dashboard'] },
    ]
  }

  return [
    { label: 'Home', to: '/', names: ['home'] },
    { label: 'Marketplace', to: '/marketplace', names: ['user-dashboard', 'product-details', 'merchant-profile'] },
    { label: 'For Sellers', to: '/merchant-signup' },
  ]
})

// Admin Sidebar Navigation
const sidebarLinks = [
  { label: 'Overview', to: '/admin', exact: true },
  { label: 'Merchants', to: '/admin/merchants' },
  { label: 'Listings', to: '/admin/listings' },
  { label: 'Inquiries', to: '/admin/inquiries' },
  { label: 'Settings', to: '/admin/settings' },
]

const workspaceLabel = computed(() => {
  if (authStore.user?.role === 'merchant') return 'Merchant workspace'
  if (authStore.user?.role === 'admin') return 'Admin control'
  if (authStore.user?.role === 'user') return 'Shopper account'
  return 'Guest mode'
})

const dashboardPath = computed(() => {
  if (authStore.user?.role === 'merchant') return '/merchant'
  if (authStore.user?.role === 'admin') return '/admin'
  return '/marketplace'
})

function isLinkActive(link: NavLink) {
  const routeName = route.name?.toString() ?? ''
  if (link.names?.includes(routeName)) return true
  return link.prefixes?.some((prefix) => routeName.startsWith(prefix)) ?? false
}

async function logout() {
  authStore.logout()
  await router.push('/')
}
</script>

<template>
  <div class="flex h-screen w-full bg-[var(--surface)] font-sans text-[var(--text)] overflow-hidden">
    
    <div 
      v-if="isMobileSidebarOpen" 
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
      @click="isMobileSidebarOpen = false"
    ></div>

    <aside 
      v-if="authStore.user?.role === 'admin'"
      :class="[
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--line)] bg-[rgba(246,241,232,1)] transition-transform duration-300 lg:static lg:translate-x-0'
      ]"
    >
      <div class="flex h-[73px] items-center px-6 border-b border-[var(--line)] lg:hidden">
        <span class="font-heading text-lg font-semibold tracking-tight">Admin Menu</span>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <p class="mb-4 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Platform</p>
        <RouterLink 
          v-for="link in sidebarLinks" 
          :key="link.to" 
          :to="link.to"
          :class="[
            route.path === link.to 
              ? 'bg-[var(--text)] text-white shadow-sm' 
              : 'text-[var(--muted)] hover:bg-white hover:text-[var(--text)]',
            'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors'
          ]"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
      
      <header class="sticky top-0 z-30 shrink-0 border-b border-[var(--line)] bg-[rgba(246,241,232,0.86)] backdrop-blur-xl">
        <div class="flex h-[73px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          
          <div class="flex min-w-0 items-center gap-4">
            <button 
              v-if="authStore.user?.role === 'admin'"
              class="lg:hidden p-2 -ml-2 text-[var(--text)]"
              @click="isMobileSidebarOpen = true"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <RouterLink to="/" class="flex min-w-0 items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-xs font-bold uppercase tracking-[0.28em] text-white">
                BL
              </div>
              <div class="hidden min-w-0 sm:block">
                <p class="font-heading truncate text-lg font-semibold tracking-tight leading-tight">Business Linkage</p>
                <p class="truncate text-[10px] text-[var(--muted)] uppercase tracking-wider">
                  Admin Console
                </p>
              </div>
            </RouterLink>

            <span
              v-if="authStore.user"
              class="hidden rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold text-[var(--primary)] shadow-sm xl:inline-flex"
            >
              {{ workspaceLabel }}
            </span>
          </div>

          <nav class="hidden items-center gap-2 lg:flex">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="rounded-full px-4 py-2 text-sm font-medium transition"
              :class="
                isLinkActive(link)
                  ? 'bg-white text-[var(--text)] shadow-sm border border-[var(--line)]'
                  : 'text-[var(--muted)] hover:bg-white hover:text-[var(--text)]'
              "
            >
              {{ link.label }}
            </RouterLink>
          </nav>

          <div class="flex shrink-0 items-center gap-3">
            <template v-if="authStore.user">
              <RouterLink
                :to="dashboardPath"
                class="hidden rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm md:inline-flex"
              >
                {{ authStore.user.name.split(' ')[0] }}
              </RouterLink>
              <button class="btn-ghost !px-4 !py-2 text-sm" type="button" @click="logout">Sign out</button>
            </template>
            <template v-else>
              <RouterLink class="btn-ghost !px-4 !py-2 text-sm" to="/login">Sign in</RouterLink>
              <RouterLink class="btn-primary !px-4 !py-2 text-sm" to="/register">Create account</RouterLink>
            </template>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto relative scroll-smooth">
        <div class="flex min-h-full flex-col">
          
          <div class="flex-1 pb-16 w-full">
            <slot />
          </div>

          <footer class="mt-auto border-t border-[var(--line)] bg-[rgba(246,241,232,0.5)] pb-10 pt-8">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div class="shell-panel grid gap-8 px-6 py-8 md:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))] lg:px-8">
                <div class="space-y-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-xs font-bold uppercase tracking-[0.28em] text-white">
                      BL
                    </div>
                    <div>
                      <p class="font-heading text-lg font-semibold">Business Linkage</p>
                      <p class="text-sm text-[var(--muted)]">Built for local discovery</p>
                    </div>
                  </div>
                  <p class="max-w-md text-sm leading-6 text-[var(--muted)]">
                    A modern marketplace where shoppers compare real inventory, merchants stay visible,
                    and platform teams can track activity without extra complexity.
                  </p>
                </div>

                <div class="space-y-3">
                  <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Explore</p>
                  <RouterLink class="block text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors" to="/">Home</RouterLink>
                  <RouterLink class="block text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors" to="/marketplace">Marketplace</RouterLink>
                  <RouterLink class="block text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors" to="/login?role=user">Shopper sign in</RouterLink>
                </div>

                <div class="space-y-3">
                  <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Business</p>
                  <RouterLink class="block text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors" to="/merchant-signup">Become a seller</RouterLink>
                  <RouterLink class="block text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors" to="/merchant">Seller hub</RouterLink>
                  <RouterLink class="block text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors" to="/admin">Admin console</RouterLink>
                </div>
              </div>

              <div class="mt-4 flex flex-col gap-3 px-2 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                <p>© {{ new Date().getFullYear() }} Business Linkage. Designed for realistic local marketplace workflows.</p>
                <div class="flex items-center gap-4">
                  <a href="#" class="hover:text-[var(--text)] transition-colors">Privacy</a>
                  <a href="#" class="hover:text-[var(--text)] transition-colors">Terms</a>
                  <a href="#" class="hover:text-[var(--text)] transition-colors">Support</a>
                </div>
              </div>
            </div>
          </footer>

        </div>
      </main>

    </div>
  </div>
</template>