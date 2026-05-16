import type { LoginPayload } from '@/types/auth'
import type { DashboardSummary } from '@/types/dashboard'
import type { FeishuConfig, ModelSettings } from '@/types/settings'
import type {
  CommitItem,
  FeishuSendPayload,
  GenerateReportPayload,
  GeneratedReport,
  PromptPreset,
} from '@/types/report'
import type {
  RepositoryConnectionResult,
  RepositoryForm,
  RepositoryItem,
} from '@/types/repository'
import {
  mockCommits,
  mockDashboardSummary,
  mockFeishuConfig,
  mockPromptPresets,
  mockReports,
  mockRepositories,
  mockSettings,
  mockUser,
} from './data'

const LATENCY = 260

let repositoryCache = [...mockRepositories]
let reportCache = [...mockReports]
let settingsCache = { ...mockSettings }
let feishuCache = { ...mockFeishuConfig }

function wait<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), LATENCY)
  })
}

export async function login(payload: LoginPayload) {
  const user = {
    ...mockUser,
    email: payload.email,
  }

  return wait({
    token: 'mock-jiazi-token',
    user,
  })
}

export async function getDashboard(): Promise<DashboardSummary> {
  return wait({
    ...mockDashboardSummary,
    repositories: repositoryCache,
    recentReports: reportCache,
  })
}

export async function getRepositories(): Promise<RepositoryItem[]> {
  return wait(repositoryCache)
}

export async function saveRepository(payload: RepositoryForm): Promise<RepositoryItem> {
  const repository: RepositoryItem = {
    id: payload.id ?? crypto.randomUUID(),
    lastSyncAt: '2026-05-16 12:10',
    commitCountToday: payload.id ? repositoryCache.find((item) => item.id === payload.id)?.commitCountToday ?? 0 : 0,
    ...payload,
  }

  repositoryCache = payload.id
    ? repositoryCache.map((item) => (item.id === payload.id ? repository : item))
    : [repository, ...repositoryCache]

  return wait(repository)
}

export async function removeRepository(id: string) {
  repositoryCache = repositoryCache.filter((item) => item.id !== id)
  return wait(true)
}

export async function testRepositoryConnection(
  payload: RepositoryForm,
): Promise<RepositoryConnectionResult> {
  return wait({
    success: true,
    latency: 182,
    branchExists: payload.branch.length > 0,
    lastCommitHash: '4c9a2d91',
    message: `${payload.provider.toUpperCase()} 仓库连通，分支与访问令牌校验通过。`,
  })
}

export async function getCommits(repoId?: string): Promise<CommitItem[]> {
  const selectedRepo = repoId ?? repositoryCache[0]?.id
  return wait(
    mockCommits.map((commit) => ({
      ...commit,
      id: `${selectedRepo}-${commit.id}`,
    })),
  )
}

export async function getPromptPresets(): Promise<PromptPreset[]> {
  return wait(mockPromptPresets)
}

export async function generateReport(payload: GenerateReportPayload): Promise<GeneratedReport> {
  const preset = mockPromptPresets.find((item) => item.id === payload.style)
  const repo = repositoryCache.find((item) => item.id === payload.repoId) ?? repositoryCache[0]

  const report: GeneratedReport = {
    id: crypto.randomUUID(),
    repoId: payload.repoId,
    repoName: repo?.name ?? 'unknown-repo',
    title: `AI 自动日报 - ${repo?.name ?? 'Unknown Repo'}`,
    summary: 'AI 已完成 Commit 聚合、Diff 归纳与业务价值提炼，可直接推送到飞书。',
    markdown: [
      '1. 基于今日 Commit 与 Diff，完成关键研发动作聚合，自动归纳为功能开发、Bug 修复和重构优化三类工作。',
      '2. 识别并合并重复提交，突出日报生成链路、仓库接入与飞书推送等核心业务价值。',
      '3. 当前报告适合直接同步至团队群或管理层，可按简洁 / 专业 / 管理风格重新生成。',
      '',
      `Prompt 模板：${preset?.name ?? '默认模板'}`,
      '',
      '风险项：',
      '- 尚未接入真实 Git 提交拉取服务，当前为前端 Mock 演示数据。',
      '',
      '明日计划：',
      '- 对接真实后端流水线与飞书 OpenAPI。',
    ].join('\n'),
    style: payload.style,
    commitIds: payload.commitIds,
    tokenCost: 2670,
    createdAt: '2026-05-16 12:08',
    pushStatus: 'pending',
    riskItems: ['真实 Git Diff 拉取与分页策略待接入'],
    tomorrowPlan: ['联调 SaaS 工作区权限', '接入日报趋势统计'],
  }

  reportCache = [report, ...reportCache]
  return wait(report)
}

export async function sendFeishu(payload: FeishuSendPayload) {
  reportCache = reportCache.map((item) =>
    item.id === payload.reportId
      ? {
          ...item,
          pushStatus: 'success',
        }
      : item,
  )

  return wait({
    success: true,
    message: '已推送到飞书机器人与日报文档。',
  })
}

export async function getReports() {
  return wait(reportCache)
}

export async function getSettings(): Promise<ModelSettings> {
  return wait(settingsCache)
}

export async function saveSettings(payload: ModelSettings) {
  settingsCache = { ...payload }
  return wait(settingsCache)
}

export async function getFeishuConfig(): Promise<FeishuConfig> {
  return wait(feishuCache)
}

export async function saveFeishuConfig(payload: FeishuConfig) {
  feishuCache = { ...payload }
  return wait(feishuCache)
}
