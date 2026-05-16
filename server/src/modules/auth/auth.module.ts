import { Router } from 'express'
import { ok } from '../../common/types/api.js'
import { createAppRepository } from '../../database/repositories/app.repository.js'
import { loginSchema } from './schemas/login.schema.js'

export function createAuthModule() {
  const router = Router()
  const repository = createAppRepository()

  router.post('/login', async (req, res) => {
    const payload = loginSchema.parse(req.body)
    const user = await repository.getUser()
    res.json(
      ok({
        token: 'mock-jiazi-token',
        user: {
          ...user,
          email: payload.email,
        },
      }),
    )
  })

  return router
}
