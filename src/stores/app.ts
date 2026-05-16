import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { ThemeMode, WorkspaceProfile } from '@/types/common'
import { readStorage, storageKeys, writeStorage } from '@/utils/storage'

const defaultWorkspaceProfile: WorkspaceProfile = {
  workspaceName: '甲子日报 AI SaaS',
  teamName: '研发效能组',
  environment: 'demo',
}

export const useAppStore = defineStore('app', () => {
  const theme = ref<ThemeMode>(readStorage<ThemeMode>(storageKeys.theme, 'dark'))
  const sidebarCollapsed = ref<boolean>(readStorage<boolean>(storageKeys.sidebarCollapsed, false))
  const workspaceProfile = ref<WorkspaceProfile>(
    readStorage<WorkspaceProfile>(storageKeys.workspaceProfile, defaultWorkspaceProfile),
  )
  const requestLoadingCount = ref(0)

  const isRequestLoading = computed(() => requestLoadingCount.value > 0)
  const workspaceLabel = computed(
    () => `${workspaceProfile.value.workspaceName} / ${workspaceProfile.value.teamName}`,
  )

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    writeStorage(storageKeys.theme, mode)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function setSidebarCollapsed(value: boolean) {
    sidebarCollapsed.value = value
    writeStorage(storageKeys.sidebarCollapsed, value)
  }

  function updateWorkspaceProfile(payload: Partial<WorkspaceProfile>) {
    workspaceProfile.value = {
      ...workspaceProfile.value,
      ...payload,
    }
    writeStorage(storageKeys.workspaceProfile, workspaceProfile.value)
  }

  function beginRequest() {
    requestLoadingCount.value += 1
  }

  function endRequest() {
    requestLoadingCount.value = Math.max(0, requestLoadingCount.value - 1)
  }

  return {
    theme,
    sidebarCollapsed,
    workspaceProfile,
    workspaceLabel,
    isRequestLoading,
    setTheme,
    toggleTheme,
    setSidebarCollapsed,
    updateWorkspaceProfile,
    beginRequest,
    endRequest,
  }
})
