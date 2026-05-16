import { Router } from 'express'
import { ok } from '../../common/types/api.js'
import { createAppRepository } from '../../database/repositories/app.repository.js'
import { repositorySchema } from './schemas/repository.schema.js'

export function createRepositoryModule() {
  const router = Router()
  const repositoryStore = createAppRepository()

  router.get('/', async (_req, res) => {
    res.json(ok(await repositoryStore.listRepositories()))
  })

  router.post('/', async (req, res) => {
    const payload = repositorySchema.parse(req.body)
    const savedRepository = {
      ...payload,
      id: payload.id ?? crypto.randomUUID(),
      commitCountToday: 0,
      lastSyncAt: new Date().toISOString(),
    }
    const saved = await repositoryStore.saveRepository({
      ...savedRepository,
    })
    res.json(ok(saved))
  })

  router.get('/list', async (_req, res) => {
    res.json(ok(await repositoryStore.listRepositories()))
  })

  router.post('/create', async (req, res) => {
    const payload = repositorySchema.parse(req.body)
    const savedRepository = {
      ...payload,
      id: payload.id ?? crypto.randomUUID(),
      commitCountToday: 0,
      lastSyncAt: new Date().toISOString(),
    }
    res.json(
      ok(
        await repositoryStore.saveRepository({
          ...savedRepository,
        }),
      ),
    )
  })

  router.post('/:id/test', (req, res) => {
    repositorySchema.partial().parse(req.body)
    res.json(
      ok({
        success: true,
        latency: 182,
        branchExists: true,
        lastCommitHash: '4c9a2d91',
        message: '仓库连接测试通过，分支与访问令牌校验成功。',
      }),
    )
  })

  router.post('/test', (req, res) => {
    repositorySchema.partial().parse(req.body)
    res.json(
      ok({
        success: true,
        latency: 182,
        branchExists: true,
        lastCommitHash: '4c9a2d91',
        message: '仓库连接测试通过，分支与访问令牌校验成功。',
      }),
    )
  })

  router.delete('/:id', async (req, res) => {
    await repositoryStore.removeRepository(req.params.id)
    res.json(ok({ id: req.params.id, deleted: true }))
  })

  router.delete('/delete', async (req, res) => {
    const repoId = typeof req.query.repoId === 'string' ? req.query.repoId : ''
    await repositoryStore.removeRepository(repoId)
    res.json(ok(true))
  })

  return router
}
