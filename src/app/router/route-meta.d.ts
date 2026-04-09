import 'vue-router'

import type { Role } from '@/shared/types'

declare module 'vue-router' {
  interface RouteMeta {
    guestOnly?: boolean
    requiresAuth?: boolean
    roles?: Role[]
  }
}

export {}
