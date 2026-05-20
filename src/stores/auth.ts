import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api/modules/auth'
import type { LoginPayload, RegisterPayload, UserListItem, UserProfile } from '@/types/auth'
import { readStorage, removeStorage, storageKeys, writeStorage } from '@/utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(readStorage<string>(storageKeys.token, ''))
  const user = ref<UserProfile | null>(readStorage<UserProfile | null>(storageKeys.user, null))
  const users = ref<UserListItem[]>([])

  const isAuthenticated = computed(() => Boolean(token.value))

  async function login(payload: LoginPayload) {
    const result = await authApi.login(payload)
    token.value = result.token
    user.value = result.user
    writeStorage(storageKeys.token, token.value)
    writeStorage(storageKeys.user, user.value)
    return result
  }

  async function register(payload: RegisterPayload) {
    const result = await authApi.register(payload)
    token.value = result.token
    user.value = result.user
    writeStorage(storageKeys.token, token.value)
    writeStorage(storageKeys.user, user.value)
    return result
  }

  async function fetchUsers() {
    users.value = await authApi.getUsers()
    return users.value
  }

  function logout() {
    token.value = ''
    user.value = null
    removeStorage(storageKeys.token)
    removeStorage(storageKeys.user)
  }

  return {
    token,
    user,
    users,
    isAuthenticated,
    login,
    register,
    fetchUsers,
    logout,
  }
})
