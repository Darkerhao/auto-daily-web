import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import { ok } from '../../common/types/api.js'
import { createAppRepository } from '../../database/repositories/app.repository.js'
import { reportSchema } from './schemas/report.schema.js'
import { sendReportToFeishu } from './feishu.service.js'

const promptPresets = [
  {
    id: 'professional',
    name: '专业研发',
    content: '请根据指定日期和 Git 用户名筛选出的 Commit Message，生成专业中文研发日报。',
  },
  {
    id: 'concise',
    name: '简洁模式',
    content: '请用简洁但专业的语言总结当天研发工作，不要逐条复述 Commit Message。',
  },
  {
    id: 'management',
    name: '管理视角',
    content: '请站在技术负责人视角，突出阶段成果、风险项和明日计划，适合同步给管理层。',
  },
] as const

type AppRepository = ReturnType<typeof createAppRepository>
type ReportPayload = ReturnType<typeof reportSchema.parse>
type CommitRecord = Awaited<ReturnType<AppRepository['listCommitsByRepo']>>[number]
type ReportRecord = Awaited<ReturnType<AppRepository['listReports']>>[number]
type ModelSettings = Awaited<ReturnType<AppRepository['getModelSettings']>>

interface ChatCompletionChunk {
  choices?: Array<{
    delta?: {
      content?: string
    }
  }>
  usage?: {
    total_tokens?: number
  } | null
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  usage?: {
    total_tokens?: number
  } | null
}

interface GeneratedContent {
  markdown: string
  tokenCost: number
}

function writeSseEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

function setNoStoreHeaders(res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.removeHeader('ETag')
}

function getPromptPreset(style: ReportPayload['style']) {
  return promptPresets.find((item) => item.id === style) ?? promptPresets[0]!
}

function normalizeRepoName(repoName: string | undefined) {
  return repoName?.trim() || 'unknown-repo'
}

function resolveApiKey(settings: ModelSettings) {
  const configuredKey = settings.apiKey?.trim()
  if (configuredKey) return configuredKey

  if (settings.provider === 'openai') return process.env.OPENAI_API_KEY?.trim() ?? ''
  if (settings.provider === 'deepseek') return process.env.DEEPSEEK_API_KEY?.trim() ?? ''
  if (settings.provider === 'claude') return process.env.ANTHROPIC_API_KEY?.trim() ?? ''
  return process.env.OPENAI_API_KEY?.trim() ?? ''
}

function resolveBaseUrl(settings: ModelSettings) {
  const configuredBaseUrl = settings.baseUrl?.trim()
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '')

  if (settings.provider === 'deepseek') return 'https://api.deepseek.com/v1'
  if (settings.provider === 'openai') return 'https://api.openai.com/v1'
  return ''
}

function assertOpenAiCompatibleSettings(settings: ModelSettings) {
  if (settings.provider === 'claude') {
    throw new Error('Claude 原生接口暂未接入，请在设置中心改用 OpenAI、DeepSeek 或 OpenAI-compatible 自定义服务。')
  }

  const apiKey = resolveApiKey(settings)
  const baseUrl = resolveBaseUrl(settings)
  const modelName = settings.modelName?.trim()

  if (!apiKey) {
    throw new Error('模型 API Key 未配置，请先在设置中心或 server/.env 配置真实 Key。')
  }

  if (!baseUrl) {
    throw new Error('模型 Base URL 未配置，请先在设置中心配置 OpenAI-compatible 服务地址。')
  }

  if (!modelName) {
    throw new Error('模型名称未配置，请先在设置中心配置 modelName。')
  }

  return {
    apiKey,
    baseUrl,
    modelName,
  }
}

function normalizeDate(value: string) {
  return value.trim().slice(0, 10)
}

function isSameReportDate(commitTime: string, reportDate: string) {
  return normalizeDate(commitTime) === reportDate
}

function normalizeAuthor(value: string) {
  return value.trim().toLowerCase()
}

function filterCommits(commits: CommitRecord[], payload: ReportPayload) {
  const reportDate = normalizeDate(payload.reportDate)
  const gitUsername = normalizeAuthor(payload.gitUsername)

  return commits.filter((commit) => {
    const dateMatched = isSameReportDate(commit.time, reportDate)
    const authorMatched = normalizeAuthor(commit.author).includes(gitUsername)
    return dateMatched && authorMatched
  })
}

function buildCommitMessageContext(commits: CommitRecord[]) {
  return commits
    .map((commit, index) =>
      [
        `## Commit ${index + 1}`,
        `Hash: ${commit.shortHash} (${commit.hash})`,
        `作者: ${commit.author}`,
        `时间: ${commit.time}`,
        `分支: ${commit.branch}`,
        `提交信息: ${commit.message}`,
      ].join('\n'),
    )
    .join('\n\n---\n\n')
}

function buildSystemPrompt(styleName: string) {
  return [
    '你是企业级前端技术负责人，需要只基于 Git Commit Message 生成中文研发日报。',
    '禁止分析或引用文件 Diff、文件路径、代码行数等信息；如果 Commit Message 信息不足，请写成待确认项。',
    '要求：使用专业开发术语，不要流水账，自动合并相同类型修改，输出技术负责人风格。',
    '必须覆盖：功能开发、Bug 修复、性能优化、重构优化、风险项、明日计划。',
    '如果 Commit Message 涉及 Vue 项目，可重点识别组件开发、hooks/composables、API 联调、权限逻辑、表单逻辑、状态管理、构建优化、Ant Design Vue、Element Plus、Electron、TypeScript 类型修复。',
    `当前日报风格：${styleName}。`,
    '只输出 Markdown 正文，不要输出 JSON，不要解释生成过程。',
  ].join('\n')
}

function buildUserPrompt(payload: ReportPayload, repoName: string, commits: CommitRecord[]) {
  const preset = getPromptPreset(payload.style)

  return [
    `仓库：${repoName}`,
    `日报日期：${payload.reportDate}`,
    `Git 用户名：${payload.gitUsername}`,
    `用户选择的 Prompt：${payload.promptTemplate || preset.content}`,
    `Commit 数：${commits.length}`,
    '',
    '请只根据以下 Commit Message 生成日报，不要补充没有出现在提交信息中的具体代码改动。',
    '',
    buildCommitMessageContext(commits),
  ].join('\n')
}

function normalizeMarkdown(markdown: string) {
  return markdown.trim() || '# 日报生成失败\n\n模型未返回有效内容，请检查模型配置或稍后重试。'
}

function extractHeading(markdown: string, repoName: string) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim()
  return heading || `AI 自动日报 - ${repoName}`
}

function extractSection(markdown: string, title: string) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = markdown.match(new RegExp(`^##\\s*${escapedTitle}\\s*\\n([\\s\\S]*?)(?=^##\\s|\\z)`, 'm'))
  return match?.[1]?.trim() ?? ''
}

function extractBullets(section: string) {
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line) || /^\d+[.、]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+[.、]\s+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}

function buildFallbackRiskItems(commits: CommitRecord[]) {
  if (commits.some((commit) => /fix|bug|修复|问题/i.test(commit.message))) {
    return ['包含缺陷修复类提交，建议同步回归范围与验证结果。']
  }

  return ['日报仅基于 Commit Message 生成，正式推送前建议复核业务表述是否完整。']
}

function buildFallbackTomorrowPlan() {
  return ['继续补充提交信息规范，确保日报生成结果更准确。']
}

function buildSummary(markdown: string, repoName: string, commits: CommitRecord[]) {
  const firstParagraph = markdown
    .replace(/^# .+$/m, '')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#') && !line.startsWith('-') && !/^\d+[.、]/.test(line))

  if (firstParagraph) {
    return firstParagraph.slice(0, 220)
  }

  return `已基于 ${repoName} 的 ${commits.length} 条 Commit Message 生成日报。`
}

async function resolveReportContext(repository: AppRepository, payload: ReportPayload) {
  const repo = await repository.getRepositoryById(payload.repoId)
  const repoName = normalizeRepoName(repo?.name ?? payload.repoId)
  const repoCommits = await repository.listCommitsByRepo(payload.repoId)
  const commits = filterCommits(repoCommits, payload)

  if (commits.length === 0) {
    throw new Error(`未找到 ${payload.reportDate} 且作者匹配“${payload.gitUsername}”的 Commit，请先同步仓库或调整筛选条件。`)
  }

  return {
    repoName,
    commits,
  }
}

async function callChatCompletion(
  settings: ModelSettings,
  messages: Array<{ role: 'system' | 'user'; content: string }>,
): Promise<GeneratedContent> {
  const { apiKey, baseUrl, modelName } = assertOpenAiCompatibleSettings(settings)
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    }),
  })

  const rawBody = await response.text()
  if (!response.ok) {
    throw new Error(`模型生成失败：HTTP ${response.status} ${rawBody}`)
  }

  const data = JSON.parse(rawBody) as ChatCompletionResponse
  return {
    markdown: normalizeMarkdown(data.choices?.[0]?.message?.content ?? ''),
    tokenCost: data.usage?.total_tokens ?? 0,
  }
}

async function streamChatCompletion(
  settings: ModelSettings,
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  onDelta: (delta: string) => void,
  isAborted: () => boolean,
): Promise<GeneratedContent> {
  const { apiKey, baseUrl, modelName } = assertOpenAiCompatibleSettings(settings)
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: true,
      stream_options: {
        include_usage: true,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`模型流式生成失败：HTTP ${response.status} ${await response.text()}`)
  }

  if (!response.body) {
    throw new Error('模型流式响应不可用。')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let markdown = ''
  let tokenCost = 0

  while (true) {
    if (isAborted()) break

    const { done, value } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })

    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''

    for (const frame of frames) {
      const lines = frame
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data:'))

      for (const line of lines) {
        const rawData = line.slice('data:'.length).trim()
        if (!rawData || rawData === '[DONE]') continue

        const chunk = JSON.parse(rawData) as ChatCompletionChunk
        const delta = chunk.choices?.[0]?.delta?.content ?? ''
        if (delta) {
          markdown += delta
          onDelta(delta)
        }

        tokenCost = chunk.usage?.total_tokens ?? tokenCost
      }
    }

    if (done) break
  }

  return {
    markdown: normalizeMarkdown(markdown),
    tokenCost,
  }
}

function buildReportRecord(
  payload: ReportPayload,
  repoName: string,
  commits: CommitRecord[],
  generated: GeneratedContent,
): ReportRecord {
  const riskItems = extractBullets(extractSection(generated.markdown, '风险项'))
  const tomorrowPlan = extractBullets(extractSection(generated.markdown, '明日计划'))

  return {
    id: crypto.randomUUID(),
    repoId: payload.repoId,
    repoName,
    title: extractHeading(generated.markdown, repoName),
    summary: buildSummary(generated.markdown, repoName, commits),
    markdown: generated.markdown,
    style: payload.style,
    commitIds: commits.map((commit) => commit.id),
    tokenCost: generated.tokenCost,
    createdAt: new Date().toISOString(),
    pushStatus: 'pending',
    riskItems: riskItems.length > 0 ? riskItems : buildFallbackRiskItems(commits),
    tomorrowPlan: tomorrowPlan.length > 0 ? tomorrowPlan : buildFallbackTomorrowPlan(),
  }
}

function buildUpdatedReportRecord(report: ReportRecord, markdown: string): ReportRecord {
  return {
    ...report,
    title: extractHeading(markdown, report.repoName),
    summary: buildSummary(markdown, report.repoName, []),
    markdown,
    pushStatus: 'pending',
    riskItems: extractBullets(extractSection(markdown, '风险项')),
    tomorrowPlan: extractBullets(extractSection(markdown, '明日计划')),
  }
}

async function createReportDraft(repository: AppRepository, payload: ReportPayload): Promise<ReportRecord> {
  const { repoName, commits } = await resolveReportContext(repository, payload)
  const settings = await repository.getModelSettings()
  const preset = getPromptPreset(payload.style)
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(preset.name) },
    { role: 'user' as const, content: buildUserPrompt(payload, repoName, commits) },
  ]
  const generated = await callChatCompletion(settings, messages)

  return buildReportRecord(payload, repoName, commits, generated)
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
    setNoStoreHeaders(res)
    res.json(ok(await repository.listCommitsByRepo(req.params.repoId)))
  })

  router.get('/commits', async (req, res) => {
    const repoId = typeof req.query.repoId === 'string' ? req.query.repoId : 'repo-1'
    setNoStoreHeaders(res)
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
      const { repoName, commits } = await resolveReportContext(repository, payload)
      const settings = await repository.getModelSettings()
      const preset = getPromptPreset(payload.style)
      const messages = [
        { role: 'system' as const, content: buildSystemPrompt(preset.name) },
        { role: 'user' as const, content: buildUserPrompt(payload, repoName, commits) },
      ]

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.flushHeaders?.()

      const generated = settings.enableStreaming
        ? await streamChatCompletion(
            settings,
            messages,
            (delta) => {
              if (!aborted) {
                writeSseEvent(res, 'delta', { delta })
              }
            },
            () => aborted,
          )
        : await callChatCompletion(settings, messages)

      if (aborted) return

      if (!settings.enableStreaming) {
        writeSseEvent(res, 'delta', { delta: generated.markdown })
      }

      const savedReport = await repository.saveReport(buildReportRecord(payload, repoName, commits, generated))
      if (aborted) return

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

  router.post('/update', async (req, res, next) => {
    try {
      const reportId = typeof req.body?.reportId === 'string' ? req.body.reportId : ''
      const markdown = typeof req.body?.markdown === 'string' ? req.body.markdown.trim() : ''
      if (!reportId) {
        res.status(400).json({ code: 400, message: '日报 ID 不能为空', data: null })
        return
      }

      if (!markdown) {
        res.status(400).json({ code: 400, message: '日报内容不能为空', data: null })
        return
      }

      const report = (await repository.listReports()).find((item) => item.id === reportId)
      if (!report) {
        res.status(404).json({ code: 404, message: '日报不存在', data: null })
        return
      }

      res.json(ok(await repository.saveReport(buildUpdatedReportRecord(report, markdown))))
    } catch (error) {
      next(error)
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
    setNoStoreHeaders(res)
    res.json(ok(await repository.listCommitsByRepo(repoId)))
  })

  return router
}
