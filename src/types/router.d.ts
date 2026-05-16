import 'vue-router'
import type { AppPermission } from './auth'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    permission?: AppPermission
  }
}
