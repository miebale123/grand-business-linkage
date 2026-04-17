import type { Role, UserRecord } from '@/shared/types'

import type { AccessRequirement } from './access.types'

function getUserRoles(user: UserRecord | null | undefined): Role[] {
  if (!user) {
    return []
  }

  return Array.from(new Set([user.role, ...(user.roles || [])]))
}

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

  const userRoles = getUserRoles(user)
  return roles.some((role) => userRoles.includes(role))
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

export function getPrimaryRole(user: UserRecord | null | undefined): Role | null {
  if (!user) {
    return null
  }

  const roles = getUserRoles(user)

  if (roles.includes('admin')) {
    return 'admin'
  }

  if (roles.includes('merchant')) {
    return 'merchant'
  }

  if (roles.includes('basic_merchant')) {
    return 'basic_merchant'
  }

  return roles[0] || null
}

export function getUserRolesList(user: UserRecord | null | undefined): Role[] {
  return getUserRoles(user)
}
