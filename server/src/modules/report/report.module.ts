import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import { ok } from '../../common/types/api.js'
import { createAppRepository } from '../../database/repositories/app.repository.js'
import { reportSchema } from './schemas/report.schema.js'
import { sendReportToFeishu } from './feishu.service.js'

const STREAM_DELAY_MS = 320

const promptPresets = [
  {
    id: 'professional',
    name: '专业研发',
    content: '请根据 Git Commit 与 Diff 内容生成专业日报，突出业务价值与技术动作。',
  },
  {
    id: 'concise',
    name: '简洁模式',
    content: '请用最简洁但专业的语言总结今日研发工作。',
  },
  {
    id: 'management',
    name: '管理视角',
    content: '请站在技术负责人视角生成可同步管理层的日报。',
  },
]

type AppRepository = ReturnType<typeof createAppRepository>
type ReportPayload = ReturnType<typeof reportSchema.parse>
type CommitRecord = Awaited<ReturnType<AppRepository['listCommitsByRepo']>>[number]
type ReportRecord = Awaited<ReturnType<AppRepository['listReports']>>[number]

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function writeSseEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

function getPromptPreset(style: ReportPayload['style']) {
  return (
    promptPresets.find((item) => item.id === style) ?? {
      id: 'professional',
      name: '专业研发',
      content: '请根据 Git Commit 与 Diff 内容生成专业日报，突出业务价值与技术动作。',
    }
  )
}

function unique(values: string[]) {
  return [...new Set(values)]
}

function normalizeRepoName(repoName: string | undefined) {
  return repoName?.trim() || 'unknown-repo'
}

function buildRiskItems(commits: CommitRecord[]) {
  const files = commits.flatMap((commit) => commit.files)
  const riskItems: string[] = []

  if (files.some((file) => /(^|\/)\.env/i.test(file.path) || /(secret|token|key)/i.test(file.path))) {
    riskItems.push('涉及配置或凭证相关文件，推送前需复核敏感信息与环境差异。')
  }

  if (files.length > 20) {
    riskItems.push('本次改动文件较多，建议补充回归测试并关注跨模块影响。')
  }

  if (commits.some((commit) => commit.message.toLowerCase().includes('fix'))) {
    riskItems.push('包含缺陷修复项，建议在日报中同步回归范围与验证结果。')
  }

  if (riskItems.length === 0) {
    riskItems.push('当前为自动归纳结果，正式推送前建议复核业务结论与敏感信息。')
  }

  return riskItems.slice(0, 3)
}

function buildTomorrowPlan(commits: CommitRecord[]) {
  const modules = unique(commits.flatMap((commit) => commit.modules))
  const modulePlanMap: Record<string, string> = {
    日报生成: '继续优化日报生成链路与输出质量，补充生成前后的回归验证。',
    仓库管理: '完善仓库同步与差异归档机制，补充多仓库联调验证。',
    飞书配置: '对接真实飞书投递能力，并补充 webhook 失败重试与告警。',
    AI流式输出: '将当前流式链路接入真实模型服务，补齐超时与中断恢复。',
    仓库同步: '补充真实 Git 提交抓取与失败降级策略，减少回退示例数据占比。',
    通用开发: '补齐端到端测试与发布前检查，降低跨模块回归风险。',
  }

  const plans = modules
    .map((module) => modulePlanMap[module])
    .filter((plan): plan is string => Boolean(plan))

  if (plans.length === 0) {
    plans.push('继续补齐真实后端能力与端到端联调，提升日报生成链路稳定性。')
  }

  return unique(plans).slice(0, 3)
}

function buildSummary(repoName: string, commits: CommitRecord[]) {
  const modules = unique(commits.flatMap((commit) => commit.modules))
  const fileCount = commits.reduce((total, commit) => total + commit.files.length, 0)
  const moduleSummary = modules.length > 0 ? modules.join('、') : '研发活动'
  return `已基于 ${repoName} 的 ${commits.length} 条 Commit 与 ${fileCount} 个差异文件完成归纳，覆盖 ${moduleSummary}。`
}

function buildMarkdown(
  payload: ReportPayload,
  repoName: string,
  commits: CommitRecord[],
  riskItems: string[],
  tomorrowPlan: string[],
) {
  const promptPreset = getPromptPreset(payload.style)
  const modules = unique(commits.flatMap((commit) => commit.modules))
  const authors = unique(commits.map((commit) => commit.author).filter(Boolean))
  const commitHighlights =
    commits.length > 0
      ? commits.map((commit, index) => `${index + 1}. ${commit.message}（${commit.author} / ${commit.shortHash}）`)
      : ['1. 当前仓库暂无可归纳的提交，建议先完成一次同步后再生成日报。']

  const moduleSummary = modules.length > 0 ? modules.join('、') : '研发事项'
  const authorSummary = authors.length > 0 ? authors.join('、') : '系统'

  return [
    `# ${repoName} 日报`,
    '',
    `- 模板：${promptPreset.name}`,
    `- 风格：${payload.style}`,
    `- 提交数量：${commits.length}`,
    `- 参与人：${authorSummary}`,
    '',
    '## 今日完成',
    `1. 已完成 ${moduleSummary} 相关研发归纳，自动聚合选中 Commit 与 Diff 信息。`,
    '2. 已抽取主要业务价值、风险项与后续计划，可直接作为日报初稿继续润色。',
    '3. 当前输出已与日报历史、复制和飞书推送链路联动，便于后续同步。',
    '',
    '## 关键提交',
    ...commitHighlights,
    '',
    '## 风险项',
    ...riskItems.map((item) => `- ${item}`),
    '',
    '## 明日计划',
    ...tomorrowPlan.map((item) => `- ${item}`),
  ].join('\n')
}

async function resolveReportContext(repository: AppRepository, payload: ReportPayload) {
  const repo = await repository.getRepositoryById(payload.repoId)
  const repoName = normalizeRepoName(repo?.name ?? payload.repoId)
  const repoCommits = await repository.listCommitsByRepo(payload.repoId)
  const selectedCommits = repoCommits.filter((commit) => payload.commitIds.includes(commit.id))
  const commits = selectedCommits.length > 0 ? selectedCommits : repoCommits

  return {
    repoName,
    commits,
  }
}

async function createReportDraft(repository: AppRepository, payload: ReportPayload): Promise<ReportRecord> {
  const { repoName, commits } = await resolveReportContext(repository, payload)
  const riskItems = buildRiskItems(commits)
  const tomorrowPlan = buildTomorrowPlan(commits)

  return {
    id: crypto.randomUUID(),
    repoId: payload.repoId,
    repoName,
    title: `AI 自动日报 - ${repoName}`,
    summary: buildSummary(repoName, commits),
    markdown: buildMarkdown(payload, repoName, commits, riskItems, tomorrowPlan),
    style: payload.style,
    commitIds: payload.commitIds,
    tokenCost: Math.max(1200, commits.length * 680 + commits.reduce((total, commit) => total + commit.files.length, 0) * 45),
    createdAt: new Date().toISOString(),
    pushStatus: 'pending',
    riskItems,
    tomorrowPlan,
  }
}

function buildStreamParts(payload: ReportPayload, report: ReportRecord, commits: CommitRecord[]) {
  const promptPreset = getPromptPreset(payload.style)
  const modules = unique(commits.flatMap((commit) => commit.modules))
  const fileCount = commits.reduce((total, commit) => total + commit.files.length, 0)
  const moduleSummary = modules.length > 0 ? modules.join('、') : '研发事项'

  return [
    `模板：${promptPreset.name}\n`,
    `正在聚合 ${commits.length} 条 Commit 与 ${fileCount} 个差异文件...\n`,
    `已识别 ${moduleSummary} 等研发动作，正在抽取业务价值...\n`,
    `已归纳 ${report.riskItems.length} 条风险项与 ${report.tomorrowPlan.length} 条明日计划，正在生成 Markdown 草稿...\n`,
    `日报草稿生成完成：${report.title}\n`,
  ]
}

export function createReportModule() {
  const router = Router()
  const repository = createAppRepository()

  router.get('/', async (_req, res) => {
    res.json(ok(await repository.listReports()))
  })

  router.get('/list', async (_req, res) => {
    res.json(ok(await repository.listReports()))
  })

  router.get('/prompts', (_req, res) => {
    res.json(ok(promptPresets))
  })

  router.get('/commits/:repoId', async (req, res) => {
    res.json(ok(await repository.listCommitsByRepo(req.params.repoId)))
  })

  router.get('/commits', async (req, res) => {
    const repoId = typeof req.query.repoId === 'string' ? req.query.repoId : 'repo-1'
    res.json(ok(await repository.listCommitsByRepo(repoId)))
  })

  router.post('/generate', async (req, res, next) => {
    try {
      const payload = reportSchema.parse(req.body)
      const report = await repository.saveReport(await createReportDraft(repository, payload))
      res.json(ok(report))
    } catch (error) {
      next(error)
    }
  })

  router.post('/stream', async (req: Request, res: Response, next: NextFunction) => {
    let aborted = false
    req.on('aborted', () => {
      aborted = true
    })
    res.on('close', () => {
      aborted = true
    })

    try {
      const payload = reportSchema.parse(req.body)
      const reportDraft = await createReportDraft(repository, payload)
      const { commits } = await resolveReportContext(repository, payload)
      const streamParts = buildStreamParts(payload, reportDraft, commits)

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.flushHeaders?.()

      for (const part of streamParts) {
        if (aborted) {
          return
        }

        writeSseEvent(res, 'delta', { delta: part })
        await sleep(STREAM_DELAY_MS)
      }

      if (aborted) {
        return
      }

      const savedReport = await repository.saveReport(reportDraft)
      if (aborted) {
        return
      }

      writeSseEvent(res, 'report', savedReport)
      writeSseEvent(res, 'done', { done: true })
      res.end()
    } catch (error) {
      if (!res.headersSent) {
        next(error)
        return
      }

      if (!res.writableEnded) {
        writeSseEvent(res, 'error', {
          message: error instanceof Error ? error.message : '日报流式生成失败',
        })
        res.end()
      }
    }
  })

  router.post('/:id/send-feishu', async (req, res) => {
    const report = (await repository.listReports()).find((item) => item.id === req.params.id)
    if (!report) {
      res.status(404).json({
        code: 404,
        message: '日报不存在',
        data: null,
      })
      return
    }

    const feishuConfig = await repository.getFeishuConfig()
    const result = await sendReportToFeishu(report, feishuConfig)
    if (result.success) {
      await repository.markReportPushed(req.params.id)
    }
    res.json(ok({ reportId: req.params.id, ...result }, result.message))
  })

  router.post('/send-feishu', async (req, res) => {
    const body = req.body as { reportId?: string }
    const reportId = body.reportId ?? ''
    const report = reportId ? (await repository.listReports()).find((item) => item.id === reportId) : null

    if (!report) {
      res.status(404).json({
        code: 404,
        message: '日报不存在',
        data: null,
      })
      return
    }

    const feishuConfig = await repository.getFeishuConfig()
    const result = await sendReportToFeishu(report, feishuConfig)
    if (result.success) {
      await repository.markReportPushed(reportId)
    }
    res.json(ok({ reportId, ...result }, result.message))
  })

  return router
}

export function createLegacyCommitModule() {
  const router = Router()
  const repository = createAppRepository()

  router.get('/list', async (req, res) => {
    const repoId = typeof req.query.repoId === 'string' ? req.query.repoId : 'repo-1'
    res.json(ok(await repository.listCommitsByRepo(repoId)))
  })

  return router
}
