import type { Role, UserRecord } from '@/shared/types'

import type { AccessRequirement } from './access.types'

export function isAuthenticated(user: UserRecord | null | undefined): user is UserRecord {
  return Boolean(user)
}

export function hasRole(user: UserRecord | null | undefined, roles?: Role[]) {
  if (!roles?.length) {
    return true
  }

  if (!user) {
    return false
  }

  return roles.includes(user.role)
}

export function canAccess(user: UserRecord | null | undefined, access?: AccessRequirement) {
  if (!access) {
    return true
  }

  if (access.guestOnly) {
    return !user
  }

  if (access.requiresAuth && !user) {
    return false
  }

  if (!hasRole(user, access.roles)) {
    return false
  }

  return true
}
