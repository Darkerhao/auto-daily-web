import { Router } from 'express'
import { ok } from '../../common/types/api.js'
import { createAppRepository } from '../../database/repositories/app.repository.js'
import { syncRepositorySchema } from './schemas/sync.schema.js'
import { syncRepositoryCommits } from './git-sync.service.js'

export function createGitSyncModule() {
  const router = Router()
  const repositoryStore = createAppRepository()

  router.post('/repository', async (req, res) => {
    const payload = syncRepositorySchema.parse(req.body)
    const repository = await repositoryStore.getRepositoryById(payload.repoId)

    if (!repository) {
      res.status(404).json({
        code: 404,
        message: '仓库不存在',
        data: null,
      })
      return
    }

    const commits = await syncRepositoryCommits(repository)
    await repositoryStore.replaceCommitsForRepo(payload.repoId, commits)
    await repositoryStore.touchRepositorySync(payload.repoId, commits.length)

    res.json(
      ok({
        repoId: payload.repoId,
        syncedCount: commits.length,
        latestCommit: commits[0]?.shortHash ?? '',
        message: '仓库手动同步完成',
      }),
    )
  })

  return router
}
