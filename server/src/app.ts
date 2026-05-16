import express from 'express'
import cors from 'cors'
import { errorHandler } from './common/filters/error-handler.js'
import { createAuthModule } from './modules/auth/auth.module.js'
import { createDashboardModule } from './modules/dashboard/dashboard.module.js'
import { createRepositoryModule } from './modules/repository/repository.module.js'
import { createLegacyCommitModule, createReportModule } from './modules/report/report.module.js'
import { createSettingsModule } from './modules/settings/settings.module.js'
import { createSystemModule } from './modules/system/system.module.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    }),
  )
  app.use(express.json())

  app.use('/api/system', createSystemModule())
  app.use('/api/auth', createAuthModule())
  app.use('/api', createAuthModule())
  app.use('/api/dashboard', createDashboardModule())
  app.use('/api/repositories', createRepositoryModule())
  app.use('/api/repository', createRepositoryModule())
  app.use('/api/reports', createReportModule())
  app.use('/api/report', createReportModule())
  app.use('/api/commit', createLegacyCommitModule())
  app.use('/api/settings', createSettingsModule())

  app.use(errorHandler)
  return app
}
