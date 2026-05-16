import type { GeneratedReport } from './report'
import type { RepositoryItem } from './repository'

export interface MetricCard {
  key: string
  label: string
  value: string
  trend: string
  status: 'brand' | 'success' | 'warning'
}

export interface TokenTrendPoint {
  date: string
  value: number
}

export interface ActivityEvent {
  id: string
  title: string
  description: string
  time: string
  type: 'commit' | 'report' | 'push' | 'system'
}

export interface DashboardSummary {
  metrics: MetricCard[]
  tokenTrend: TokenTrendPoint[]
  recentReports: GeneratedReport[]
  repositories: RepositoryItem[]
  activity: ActivityEvent[]
}
