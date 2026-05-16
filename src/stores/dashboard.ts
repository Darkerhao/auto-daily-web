import { ref } from 'vue'
import { defineStore } from 'pinia'
import { dashboardApi } from '@/api/modules/dashboard'
import type { DashboardSummary } from '@/types/dashboard'
import { readStorage, writeStorage } from '@/utils/storage'

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref<DashboardSummary | null>(null)
  const dashboardView = ref<'overview' | 'insight'>(
    readStorage<'overview' | 'insight'>('jiazi-dashboard-view', 'overview'),
  )

  async function fetchSummary() {
    summary.value = await dashboardApi.getSummary()
    return summary.value
  }

  function setDashboardView(value: 'overview' | 'insight') {
    dashboardView.value = value
    writeStorage('jiazi-dashboard-view', value)
  }

  return {
    summary,
    dashboardView,
    fetchSummary,
    setDashboardView,
  }
})
