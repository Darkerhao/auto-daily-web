import type { InternalAxiosRequestConfig } from 'axios'
import { registerMock, getRequestPayload } from './request'
import * as mockServer from '@/mock/server'
import type { LoginPayload } from '@/types/auth'
import type { FeishuConfig, ModelSettings } from '@/types/settings'
import type { FeishuSendPayload, GenerateReportPayload } from '@/types/report'
import type { RepositoryForm } from '@/types/repository'

function ok<T>(data: T, message = 'ok') {
  return {
    code: 0,
    message,
    data,
  }
}

function queryRepoId(config: InternalAxiosRequestConfig) {
  const rawUrl = config.url ?? ''
  const match = rawUrl.match(/repoId=([^&]+)/)
  return match?.[1]
}

registerMock('POST', '/login', async (config) => ok(await mockServer.login(getRequestPayload<LoginPayload>(config))))
registerMock('GET', '/dashboard/summary', async () => ok(await mockServer.getDashboard()))
registerMock('GET', '/repository/list', async () => ok(await mockServer.getRepositories()))
registerMock('POST', '/repository/create', async (config) =>
  ok(await mockServer.saveRepository(getRequestPayload<RepositoryForm>(config))),
)
registerMock('DELETE', '/repository/delete', async (config) => {
  const id = queryRepoId(config) ?? ''
  return ok(await mockServer.removeRepository(id))
})
registerMock('POST', '/repository/test', async (config) =>
  ok(await mockServer.testRepositoryConnection(getRequestPayload<RepositoryForm>(config))),
)
registerMock('GET', '/commit/list', async (config) => ok(await mockServer.getCommits(queryRepoId(config))))
registerMock('GET', '/report/list', async () => ok(await mockServer.getReports()))
registerMock('GET', '/report/prompts', async () => ok(await mockServer.getPromptPresets()))
registerMock('POST', '/report/generate', async (config) =>
  ok(await mockServer.generateReport(getRequestPayload<GenerateReportPayload>(config))),
)
registerMock('POST', '/report/send-feishu', async (config) =>
  ok(await mockServer.sendFeishu(getRequestPayload<FeishuSendPayload>(config))),
)
registerMock('GET', '/settings/model', async () => ok(await mockServer.getSettings()))
registerMock('POST', '/settings/model', async (config) =>
  ok(await mockServer.saveSettings(getRequestPayload<ModelSettings>(config))),
)
registerMock('GET', '/settings/feishu', async () => ok(await mockServer.getFeishuConfig()))
registerMock('POST', '/settings/feishu', async (config) =>
  ok(await mockServer.saveFeishuConfig(getRequestPayload<FeishuConfig>(config))),
)
