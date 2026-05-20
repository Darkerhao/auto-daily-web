import { Router } from 'express'
import { ok } from '../../common/types/api.js'
import { createAppRepository } from '../../database/repositories/app.repository.js'
import { loginSchema } from './schemas/login.schema.js'
import { registerSchema } from './schemas/register.schema.js'

const defaultPermissions = [
  'dashboard:view',
  'repository:manage',
  'report:generate',
  'feishu:manage',
  'settings:manage',
  'user:manage',
]

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

  router.post('/auth/register', async (req, res) => {
    const payload = registerSchema.parse(req.body)
    const now = new Date().toISOString()
    const user = await repository.saveUser({
      id: crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      avatar: `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(payload.email)}`,
      role: 'developer',
      company: payload.company,
      gitUsername: payload.gitUsername,
      createdAt: now,
      lastLoginAt: now,
      permissions: defaultPermissions,
    })

    res.json(
      ok({
        token: 'mock-jiazi-token',
        user,
      }),
    )
  })

  router.get('/users', async (_req, res) => {
    res.json(ok(await repository.listUsers()))
  })

  return router
}
