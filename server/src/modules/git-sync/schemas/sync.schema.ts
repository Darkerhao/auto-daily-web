import { z } from 'zod'

export const syncRepositorySchema = z.object({
  repoId: z.string(),
})
