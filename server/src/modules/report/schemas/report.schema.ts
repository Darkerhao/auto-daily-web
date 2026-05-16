import { z } from 'zod'

export const reportSchema = z.object({
  repoId: z.string(),
  commitIds: z.array(z.string()),
  promptTemplate: z.string(),
  style: z.enum(['concise', 'professional', 'management']),
})
