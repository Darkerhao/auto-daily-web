import { z } from 'zod'

export const repositorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, '请输入仓库名称'),
  provider: z.enum(['github', 'gitlab', 'gitee', 'custom']),
  url: z.string().trim().url('请输入完整仓库地址，例如 https://github.com/org/repo'),
  branch: z.string().trim().min(1, '请选择或输入分支'),
  token: z.string().optional().default(''),
  syncFrequency: z.enum(['10m', '30m', '1h', 'manual']),
  owner: z.string().trim().min(1, '请输入 Owner'),
  enabled: z.boolean(),
  tags: z.array(z.string()),
})

export const repositoryConnectionTestSchema = repositorySchema.pick({
  provider: true,
  url: true,
  branch: true,
  token: true,
}).extend({
  branch: z.string().trim().min(1, '请选择或输入要测试的分支'),
})
