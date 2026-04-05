import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/LandingPage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/auth/RegisterPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/user',
      name: 'user-dashboard',
      component: () => import('@/pages/user/UserDashboardPage.vue'),
      meta: { requiresAuth: true, roles: ['user'] satisfies Role[] },
    },
    {
      path: '/products/:id',
      name: 'product-details',
      component: () => import('@/pages/user/ProductDetailsPage.vue'),
      meta: { requiresAuth: true, roles: ['user'] satisfies Role[] },
    },
    {
      path: '/merchants/:id',
      name: 'merchant-profile',
      component: () => import('@/pages/user/MerchantProfilePage.vue'),
      meta: { requiresAuth: true, roles: ['user'] satisfies Role[] },
    },
    {
      path: '/merchant',
      name: 'merchant-dashboard',
      component: () => import('@/pages/merchant/MerchantDashboardPage.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] satisfies Role[] },
    },
    {
      path: '/merchant/products/new',
      name: 'merchant-product-create',
      component: () => import('@/pages/merchant/ProductEditorPage.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] satisfies Role[] },
    },
    {
      path: '/merchant/products/:id/edit',
      name: 'merchant-product-edit',
      component: () => import('@/pages/merchant/ProductEditorPage.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] satisfies Role[] },
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('@/pages/admin/AdminDashboardPage.vue'),
      meta: { requiresAuth: true, roles: ['admin'] satisfies Role[] },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const requiresAuth = Boolean(to.meta.requiresAuth)
  const guestOnly = Boolean(to.meta.guestOnly)
  const allowedRoles = to.meta.roles as Role[] | undefined

  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (guestOnly && auth.isAuthenticated) {
    return redirectByRole(auth.role)
  }

  if (allowedRoles && auth.role && !allowedRoles.includes(auth.role)) {
    return redirectByRole(auth.role)
  }

  return true
})

function redirectByRole(role: Role | null) {
  if (role === 'merchant') {
    return { name: 'merchant-dashboard' }
  }

  if (role === 'admin') {
    return { name: 'admin-dashboard' }
  }

  return { name: 'user-dashboard' }
}

export default router
