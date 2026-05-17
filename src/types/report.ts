export type ReportTone = 'concise' | 'professional' | 'management'

export type PushStatus = 'success' | 'pending' | 'failed'

export interface DiffFile {
  path: string
  language: string
  additions: number
  deletions: number
  status?: string
  patch: string[]
}

export interface CommitItem {
  id: string
  hash: string
  shortHash: string
  message: string
  author: string
  time: string
  branch: string
  modules: string[]
  files: DiffFile[]
}

export interface GeneratedReport {
  id: string
  repoId: string
  repoName: string
  title: string
  summary: string
  markdown: string
  style: ReportTone
  commitIds: string[]
  tokenCost: number
  createdAt: string
  pushStatus: PushStatus
  riskItems: string[]
  tomorrowPlan: string[]
}

export interface GenerateReportPayload {
  repoId: string
  commitIds: string[]
  promptTemplate: string
  style: ReportTone
}

export interface FeishuSendPayload {
  reportId: string
}

export interface StreamChunk {
  delta: string
  done: boolean
  report?: GeneratedReport
}

export interface PromptPreset {
  id: string
  name: string
  content: string
}

export interface ReportHistoryFilters {
  repoId: string
  style: ReportTone | 'all'
  pushStatus: PushStatus | 'all'
  keyword: string
}
