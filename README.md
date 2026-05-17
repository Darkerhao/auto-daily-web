# 甲子日报 AI

基于 `Git Commit + Git Diff + AI` 的企业级日报生成平台。

目标是把研发团队每天的代码变更自动转换为专业日报，并最终同步到飞书。当前仓库已经升级为前后端单仓结构：

- `src/`：Vue 3 前端工作台
- `server/`：Node.js + TypeScript 后端骨架
- `deploy/`：Nginx 配置
- `docker-compose.yml`：ECS 单机部署骨架

默认开发模式优先走真实后端 API。
如果需要切回前端本地 Mock，可在根目录创建 `.env` 并配置：

```bash
VITE_USE_API_MOCK=true
```

## 技术栈

- `Vue 3`
- `TypeScript`
- `Vite`
- `Pinia`
- `Vue Router`
- `Naive UI`
- `Axios`
- `ECharts`
- `Less`
- `Node.js`
- `Express`
- `Zod`
- `Docker Compose`
- `Nginx`

## 当前能力

- Landing Page，突出 AI 产品感与 DevTool 风格
- 邮箱登录页，预留 GitHub / GitLab OAuth 入口
- 控制台 Dashboard，展示 Commit、日报、Token、飞书状态和趋势图
- 控制台 Dashboard 支持总览 / 洞察视图切换
- 仓库管理页，支持 GitHub / GitLab / Gitee / Custom 仓库配置
- 日报生成页，支持 Commit 选择、Diff 查看、Prompt 模板切换、流式生成、历史日报筛选、复制与飞书推送
- 飞书配置页，支持 Webhook、机器人 Secret、文档地址与定时发送配置
- 设置中心，支持 OpenAI / DeepSeek / Claude / Custom 模型配置，以及工作区信息本地持久化
- 前端 Mock API，请求拦截、响应解包与统一错误提示
- Node.js 后端接口骨架，已覆盖登录、Dashboard、仓库、日报、设置、健康检查
- 深色科技风主题，支持明暗主题切换
- 工作区名称、团队信息、侧边栏折叠和日报偏好支持本地持久化

## 目录结构

```text
src/
  api/                请求层、模块 API、Mock 注册
  assets/             静态资源
  components/         通用组件、Dashboard 组件、Report 组件
  hooks/              主题、权限、Loading、Clipboard、Socket 等 hooks
  layouts/            主工作台布局
  mock/               Mock 数据与模拟服务端
  router/             路由定义与守卫
  stores/             Pinia 状态管理
  styles/             全局样式与主题变量
  types/              领域类型定义
  utils/              Markdown、Diff、格式化、Storage 等工具
  views/              Landing、Auth、Dashboard、Repository、Report、Feishu、Settings

server/
  src/
    common/           通用响应与错误处理
    modules/          auth、dashboard、repository、report、settings、system
    store/            临时 mock 服务端数据
  .env.example
  package.json
  tsconfig.json

deploy/
  nginx/
    default.conf
```

## 快速开始

```bash
pnpm install
pnpm dev
```

后端开发：

```bash
pnpm --dir server install
pnpm dev:server
```

说明：

- `dev:server` 现在会先检查 `3000` 端口是否空闲
- 如果端口被其他进程占用，会直接退出并提示，避免前端代理继续报 `502`

如需初始化 PostgreSQL 表结构与种子数据：

```bash
pnpm --dir server db:init
```

前后端联调建议：

```bash
pnpm dev:server
pnpm dev
```

本地联调当前已验证通过：

- 登录接口
- Dashboard 概览接口
- 仓库列表读取
- 仓库测试连接
- 日报列表读取
- Commit 列表读取
- 日报生成写入
- 日报推送状态回写

默认开发地址：

```text
http://localhost:5173
```

## 可用脚本

```bash
pnpm dev
pnpm dev:server
pnpm dev:all
pnpm typecheck
pnpm build
pnpm build:server
pnpm build:all
pnpm preview
```

## 产品页面说明

### 1. 首页 Landing

- 产品定位说明
- Hero 区域
- Git Commit → AI 分析 → 日报生成 → 飞书推送演示链路
- 产品能力卡片

### 2. 登录页

- 邮箱登录
- GitHub 登录预留
- GitLab 登录预留

### 3. 控制台 Dashboard

- 今日 Commit 数
- 今日生成日报数
- AI Token 消耗
- 飞书推送成功率
- Token 趋势图
- 实时活动流
- 仓库概览
- 总览 / 洞察视图切换

### 4. 仓库管理

- 仓库新增
- 仓库编辑
- 仓库删除
- 连接测试
- 拉取频率管理

### 5. 日报生成页

- Commit 列表
- Diff 文件树
- Diff 详情查看
- Prompt 模板切换
- AI 流式生成
- 日报历史筛选与回看
- Markdown 日报预览
- 一键复制
- 一键推送飞书

### 6. 飞书配置

- Webhook
- Bot Secret
- 飞书文档地址
- 自动发送时间

### 7. 设置中心

- 模型厂商切换
- API Key
- Base URL
- Temperature
- Max Tokens
- 默认日报风格
- 工作区名称、团队名称、运行环境配置

## 工程说明

- 请求层在 [src/api/request.ts](./src/api/request.ts) 中统一处理 Mock、鉴权头、错误提示与响应解包。
- Mock 服务在 [src/mock/server.ts](./src/mock/server.ts) 中模拟登录、仓库、Commit、日报、飞书和模型配置接口。
- 主题系统在 [src/styles/tokens.less](./src/styles/tokens.less) 与 [src/hooks/useTheme.ts](./src/hooks/useTheme.ts) 中集中管理。
- 路由与权限守卫在 [src/router/index.ts](./src/router/index.ts) 中实现。
- 工作台布局在 [src/layouts/AppLayout.vue](./src/layouts/AppLayout.vue) 中定义。
- 日报生成核心页在 [src/views/report/index.vue](./src/views/report/index.vue) 中实现。
- 后端入口在 [server/src/main.ts](./server/src/main.ts)。
- 后端应用装配在 [server/src/app.ts](./server/src/app.ts)。
- 当前服务端模块已按 `auth / dashboard / repository / report / settings / system` 分层。
- 前端入口默认不再强制注入 mock，只有 `VITE_USE_API_MOCK=true` 时才会加载 [src/api/mock.ts](./src/api/mock.ts)。
- 数据层已升级为 `PostgreSQL 优先、内存仓储回退`。未配置 `DATABASE_URL` 时仍可本地无数据库运行。

## 构建与优化

当前已做：

- `ECharts` 按需引入，避免全量打包
- `Vite manualChunks` 分离 `vue`、`naive-ui`、`echarts`、`utils` vendor 包
- 路由页面按页面维度懒加载

## 后端接口骨架

当前 `server/` 已提供这些接口骨架：

- `GET /api/system/health`
- `POST /api/auth/login`
- `GET /api/dashboard/summary`
- `GET /api/repositories`
- `POST /api/repositories`
- `POST /api/repositories/:id/test`
- `DELETE /api/repositories/:id`
- `GET /api/reports/commits/:repoId`
- `GET /api/reports`
- `GET /api/reports/prompts`
- `POST /api/reports/generate`
- `POST /api/reports/:id/send-feishu`
- `GET /api/settings/model`
- `POST /api/settings/model`
- `GET /api/settings/feishu`
- `POST /api/settings/feishu`

并兼容前端当前仍在使用的旧路径风格：

- `GET /api/repository/list`
- `POST /api/repository/create`
- `DELETE /api/repository/delete?repoId=...`
- `POST /api/repository/test`
- `GET /api/commit/list?repoId=...`
- `GET /api/report/list`
- `GET /api/report/prompts`
- `POST /api/report/generate`
- `POST /api/report/send-feishu`

## ECS 部署骨架

当前仓库已提供单机 ECS 的基础部署骨架：

- [docker-compose.yml](./docker-compose.yml)
- [deploy/nginx/default.conf](./deploy/nginx/default.conf)

包含服务：

- `web`：前端静态资源
- `api`：Node.js 后端
- `postgres`：数据库
- `redis`：缓存与队列预留

数据库初始化：

- `api` 容器启动时会自动执行 `pnpm db:init`
- `redis` 默认只在 Docker 内网暴露，不绑定宿主机 `6379`，避免与本机已有 Redis 冲突

## 后续建议

建议继续推进以下方向：

1. 接入真实后端接口与 Git / 飞书 OAuth。
2. 接入真实 `SSE` 或 `WebSocket` 流式生成链路。
3. 增加租户、团队、成员、权限与工作区配置，推进 SaaS 化。
4. 增加日报历史检索、统计分析和 ECharts 看板扩展。
5. 补充单元测试、组件测试与契约测试。
