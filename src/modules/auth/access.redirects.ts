import type { RouteLocationRaw } from 'vue-router'

import type { Role, UserRecord } from '@/shared/types'

import type { AccessRequirement } from './access.types'

export function routeForRole(role: Role | null | undefined): RouteLocationRaw {
  if (role === 'merchant') {
    return { name: 'merchant-dashboard' }
  }

  if (role === 'admin') {
    return { name: 'admin-dashboard' }
  }

  return { name: 'user-dashboard' }
}

export function getAccessRedirect(
  user: UserRecord | null | undefined,
  toFullPath: string,
  access?: AccessRequirement,
): RouteLocationRaw {
  if (!user) {
    return { name: 'login', query: { redirect: toFullPath } }
  }

  if (access?.guestOnly) {
    return routeForRole(user.role)
  }

  return routeForRole(user.role)
}
