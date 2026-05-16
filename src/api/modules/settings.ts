import { request } from '../request'
import type { FeishuConfig, ModelSettings } from '@/types/settings'

export const settingsApi = {
  getModel() {
    return request.get<ModelSettings>('/settings/model')
  },
  saveModel(payload: ModelSettings) {
    return request.post<ModelSettings>('/settings/model', payload)
  },
  getFeishu() {
    return request.get<FeishuConfig>('/settings/feishu')
  },
  saveFeishu(payload: FeishuConfig) {
    return request.post<FeishuConfig>('/settings/feishu', payload)
  },
}
