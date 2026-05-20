import { request } from '../request'
import type {
  CommitItem,
  FeishuSendPayload,
  FeishuSendResult,
  GenerateReportPayload,
  GeneratedReport,
  PromptPreset,
  UpdateReportPayload,
} from '@/types/report'

export const reportApi = {
  getCommits(repoId: string) {
    const params = new URLSearchParams({
      repoId,
      _t: Date.now().toString(),
    })

    return request.get<CommitItem[]>(`/commit/list?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    })
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
  updateReport(reportId: string, payload: UpdateReportPayload) {
    return request.post<GeneratedReport>('/report/update', { ...payload, reportId })
  },
  sendFeishu(payload: FeishuSendPayload) {
    return request.post<FeishuSendResult>('/report/send-feishu', payload)
  },
}
