import type { AccessRequirement } from './access.types'

export const accessPresets = {
  guestOnly: {
    guestOnly: true,
  } satisfies AccessRequirement,
  merchantWorkspace: {
    requiresAuth: true,
    roles: ['merchant'],
  } satisfies AccessRequirement,
  merchantCatalogWrite: {
    requiresAuth: true,
    roles: ['merchant'],
  } satisfies AccessRequirement,
  adminConsole: {
    requiresAuth: true,
    roles: ['admin'],
  } satisfies AccessRequirement,
}
