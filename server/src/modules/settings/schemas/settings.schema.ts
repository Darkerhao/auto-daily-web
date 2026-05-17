import { z } from 'zod'

export const modelSettingsSchema = z.object({
  provider: z.enum(['openai', 'deepseek', 'claude', 'custom']),
  modelName: z.string(),
  apiKey: z.string(),
  baseUrl: z.string(),
  temperature: z.number(),
  maxTokens: z.number(),
  enableStreaming: z.boolean(),
  mergeDuplicateCommits: z.boolean(),
  defaultStyle: z.enum(['professional', 'concise', 'management']),
})

export const feishuSettingsSchema = z.object({
  webhookUrl: z.string(),
  botSecret: z.string(),
  docUrl: z.string(),
  appId: z.string(),
  appSecret: z.string(),
  autoSendTime: z.string(),
  enableRobot: z.boolean(),
  enableDocSync: z.boolean(),
})
