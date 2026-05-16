import { ref } from 'vue'
import { defineStore } from 'pinia'
import { settingsApi } from '@/api/modules/settings'
import type { FeishuConfig, ModelSettings } from '@/types/settings'

export const useSettingsStore = defineStore('settings', () => {
  const modelSettings = ref<ModelSettings | null>(null)
  const feishuConfig = ref<FeishuConfig | null>(null)

  async function fetchModelSettings() {
    modelSettings.value = await settingsApi.getModel()
    return modelSettings.value
  }

  async function saveModelSettings(payload: ModelSettings) {
    modelSettings.value = await settingsApi.saveModel(payload)
    return modelSettings.value
  }

  async function fetchFeishuConfig() {
    feishuConfig.value = await settingsApi.getFeishu()
    return feishuConfig.value
  }

  async function saveFeishuConfig(payload: FeishuConfig) {
    feishuConfig.value = await settingsApi.saveFeishu(payload)
    return feishuConfig.value
  }

  return {
    modelSettings,
    feishuConfig,
    fetchModelSettings,
    saveModelSettings,
    fetchFeishuConfig,
    saveFeishuConfig,
  }
})
