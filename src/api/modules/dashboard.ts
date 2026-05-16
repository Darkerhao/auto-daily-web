import { request } from '../request'
import type { DashboardSummary } from '@/types/dashboard'

export const dashboardApi = {
  getSummary() {
    return request.get<DashboardSummary>('/dashboard/summary')
  },
}
