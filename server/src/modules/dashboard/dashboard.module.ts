import { Router } from 'express'
import { ok } from '../../common/types/api.js'
import { createAppRepository } from '../../database/repositories/app.repository.js'

export function createDashboardModule() {
  const router = Router()
  const repository = createAppRepository()

  router.get('/summary', async (_req, res) => {
    res.json(ok(await repository.getDashboardSummary()))
  })

  return router
}
