import { Router } from 'express'

const webhookEvents: Array<{
  timestamp: string
  body: unknown
}> = []

export function createStubWebhookModule() {
  const router = Router()

  router.get('/events', (_req, res) => {
    res.json({
      code: 0,
      message: 'ok',
      data: webhookEvents,
    })
  })

  router.post('/feishu-bot', (req, res) => {
    webhookEvents.unshift({
      timestamp: new Date().toISOString(),
      body: req.body,
    })

    if (webhookEvents.length > 20) {
      webhookEvents.length = 20
    }

    res.json({
      StatusCode: 0,
      StatusMessage: 'success',
    })
  })

  return router
}
