import type { RouteLocationRaw } from 'vue-router'

import { buildLoginLocation, resolveHomePathForUser, resolveHomePathForRole } from '@/app/router/paths'
import { getPrimaryRole } from '@/modules/auth/access.guards'
import type { Role, UserRecord } from '@/shared/types'

import type { AccessRequirement } from './access.types'

export function routeForRole(role: Role | UserRecord | null | undefined): RouteLocationRaw {
  if (typeof role === 'object') {
    return resolveHomePathForRole(getPrimaryRole(role))
  }

  return resolveHomePathForRole(role)
}

export function getAccessRedirect(
  user: UserRecord | null | undefined,
  toFullPath: string,
  access?: AccessRequirement,
): RouteLocationRaw {
  if (!user) {
    return buildLoginLocation({ redirect: toFullPath })
  }

  if (access?.guestOnly) {
    return resolveHomePathForUser(user)
  }

  return resolveHomePathForUser(user)
}
