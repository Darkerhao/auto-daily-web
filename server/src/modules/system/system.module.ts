import { Router } from 'express'
import { ok } from '../../common/types/api.js'
import { getDatabaseMode } from '../../database/pg/client.js'

export function createSystemModule() {
  const router = Router()

  router.get('/health', (_req, res) => {
    res.json(
      ok({
        status: 'ok',
        service: 'jiazi-daily-ai-server',
        timestamp: new Date().toISOString(),
        databaseMode: getDatabaseMode(),
      }),
    )
  })

  return router
}
