import { z } from 'zod'

export const repositorySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  provider: z.enum(['github', 'gitlab', 'gitee', 'custom']),
  url: z.string(),
  branch: z.string(),
  token: z.string(),
  syncFrequency: z.enum(['10m', '30m', '1h', 'manual']),
  owner: z.string(),
  enabled: z.boolean(),
  tags: z.array(z.string()),
})
