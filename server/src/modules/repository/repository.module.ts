import { Router } from 'express'
import { ok } from '../../common/types/api.js'
import { createAppRepository } from '../../database/repositories/app.repository.js'
import { repositoryConnectionTestSchema, repositorySchema } from './schemas/repository.schema.js'
import { fetchRepositoryBranches, syncRepositoryCommits, testRepositoryConnection } from '../git-sync/git-sync.service.js'

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

  router.post('/:id/test', async (req, res) => {
    const payload = repositoryConnectionTestSchema.parse(req.body)
    res.json(ok(await testRepositoryConnection(payload)))
  })

  router.post('/test', async (req, res) => {
    const payload = repositoryConnectionTestSchema.parse(req.body)
    res.json(ok(await testRepositoryConnection(payload)))
  })

  router.post('/branches', async (req, res) => {
    const payload = repositorySchema.pick({
      provider: true,
      url: true,
      token: true,
    }).parse(req.body)

    const branches = await fetchRepositoryBranches(payload)

    res.json(
      ok(
        branches.map((branch) => ({
          label: branch,
          value: branch,
        })),
      ),
    )
  })

  router.post('/sync', async (req, res) => {
    const repoId = typeof req.body.repoId === 'string' ? req.body.repoId : ''
    const repository = await repositoryStore.getRepositoryById(repoId)

    if (!repository) {
      res.status(404).json({
        code: 404,
        message: '仓库不存在',
        data: null,
      })
      return
    }

    const commits = await syncRepositoryCommits(repository)
    await repositoryStore.replaceCommitsForRepo(repoId, commits)
    await repositoryStore.touchRepositorySync(repoId, commits.length)

    res.json(
      ok({
        repoId,
        syncedCount: commits.length,
        latestCommit: commits[0]?.shortHash ?? '',
        message: '仓库手动同步完成',
      }),
    )
  })

  router.delete('/delete', async (req, res) => {
    const repoId = typeof req.query.repoId === 'string' ? req.query.repoId : ''
    await repositoryStore.removeRepository(repoId)
    res.json(ok(true))
  })

  router.delete('/:id', async (req, res) => {
    await repositoryStore.removeRepository(req.params.id)
    res.json(ok({ id: req.params.id, deleted: true }))
  })

  return router
}
