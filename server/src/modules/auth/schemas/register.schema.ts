import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  company: z.string().min(1),
  gitUsername: z.string().min(1),
})
