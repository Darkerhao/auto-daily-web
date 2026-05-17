export type ModelProvider = 'openai' | 'deepseek' | 'claude' | 'custom'

export interface ModelSettings {
  provider: ModelProvider
  modelName: string
  apiKey: string
  baseUrl: string
  temperature: number
  maxTokens: number
  enableStreaming: boolean
  mergeDuplicateCommits: boolean
  defaultStyle: 'professional' | 'concise' | 'management'
}

export interface FeishuConfig {
  webhookUrl: string
  botSecret: string
  docUrl: string
  appId: string
  appSecret: string
  autoSendTime: string
  enableRobot: boolean
  enableDocSync: boolean
}
