import type { AccessRequirement } from './access.types'

export const accessPresets = {
  guestOnly: {
    guestOnly: true,
  } satisfies AccessRequirement,
  merchantWorkspace: {
    requiresAuth: true,
    roles: ['merchant', 'basic_merchant'],
  } satisfies AccessRequirement,
  merchantCatalogWrite: {
    requiresAuth: true,
    roles: ['user', 'merchant', 'basic_merchant'],
  } satisfies AccessRequirement,
  adminConsole: {
    requiresAuth: true,
    roles: ['admin'],
  } satisfies AccessRequirement,
}
