import { request } from '../request'
import type {
  CommitItem,
  FeishuSendPayload,
  FeishuSendResult,
  GenerateReportPayload,
  GeneratedReport,
  PromptPreset,
} from '@/types/report'

export const reportApi = {
  getCommits(repoId: string) {
    return request.get<CommitItem[]>(`/commit/list?repoId=${repoId}`)
  },
  getReports() {
    return request.get<GeneratedReport[]>('/report/list')
  },
  getPrompts() {
    return request.get<PromptPreset[]>('/report/prompts')
  },
  generate(payload: GenerateReportPayload) {
    return request.post<GeneratedReport>('/report/generate', payload)
  },
  sendFeishu(payload: FeishuSendPayload) {
    return request.post<FeishuSendResult>('/report/send-feishu', payload)
  },
}
