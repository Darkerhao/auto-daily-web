import { Router } from 'express'
import { ok } from '../../common/types/api.js'
import { createAppRepository } from '../../database/repositories/app.repository.js'
import { feishuSettingsSchema, modelSettingsSchema } from './schemas/settings.schema.js'

export function createSettingsModule() {
  const router = Router()
  const repository = createAppRepository()

  router.get('/model', async (_req, res) => {
    res.json(ok(await repository.getModelSettings()))
  })

  router.post('/model', async (req, res) => {
    const payload = modelSettingsSchema.parse(req.body)
    res.json(ok(await repository.saveModelSettings(payload)))
  })

  router.get('/feishu', async (_req, res) => {
    res.json(ok(await repository.getFeishuConfig()))
  })

  router.post('/feishu', async (req, res) => {
    const payload = feishuSettingsSchema.parse(req.body)
    res.json(ok(await repository.saveFeishuConfig(payload)))
  })

  return router
}
