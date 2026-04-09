import { createRouter, createWebHistory } from 'vue-router'

import { canAccess } from '@/modules/auth/access.guards'
import { accessPresets } from '@/modules/auth/access.presets'
import { getAccessRedirect } from '@/modules/auth/access.redirects'
import type { AccessRequirement } from '@/modules/auth/access.types'
import { useAuthStore } from '@/modules/auth'
import type { Role } from '@/shared/types'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/modules/marketplace/pages/LandingPage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/auth/pages/LoginPage.vue'),
      meta: accessPresets.guestOnly,
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/modules/auth/pages/RegisterPage.vue'),
      meta: accessPresets.guestOnly,
    },
    {
      path: '/merchant-signup',
      name: 'merchant-signup',
      component: () => import('@/modules/auth/pages/MerchantSignupPage.vue'),
      meta: accessPresets.guestOnly,
    },
    {
      path: '/marketplace',
      name: 'user-dashboard',
      component: () => import('@/modules/marketplace/pages/UserDashboardPage.vue'),
      alias: '/user',
    },
    {
      path: '/products/:id',
      name: 'product-details',
      component: () => import('@/modules/marketplace/pages/ProductDetailsPage.vue'),
    },
    {
      path: '/merchants/:id',
      name: 'merchant-profile',
      component: () => import('@/modules/marketplace/pages/MerchantProfilePage.vue'),
    },
    {
      path: '/merchant',
      name: 'merchant-dashboard',
      component: () => import('@/modules/merchant/pages/MerchantDashboardPage.vue'),
      meta: accessPresets.merchantWorkspace,
    },
    {
      path: '/merchant/products/new',
      name: 'merchant-product-create',
      component: () => import('@/modules/merchant/pages/ProductEditorPage.vue'),
      meta: accessPresets.merchantCatalogWrite,
    },
    {
      path: '/merchant/products/:id/edit',
      name: 'merchant-product-edit',
      component: () => import('@/modules/merchant/pages/ProductEditorPage.vue'),
      meta: accessPresets.merchantCatalogWrite,
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('@/modules/admin/pages/AdminDashboardPage.vue'),
      meta: accessPresets.adminConsole,
    },
    {
      path: '/admin/merchants',
      name: 'admin-merchants',
      component: () => import('@/modules/admin/pages/AdminMerchantsPage.vue'),
      meta: accessPresets.adminConsole,
    },
    {
      path: '/admin/listings',
      name: 'admin-listings',
      component: () => import('@/modules/admin/pages/AdminListingsPage.vue'),
      meta: accessPresets.adminConsole,
    },
    {
      path: '/admin/inquiries',
      name: 'admin-inquiries',
      component: () => import('@/modules/admin/pages/AdminInquiriesPage.vue'),
      meta: accessPresets.adminConsole,
    },
    {
      path: '/admin/settings',
      name: 'admin-settings',
      component: () => import('@/modules/admin/pages/AdminSettingsPage.vue'),
      meta: accessPresets.adminConsole,
    },
  ],
})

function resolveRoles(value: unknown): Role[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.filter((role): role is Role => role === 'user' || role === 'merchant' || role === 'admin')
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.hydrate()
  const access: AccessRequirement = {
    guestOnly: to.meta.guestOnly === true,
    requiresAuth: to.meta.requiresAuth === true,
    roles: resolveRoles(to.meta.roles),
  }

  if (canAccess(auth.user, access)) {
    return true
  }

  return getAccessRedirect(auth.user, to.fullPath, access)
})

export default router
