import type { Role } from '@/shared/types'

export type AccessRequirement = {
  guestOnly?: boolean
  requiresAuth?: boolean
  roles?: Role[]
}
