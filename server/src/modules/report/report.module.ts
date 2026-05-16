import { Router } from 'express'
import { ok } from '../../common/types/api.js'
import { createAppRepository } from '../../database/repositories/app.repository.js'
import { reportSchema } from './schemas/report.schema.js'

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

  router.post('/generate', async (req, res) => {
    const payload = reportSchema.parse(req.body)
    res.json(
      ok(
        await repository.saveReport({
          id: crypto.randomUUID(),
          repoId: payload.repoId,
          repoName: 'daily-report-web',
          title: `AI 自动日报 - ${payload.repoId}`,
          summary: 'AI 已完成 Commit 聚合、Diff 归纳与业务价值提炼。',
          markdown: '1. 完成研发工作归类。\n2. 完成日报初稿生成。\n3. 支持继续推送飞书。',
          style: payload.style,
          commitIds: payload.commitIds,
          tokenCost: 2670,
          createdAt: new Date().toISOString(),
          pushStatus: 'pending',
          riskItems: ['真实 Git Diff 拉取仍待接入'],
          tomorrowPlan: ['对接真实后端流水线与飞书 OpenAPI'],
        }),
      ),
    )
  })

  router.post('/:id/send-feishu', async (req, res) => {
    await repository.markReportPushed(req.params.id)
    res.json(
      ok({
        reportId: req.params.id,
        success: true,
        message: '已推送到飞书机器人与日报文档。',
      }),
    )
  })

  router.post('/send-feishu', async (req, res) => {
    const body = req.body as { reportId?: string }
    if (body.reportId) {
      await repository.markReportPushed(body.reportId)
    }
    res.json(
      ok({
        reportId: body.reportId ?? '',
        success: true,
        message: '已推送到飞书机器人与日报文档。',
      }),
    )
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
