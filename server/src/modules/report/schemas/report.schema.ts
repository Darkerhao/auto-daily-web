import { z } from 'zod'

export const reportSchema = z.object({
  repoId: z.string(),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gitUsername: z.string().min(1),
  promptTemplate: z.string().default(''),
  style: z.enum(['concise', 'professional', 'management']),
})
