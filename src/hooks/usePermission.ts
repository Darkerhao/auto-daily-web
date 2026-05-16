import { computed } from 'vue'
import type { AppPermission } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'

export function usePermission() {
  const authStore = useAuthStore()

  const permissionSet = computed(() => new Set(authStore.user?.permissions ?? []))

  function hasPermission(permission?: AppPermission) {
    if (!permission) {
      return true
    }

    return permissionSet.value.has(permission)
  }

  return {
    hasPermission,
  }
}
