import { hasDatabaseUrl } from '../pg/client.js'
import { createPgRepository } from './pg.repository.js'
import { getMemoryDb } from '../memory-db.js'

function createMemoryRepository() {
  const db = getMemoryDb()

  return {
    async getUser() {
      return db.user
    },
    async getDashboardSummary() {
      return {
        ...db.dashboardSummary,
        repositories: db.repositories,
        recentReports: db.reports,
      }
    },
    async listRepositories() {
      return db.repositories
    },
    async saveRepository(repository: (typeof db.repositories)[number]) {
      const index = db.repositories.findIndex((item) => item.id === repository.id)
      if (index >= 0) {
        db.repositories[index] = repository
      } else {
        db.repositories.unshift(repository)
      }
      return repository
    },
    async removeRepository(id: string) {
      db.repositories = db.repositories.filter((item) => item.id !== id)
      return true
    },
    async listReports() {
      return db.reports
    },
    async saveReport(report: (typeof db.reports)[number]) {
      const index = db.reports.findIndex((item) => item.id === report.id)
      if (index >= 0) {
        db.reports[index] = report
      } else {
        db.reports.unshift(report)
      }
      return report
    },
    async markReportPushed(reportId: string) {
      const target = db.reports.find((item) => item.id === reportId)
      if (target) {
        target.pushStatus = 'success'
      }
      return target ?? null
    },
    async listCommitsByRepo(repoId: string) {
      return db.commits.map((item) => ({
        ...item,
        id: `${repoId}-${item.id}`,
      }))
    },
    async getModelSettings() {
      return db.modelSettings
    },
    async saveModelSettings(payload: typeof db.modelSettings) {
      db.modelSettings = payload
      return db.modelSettings
    },
    async getFeishuConfig() {
      return db.feishuConfig
    },
    async saveFeishuConfig(payload: typeof db.feishuConfig) {
      db.feishuConfig = payload
      return db.feishuConfig
    },
  }
}

export function createAppRepository() {
  return hasDatabaseUrl() ? createPgRepository() : createMemoryRepository()
}
