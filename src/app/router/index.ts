import { createRouter, createWebHistory } from 'vue-router'

import { routePaths } from '@/app/router/paths'
import { useAuthStore } from '@/modules/auth'
import { getAccessRedirect } from '@/modules/auth/access.redirects'
import { canAccess } from '@/modules/auth/access.guards'
import { accessPresets } from '@/modules/auth/access.presets'
import type { AccessRequirement } from '@/modules/auth/access.types'
import type { Role } from '@/shared/types'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: routePaths.home,
      name: 'home',
      component: () => import('@/modules/marketplace/pages/HeroPage.vue'),
    },
    {
      path: routePaths.buy,
      name: 'buy',
      component: () => import('@/modules/marketplace/pages/BuyPage.vue'),
    },
    {
      path: routePaths.rent,
      name: 'rent',
      component: () => import('@/modules/marketplace/pages/BuyPage.vue'),
    },
    {
      path: routePaths.login,
      name: 'login',
      component: () => import('@/modules/auth/pages/LoginPage.vue'),
      meta: accessPresets.guestOnly,
    },
    {
      path: routePaths.register,
      name: 'register',
      component: () => import('@/modules/auth/pages/RegisterPage.vue'),
      meta: accessPresets.guestOnly,
    },
    {
      path: routePaths.merchantSignup,
      name: 'merchant-signup',
      component: () => import('@/modules/auth/pages/MerchantSignupPage.vue'),
      meta: accessPresets.guestOnly,
    },
    {
      path: routePaths.favorites,
      name: 'favorites',
      component: () => import('@/modules/marketplace/pages/FavoritesPage.vue'),
    },
    {
      path: routePaths.productDetails,
      name: 'product-details',
      component: () => import('@/modules/marketplace/pages/ProductDetailsPage.vue'),
    },
    {
      path: routePaths.merchantProfile,
      name: 'merchant-profile',
      component: () => import('@/modules/marketplace/pages/MerchantProfilePage.vue'),
    },
    {
      path: routePaths.merchantDashboard,
      name: 'merchant-dashboard',
      component: () => import('@/modules/merchant/pages/MerchantDashboardPage.vue'),
      meta: accessPresets.merchantWorkspace,
    },
    {
      path: routePaths.merchantProductCreate,
      name: 'merchant-product-create',
      component: () => import('@/modules/merchant/pages/ProductEditorPage.vue'),
      meta: accessPresets.merchantCatalogWrite,
    },
    {
      path: routePaths.merchantProductEdit,
      name: 'merchant-product-edit',
      component: () => import('@/modules/merchant/pages/ProductEditorPage.vue'),
      meta: accessPresets.merchantCatalogWrite,
    },
    {
      path: routePaths.adminDashboard,
      name: 'admin-overview',
      component: () => import('@/modules/admin/pages/AdminMerchantsPage.vue'),
      meta: accessPresets.adminConsole,
    },
    {
      path: routePaths.adminBasicMerchants,
      name: 'admin-basic-merchants',
      component: () => import('@/modules/admin/pages/AdminMerchantsPage.vue'),
      meta: accessPresets.adminConsole,
    },
    {
      path: routePaths.adminVerifiedMerchants,
      name: 'admin-verified-merchants',
      component: () => import('@/modules/admin/pages/AdminMerchantsPage.vue'),
      meta: accessPresets.adminConsole,
    },
    {
      path: routePaths.adminProducts,
      name: 'admin-products',
      component: () => import('@/modules/admin/pages/AdminMerchantsPage.vue'),
      meta: accessPresets.adminConsole,
    },
    {
      path: routePaths.merchantVerificationUpgrade,
      name: 'merchant-verification-upgrade',
      component: () => import('@/modules/auth/pages/MerchantSignupPage.vue'),
      meta: accessPresets.merchantCatalogWrite,
    },
  ],
})

function resolveRoles(value: unknown): Role[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.filter(
    (role): role is Role =>
      role === 'user' || role === 'merchant' || role === 'basic_merchant' || role === 'admin',
  )
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
