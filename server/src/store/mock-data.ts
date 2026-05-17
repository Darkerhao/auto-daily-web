export const user = {
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

export const repositories = [
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
]

export const reports = [
  {
    id: 'report-1',
    repoId: 'repo-1',
    repoName: 'daily-report-web',
    title: '日报生成链路与推送面板升级',
    summary: '完成日报生成核心页面的流式交互升级，并统一仓库连接测试与飞书推送反馈。',
    markdown:
      '1. 完成日报生成页流式交互升级。\n2. 重构仓库连接测试入口。\n3. 修复飞书机器人推送与文档同步顺序。',
    style: 'professional',
    commitIds: ['commit-1', 'commit-2', 'commit-3'],
    tokenCost: 3482,
    createdAt: '2026-05-16 11:55',
    pushStatus: 'success',
    riskItems: ['飞书接口限流策略待接入'],
    tomorrowPlan: ['接入图表统计面板'],
  },
]

export const commits = [
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
        patch: ['@@ -34,12 +35,28 @@', "+ <AiStreamPanel :content='streamText' :loading='isGenerating' />"],
      },
    ],
  },
]

export const dashboardSummary = {
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
  recentReports: reports,
  repositories,
  activity: [
    {
      id: 'activity-1',
      title: '日报已推送到飞书群',
      description: 'daily-report-web 今日摘要已同步到 飞书-研发日报 群。',
      time: '5 分钟前',
      type: 'push',
    },
  ],
}

export const modelSettings = {
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

export const feishuConfig = {
  webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/example',
  botSecret: 'bot-secret-example',
  docUrl: 'https://jiazi.feishu.cn/docx/example',
  appId: '',
  appSecret: '',
  autoSendTime: '18:30',
  enableRobot: true,
  enableDocSync: true,
}
