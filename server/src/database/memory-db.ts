import { commits, dashboardSummary, feishuConfig, modelSettings, reports, repositories, user, users } from '../store/mock-data.js'

export interface MemoryDatabase {
  user: typeof user
  users: typeof users
  repositories: typeof repositories
  reports: typeof reports
  commits: typeof commits
  dashboardSummary: typeof dashboardSummary
  modelSettings: typeof modelSettings
  feishuConfig: typeof feishuConfig
}

const db: MemoryDatabase = {
  user: structuredClone(user),
  users: structuredClone(users),
  repositories: structuredClone(repositories),
  reports: structuredClone(reports),
  commits: structuredClone(commits),
  dashboardSummary: structuredClone(dashboardSummary),
  modelSettings: structuredClone(modelSettings),
  feishuConfig: structuredClone(feishuConfig),
}

export function getMemoryDb() {
  return db
}
