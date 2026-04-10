import type { RouteLocationRaw } from 'vue-router'

import { buildLoginLocation, resolveHomePathForUser, resolveHomePathForRole } from '@/app/router/paths'
import type { Role, UserRecord } from '@/shared/types'

import type { AccessRequirement } from './access.types'

export function routeForRole(role: Role | null | undefined): RouteLocationRaw {
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
