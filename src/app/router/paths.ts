import type { RouteLocationRaw } from 'vue-router'

import type { Role, UserRecord } from '@/shared/types'

export const routePaths = {
  home: '/',
  login: '/login',
  register: '/register',
  merchantSignup: '/merchant-signup',
  userDashboard: '/marketplace',
  userDashboardAlias: '/user',
  productDetails: '/products/:id',
  merchantProfile: '/merchants/:id',
  merchantDashboard: '/merchant',
  merchantProductCreate: '/merchant/products/new',
  merchantProductEdit: '/merchant/products/:id/edit',
  adminDashboard: '/admin',
  adminMerchants: '/admin/merchants',
  adminListings: '/admin/listings',
  adminInquiries: '/admin/inquiries',
  adminSettings: '/admin/settings',
} as const

export const authRoutes = {
  login: routePaths.login,
  home: routePaths.home,
} as const

export function resolveHomePathForRole(role: Role | null | undefined) {
  if (role === 'merchant') {
    return routePaths.merchantDashboard
  }

  if (role === 'admin') {
    return routePaths.adminDashboard
  }

  return routePaths.userDashboard
}

export function resolveHomePathForUser(user: Pick<UserRecord, 'role'> | null | undefined) {
  return resolveHomePathForRole(user?.role)
}

export function buildLoginLocation(options?: { role?: Role; redirect?: string }): RouteLocationRaw {
  return {
    path: routePaths.login,
    query: {
      role: options?.role,
      redirect: options?.redirect,
    },
  }
}

export function buildRegisterLocation(
  role: Extract<Role, 'user' | 'merchant'> = 'user',
): RouteLocationRaw {
  if (role === 'merchant') {
    return {
      path: routePaths.merchantSignup,
    }
  }

  return {
    path: routePaths.register,
    query: {
      role,
    },
  }
}

export function getMerchantProductEditPath(productId: string) {
  return routePaths.merchantProductEdit.replace(':id', productId)
}

export function getMerchantProfilePath(merchantId: string) {
  return routePaths.merchantProfile.replace(':id', merchantId)
}
