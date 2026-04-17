import type { RouteLocationRaw } from 'vue-router'

import { getPrimaryRole } from '@/modules/auth/access.guards'
import type { Role, UserRecord } from '@/shared/types'

export const routePaths = {
  home: '/',
  buy: '/buy',
  rent: '/rent',
  login: '/login',
  register: '/register',
  merchantSignup: '/merchant-signup',
  merchantVerificationUpgrade: '/merchant/verify',
  userDashboard: '/',
  userDashboardAlias: '/user',
  favorites: '/favorites',
  productDetails: '/products/:id',
  merchantProfile: '/merchants/:id',
  merchantDashboard: '/merchant',
  merchantProductCreate: '/merchant/products/new',
  merchantProductEdit: '/merchant/products/:id/edit',
  adminDashboard: '/admin/overview',
  adminMerchants: '/admin/overview',
  adminBasicMerchants: '/admin/basic-merchants',
  adminVerifiedMerchants: '/admin/verified-merchants',
  adminProducts: '/admin/products',
  adminListings: '/admin/products',
  adminInquiries: '/admin/products',
  adminSettings: '/admin/overview',
} as const

export const authRoutes = {
  login: routePaths.login,
  home: routePaths.home,
} as const

export function resolveHomePathForRole(role: Role | null | undefined) {
  if (role === 'admin') {
    return routePaths.adminDashboard
  }

  return routePaths.userDashboard
}

export function resolveHomePathForUser(user: Pick<UserRecord, 'role' | 'roles'> | null | undefined) {
  return resolveHomePathForRole(getPrimaryRole((user as UserRecord | null | undefined) ?? null))
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
