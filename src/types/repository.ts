export type GitProvider = 'github' | 'gitlab' | 'gitee' | 'custom'

export type SyncFrequency = '10m' | '30m' | '1h' | 'manual'

export interface RepositoryItem {
  id: string
  name: string
  provider: GitProvider
  url: string
  branch: string
  token: string
  syncFrequency: SyncFrequency
  lastSyncAt: string
  owner: string
  commitCountToday: number
  enabled: boolean
  tags: string[]
}

export interface RepositoryForm {
  id?: string
  name: string
  provider: GitProvider
  url: string
  branch: string
  token: string
  syncFrequency: SyncFrequency
  owner: string
  enabled: boolean
  tags: string[]
}

export interface RepositoryConnectionResult {
  success: boolean
  latency: number
  branchExists: boolean
  lastCommitHash: string
  message: string
}

export interface RepositoryBranchOption {
  label: string
  value: string
}
