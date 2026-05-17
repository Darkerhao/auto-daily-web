import type { UserProfile } from '@/types/auth'
import type { DashboardSummary } from '@/types/dashboard'
import type { FeishuConfig, ModelSettings } from '@/types/settings'
import type { CommitItem, GeneratedReport, PromptPreset } from '@/types/report'
import type { RepositoryItem } from '@/types/repository'

export const mockUser: UserProfile = {
  id: 'u-001',
  name: '陈北川',
  email: 'beichuan@jiazi.ai',
  avatar: 'https://api.dicebear.com/8.x/bottts/svg?seed=jiazi',
  role: 'admin',
  company: '甲子日报 AI',
  permissions: [
    'dashboard:view',
    'repository:manage',
    'report:generate',
    'feishu:manage',
    'settings:manage',
  ],
}

export const mockRepositories: RepositoryItem[] = [
  {
    id: 'repo-1',
    name: 'daily-report-web',
    provider: 'github',
    url: 'https://github.com/jiazi/daily-report-web',
    branch: 'main',
    token: 'ghp_example_token',
    syncFrequency: '10m',
    lastSyncAt: '2026-05-16 09:42',
    owner: 'frontend-platform',
    commitCountToday: 12,
    enabled: true,
    tags: ['Vue3', 'Naive UI', 'SaaS'],
  },
  {
    id: 'repo-2',
    name: 'ai-report-worker',
    provider: 'gitlab',
    url: 'https://gitlab.example.com/ai/report-worker',
    branch: 'release',
    token: 'glpat_example_token',
    syncFrequency: '30m',
    lastSyncAt: '2026-05-16 09:15',
    owner: 'infra-team',
    commitCountToday: 7,
    enabled: true,
    tags: ['Node.js', 'Queue'],
  },
  {
    id: 'repo-3',
    name: 'outsourcing-delivery',
    provider: 'gitee',
    url: 'https://gitee.com/jiazi/outsourcing-delivery',
    branch: 'master',
    token: 'gitee_example_token',
    syncFrequency: 'manual',
    lastSyncAt: '2026-05-15 20:38',
    owner: 'delivery-group',
    commitCountToday: 3,
    enabled: false,
    tags: ['外包项目', '交付'],
  },
]

export const mockCommits: CommitItem[] = [
  {
    id: 'commit-1',
    hash: 'a13d8ef7812f3d23c9db2f7989f4fbb133ee0a77',
    shortHash: 'a13d8ef',
    message: 'feat(report): 接入日报流式生成面板与 Prompt 模板切换',
    author: '陈北川',
    time: '2026-05-16 09:05',
    branch: 'feature/report-stream',
    modules: ['日报生成', 'AI 流式输出'],
    files: [
      {
        path: 'src/views/report/index.vue',
        language: 'vue',
        additions: 124,
        deletions: 18,
        patch: [
          '@@ -34,12 +35,28 @@',
          "- <ReportPreview :content='preview' />",
          "+ <AiStreamPanel :content='streamText' :loading='isGenerating' />",
          "+ <PromptTemplateTabs :options='promptPresets' v-model:value='activePromptId' />",
          '',
          '@@ -92,0 +110,8 @@',
          "+ const streamText = ref('')",
          "+ const activePromptId = ref('professional')",
        ],
      },
      {
        path: 'src/components/report/AiStreamPanel.vue',
        language: 'vue',
        additions: 86,
        deletions: 0,
        patch: [
          '@@ -0,0 +1,10 @@',
          "+ <template>",
          "+   <div class='ai-stream-panel'>",
          "+     <n-skeleton v-if='loading' text :repeat='5' />",
          "+   </div>",
          "+ </template>",
        ],
      },
    ],
  },
  {
    id: 'commit-2',
    hash: 'f29ae1b88a24e1e33e7cb0d9d4b9309f021f08ac',
    shortHash: 'f29ae1b',
    message: 'refactor(repo): 统一仓库连接测试与状态展示',
    author: '张清越',
    time: '2026-05-16 10:20',
    branch: 'refactor/repository-service',
    modules: ['仓库管理', '请求层'],
    files: [
      {
        path: 'src/api/modules/repository.ts',
        language: 'ts',
        additions: 38,
        deletions: 12,
        patch: [
          '@@ -1,7 +1,13 @@',
          "- export const testConnection = (id: string) => request.get(...)",
          "+ export const testConnection = (payload: RepositoryForm) => request.post(...)",
        ],
      },
      {
        path: 'src/views/repository/index.vue',
        language: 'vue',
        additions: 64,
        deletions: 21,
        patch: [
          '@@ -142,10 +142,18 @@',
          "- <n-tag type='info'>Connected</n-tag>",
          "+ <n-tag :type='connectionTagType'>{{ connectionStateText }}</n-tag>",
        ],
      },
    ],
  },
  {
    id: 'commit-3',
    hash: '9bc0ea12dd8a3df2e29f23759f6edc198e274f3a',
    shortHash: '9bc0ea1',
    message: 'fix(feishu): 修复飞书机器人推送重试和文档同步顺序',
    author: '林策',
    time: '2026-05-16 11:42',
    branch: 'fix/feishu-send',
    modules: ['飞书配置', '通知推送'],
    files: [
      {
        path: 'src/views/feishu/index.vue',
        language: 'vue',
        additions: 34,
        deletions: 6,
        patch: [
          '@@ -88,7 +88,11 @@',
          "- await sendWebhook()",
          "+ await sendWebhook()",
          "+ await syncDoc()",
          "+ notifySuccess('已完成机器人与文档双通道推送')",
        ],
      },
    ],
  },
]

export const mockReports: GeneratedReport[] = [
  {
    id: 'report-1',
    repoId: 'repo-1',
    repoName: 'daily-report-web',
    title: '日报生成链路与推送面板升级',
    summary: '完成日报生成核心页面的流式交互升级，并统一仓库连接测试与飞书推送反馈。',
    markdown: [
      '1. 完成日报生成页流式交互升级，新增 Prompt 模板切换、增量结果展示和日报预览联动，降低研发同学重复改稿成本。',
      '2. 重构仓库连接测试入口，统一 GitHub / GitLab / Gitee 的连接校验与状态反馈，提升多仓库接入效率。',
      '3. 修复飞书机器人推送与文档同步顺序，补充成功态反馈，降低日报投递不完整风险。',
      '',
      '风险项：',
      '- 生产环境需补充真实 webhook 失败码映射与退避重试策略。',
      '',
      '明日计划：',
      '- 接入 ECharts 统计视图，补齐日报趋势和 token 消耗看板。',
    ].join('\n'),
    style: 'professional',
    commitIds: ['commit-1', 'commit-2', 'commit-3'],
    tokenCost: 3482,
    createdAt: '2026-05-16 11:55',
    pushStatus: 'success',
    riskItems: ['飞书接口限流策略待接入', '多仓库并发生成仍需队列治理'],
    tomorrowPlan: ['接入图表统计面板', '联调真实 AI 模型服务'],
  },
  {
    id: 'report-2',
    repoId: 'repo-2',
    repoName: 'ai-report-worker',
    title: '生成队列稳定性加固',
    summary: '补充生成任务队列监控与异常恢复日志。',
    markdown: '1. 完成工作流队列重试策略梳理。\n2. 优化生成失败告警与定位信息。',
    style: 'management',
    commitIds: ['commit-2'],
    tokenCost: 1288,
    createdAt: '2026-05-15 18:20',
    pushStatus: 'pending',
    riskItems: ['部分外包仓库仍未接入 commit author 归属规则'],
    tomorrowPlan: ['完善仓库映射关系'],
  },
]

export const mockPromptPresets: PromptPreset[] = [
  {
    id: 'professional',
    name: '专业研发',
    content:
      '你是一名高级技术项目助手。请根据 Git Commit 与 Diff 内容，生成一份专业、真实、简洁的研发工作日报，突出业务价值、技术动作与风险项。',
  },
  {
    id: 'concise',
    name: '简洁模式',
    content: '请用最简洁但专业的语言总结今天的研发工作，不要虚构，不要重复 Commit Message。',
  },
  {
    id: 'management',
    name: '管理视角',
    content: '请站在技术负责人视角，突出阶段成果、风险与明日计划，适合直接同步给管理层。',
  },
]

export const mockDashboardSummary: DashboardSummary = {
  metrics: [
    { key: 'commits', label: '今日 Commit 数', value: '22', trend: '+18.6%', status: 'brand' },
    { key: 'reports', label: '今日生成日报', value: '14', trend: '+9.4%', status: 'success' },
    { key: 'tokens', label: 'AI Token 消耗', value: '18,420', trend: '+5.1%', status: 'warning' },
    { key: 'feishu', label: '飞书推送成功率', value: '98.4%', trend: '+1.8%', status: 'success' },
  ],
  tokenTrend: [
    { date: '05-12', value: 8400 },
    { date: '05-13', value: 10200 },
    { date: '05-14', value: 12100 },
    { date: '05-15', value: 14700 },
    { date: '05-16', value: 18420 },
  ],
  recentReports: mockReports,
  repositories: mockRepositories,
  activity: [
    {
      id: 'activity-1',
      title: '日报已推送到飞书群',
      description: 'daily-report-web 今日摘要已同步到 飞书-研发日报 群。',
      time: '5 分钟前',
      type: 'push',
    },
    {
      id: 'activity-2',
      title: '检测到新 Commit 批次',
      description: 'feature/report-stream 分支新增 3 个提交，待生成摘要。',
      time: '14 分钟前',
      type: 'commit',
    },
    {
      id: 'activity-3',
      title: '仓库连接测试通过',
      description: 'ai-report-worker 已通过 GitLab Release 分支权限校验。',
      time: '28 分钟前',
      type: 'system',
    },
  ],
}

export const mockSettings: ModelSettings = {
  provider: 'openai',
  modelName: 'gpt-4.1',
  apiKey: 'sk-example-key',
  baseUrl: 'https://api.openai.com/v1',
  temperature: 0.3,
  maxTokens: 3000,
  enableStreaming: true,
  mergeDuplicateCommits: true,
  defaultStyle: 'professional',
}

export const mockFeishuConfig: FeishuConfig = {
  webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/example',
  botSecret: 'bot-secret-example',
  docUrl: 'https://jiazi.feishu.cn/docx/example',
  appId: '',
  appSecret: '',
  autoSendTime: '18:30',
  enableRobot: true,
  enableDocSync: true,
}
