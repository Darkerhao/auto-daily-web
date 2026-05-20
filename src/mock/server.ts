import type { LoginPayload, RegisterPayload } from '@/types/auth'
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
  RepositoryBranchOption,
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
  mockUsers,
} from './data'

const LATENCY = 260

let repositoryCache = [...mockRepositories]
let reportCache = [...mockReports]
let settingsCache = { ...mockSettings }
let feishuCache = { ...mockFeishuConfig }
let userCache = [...mockUsers]

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

export async function register(payload: RegisterPayload) {
  const now = new Date().toISOString()
  const user = {
    id: crypto.randomUUID(),
    name: payload.name,
    email: payload.email,
    avatar: `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(payload.email)}`,
    role: 'developer' as const,
    company: payload.company,
    gitUsername: payload.gitUsername,
    createdAt: now,
    lastLoginAt: now,
    permissions: mockUser.permissions,
  }

  userCache = [user, ...userCache]

  return wait({
    token: 'mock-jiazi-token',
    user,
  })
}

export async function getUsers() {
  return wait(userCache)
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
  const normalizedUrl = payload.url.trim()
  const branch = payload.branch.trim()

  if (!normalizedUrl) {
    return wait({
      success: false,
      latency: 0,
      branchExists: false,
      lastCommitHash: '',
      message: '请先填写仓库地址，再测试连接。',
    })
  }

  if (!branch) {
    return wait({
      success: false,
      latency: 0,
      branchExists: false,
      lastCommitHash: '',
      message: '请先选择或输入要测试的分支。',
    })
  }

  try {
    const parsedUrl = new URL(normalizedUrl)
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)

    if (!['http:', 'https:'].includes(parsedUrl.protocol) || pathSegments.length < 2) {
      return wait({
        success: false,
        latency: 0,
        branchExists: false,
        lastCommitHash: '',
        message: '仓库地址格式不正确，请输入完整地址，例如 https://github.com/org/repo。',
      })
    }
  } catch {
    return wait({
      success: false,
      latency: 0,
      branchExists: false,
      lastCommitHash: '',
      message: '仓库地址格式不正确，请输入完整地址，例如 https://github.com/org/repo。',
    })
  }

  const branchExists = guessBranchesByUrl(normalizedUrl).includes(branch)

  if (!branchExists) {
    return wait({
      success: false,
      latency: 182,
      branchExists: false,
      lastCommitHash: '',
      message: `仓库地址可解析，但未识别到分支 ${branch}。`,
    })
  }

  return wait({
    success: true,
    latency: 182,
    branchExists: payload.branch.length > 0,
    lastCommitHash: '4c9a2d91',
    message: `${payload.provider.toUpperCase()} 仓库连通，分支与访问令牌校验通过。`,
  })
}

function guessBranchesByUrl(url: string): string[] {
  const normalized = url.toLowerCase()

  if (normalized.includes('daily-report-web')) {
    return ['main', 'develop', 'release', 'feature/report-stream']
  }

  if (normalized.includes('report-worker')) {
    return ['release', 'main', 'hotfix/queue', 'feature/scheduler']
  }

  if (normalized.includes('outsourcing-delivery')) {
    return ['master', 'test', 'release']
  }

  if (normalized.includes('github.com')) {
    return ['main', 'develop', 'release']
  }

  if (normalized.includes('gitlab')) {
    return ['main', 'release', 'staging']
  }

  if (normalized.includes('gitee')) {
    return ['master', 'develop', 'release']
  }

  return ['main', 'develop']
}

export async function getRepositoryBranches(payload: Pick<RepositoryForm, 'provider' | 'url' | 'token'>): Promise<RepositoryBranchOption[]> {
  const branches = guessBranchesByUrl(payload.url).map((branch) => ({
    label: branch,
    value: branch,
  }))

  return wait(branches)
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
    summary: 'AI 已根据指定日期和 Git 用户名匹配到的 Commit Message 生成日报，可编辑后推送到飞书。',
    markdown: [
      `# ${payload.reportDate} 研发日报`,
      '',
      `1. 根据 ${payload.gitUsername} 当日 Commit Message，完成关键研发动作聚合，归纳功能开发、Bug 修复和重构优化等工作。`,
      '2. 本次生成不分析文件 Diff，仅依据提交文本总结，适合快速形成可编辑日报草稿。',
      '3. 当前报告可继续人工修订，再同步至飞书机器人或文档。',
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
    commitIds: mockCommits
      .filter((commit) => commit.time.slice(0, 10) === payload.reportDate && commit.author.includes(payload.gitUsername))
      .map((commit) => commit.id),
    tokenCost: 2670,
    createdAt: '2026-05-16 12:08',
    pushStatus: 'pending',
    riskItems: ['真实 Git Diff 拉取与分页策略待接入'],
    tomorrowPlan: ['联调 SaaS 工作区权限', '接入日报趋势统计'],
  }

  reportCache = [report, ...reportCache]
  return wait(report)
}

export async function updateReport(reportId: string, markdown: string) {
  const target = reportCache.find((item) => item.id === reportId)
  if (!target) {
    throw new Error('日报不存在')
  }

  const updated = {
    ...target,
    title: markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || target.title,
    summary: markdown
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith('#')) || target.summary,
    markdown,
    pushStatus: 'pending' as const,
  }

  reportCache = reportCache.map((item) => (item.id === reportId ? updated : item))
  return wait(updated)
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
    robotSent: true,
    docSynced: true,
    warnings: [],
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
