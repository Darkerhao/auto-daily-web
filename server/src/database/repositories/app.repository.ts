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
    async getRepositoryById(id: string) {
      return db.repositories.find((item) => item.id === id) ?? null
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
    async replaceCommitsForRepo(repoId: string, commits: Array<{
      id: string
      repoId: string
      hash: string
      shortHash: string
      message: string
      author: string
      time: string
      branch: string
      modules: string[]
      files: Array<{
        path: string
        language: string
        additions: number
        deletions: number
        patch: string[]
      }>
    }>) {
      db.commits = [
        ...db.commits.filter((item) => !item.id.startsWith(`${repoId}-`)),
        ...commits.map((item) => ({
          id: item.id.replace(`${repoId}-`, ''),
          hash: item.hash,
          shortHash: item.shortHash,
          message: item.message,
          author: item.author,
          time: item.time,
          branch: item.branch,
          modules: item.modules,
          files: item.files,
        })),
      ]
    },
    async touchRepositorySync(repoId: string, commitCountToday: number) {
      const target = db.repositories.find((item) => item.id === repoId)
      if (target) {
        target.lastSyncAt = new Date().toISOString()
        target.commitCountToday = commitCountToday
      }
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
      return db.commits
        .filter((item) => item.id.startsWith(`${repoId}-`) || repoId === 'repo-1')
        .map((item) => ({
          ...item,
          id: item.id.startsWith(`${repoId}-`) ? item.id : `${repoId}-${item.id}`,
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
