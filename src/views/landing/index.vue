<template>
  <div class="landing">
    <header class="landing__header page-shell">
      <AppLogo />
      <div class="landing__header-actions">
        <n-button text @click="router.push('/login')">登录</n-button>
        <n-button type="primary" @click="router.push('/workspace/dashboard')">进入控制台</n-button>
      </div>
    </header>

    <section class="landing__hero page-shell">
      <div class="landing__hero-copy">
        <span class="eyebrow">AI Daily Report Platform</span>
        <h1 class="landing__title">今天的代码，自动成为你的工作日报</h1>
        <p class="landing__desc">
          连接 Git 仓库，AI 自动分析 Commit 与 Diff，一键生成专业日报并同步飞书。适配研发团队、外包交付与企业 SaaS 场景。
        </p>
        <div class="landing__highlights info-pills">
          <span class="info-pill">流式生成</span>
          <span class="info-pill">多仓库聚合</span>
          <span class="info-pill">飞书双通道投递</span>
        </div>
        <div class="landing__cta">
          <n-button type="primary" size="large" @click="router.push('/login')">
            立即开始
            <template #icon>
              <ArrowRight :size="16" />
            </template>
          </n-button>
          <n-button size="large" secondary @click="router.push('/workspace/reports')">
            <template #icon>
              <Play :size="16" />
            </template>
            查看 Demo
          </n-button>
        </div>

        <div class="landing__metrics">
          <div class="landing__metric glass-panel">
            <strong>22+</strong>
            <span>今日 Commit 自动聚合</span>
            <small>覆盖前端平台、交付项目与 Worker 服务</small>
          </div>
          <div class="landing__metric glass-panel">
            <strong>98.4%</strong>
            <span>飞书推送成功率</span>
            <small>机器人消息与文档同步链路实时反馈</small>
          </div>
          <div class="landing__metric glass-panel">
            <strong>18,420</strong>
            <span>今日 Token 消耗监控</span>
            <small>按模型调用成本观察日报生成效率</small>
          </div>
        </div>
      </div>

      <div class="landing__hero-demo glass-panel-strong">
        <div class="landing__demo-orbit"></div>
        <div class="landing__demo-window">
          <div class="landing__demo-head surface-strip">
            <div class="landing__demo-head-main">
              <span class="landing__dot"></span>
              <span class="landing__dot"></span>
              <span class="landing__dot"></span>
              <div class="landing__demo-title">AI Daily Pipeline</div>
            </div>
            <div class="landing__demo-head-stats">
              <div class="metric-inline">
                <span>Active repos</span>
                <strong>12</strong>
              </div>
              <div class="metric-inline">
                <span>Generated today</span>
                <strong>14</strong>
              </div>
            </div>
          </div>

          <div class="landing__demo-flow">
            <div class="landing__stage">
              <GitBranch :size="18" />
              <div>
                <strong>Git Commit</strong>
                <span>多仓库提交批次聚合</span>
              </div>
            </div>
            <div class="landing__stage landing__stage--arrow">↓</div>
            <div class="landing__stage">
              <BrainCircuit :size="18" />
              <div>
                <strong>AI 分析</strong>
                <span>Diff 分类、风险识别、业务价值提炼</span>
              </div>
            </div>
            <div class="landing__stage landing__stage--arrow">↓</div>
            <div class="landing__stage">
              <NotebookText :size="18" />
              <div>
                <strong>日报生成</strong>
                <span>简洁 / 专业 / 管理风格可切换</span>
              </div>
            </div>
            <div class="landing__stage landing__stage--arrow">↓</div>
            <div class="landing__stage">
              <Webhook :size="18" />
              <div>
                <strong>飞书推送</strong>
                <span>机器人 + 文档双通道同步</span>
              </div>
            </div>
          </div>

          <div class="landing__demo-footer">
            <div class="landing__demo-log">
              <span class="landing__demo-log-label">最新事件</span>
              <strong>daily-report-web 已完成日报推送与文档同步</strong>
            </div>
            <div class="landing__demo-badge">Streaming Ready</div>
          </div>
        </div>
      </div>
    </section>

    <section class="landing__features page-shell">
      <div class="grid-3">
        <div class="landing__feature glass-panel section-card">
          <Bot :size="20" />
          <h3>AI 产品感交互</h3>
          <p>流式日报生成、Prompt 模板、多风格输出与可复制预览。</p>
        </div>
        <div class="landing__feature glass-panel section-card">
          <Cable :size="20" />
          <h3>多仓库接入</h3>
          <p>支持 GitHub、GitLab、Gitee 与自定义 Git 仓库，面向企业研发组织。</p>
        </div>
        <div class="landing__feature glass-panel section-card">
          <ChartNoAxesCombined :size="20" />
          <h3>SaaS 可扩展</h3>
          <p>目录结构、状态管理和主题系统均按企业级工程化方式搭建。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Cable,
  ChartNoAxesCombined,
  GitBranch,
  NotebookText,
  Play,
  Webhook,
} from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppLogo from '@/components/common/AppLogo.vue'

const router = useRouter()
</script>

<style scoped lang="less">
.landing {
  min-height: 100vh;
  padding-bottom: 56px;

  &__header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding-top: 18px;
  }

  &__header-actions {
    display: flex;
    gap: 12px;
  }

  &__hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: 24px;
    align-items: stretch;
    padding-top: 54px;
  }

  &__title {
    margin: 18px 0 0;
    font-size: clamp(44px, 8vw, 72px);
    line-height: 0.98;
    letter-spacing: -0.06em;
    max-width: 760px;
  }

  &__desc {
    margin-top: 22px;
    max-width: 640px;
    color: var(--text-2);
    font-size: 18px;
    line-height: 1.9;
  }

  &__highlights {
    margin-top: 26px;
  }

  &__cta {
    display: flex;
    gap: 14px;
    margin-top: 30px;
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 28px;
  }

  &__metric {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    strong {
      font-size: 28px;
      line-height: 1;
    }

    span {
      color: var(--text-3);
      line-height: 1.6;
      font-size: 13px;
    }

    small {
      color: var(--text-4);
      line-height: 1.6;
      font-size: 12px;
    }
  }

  &__hero-demo {
    position: relative;
    padding: 26px;
    overflow: hidden;
  }

  &__demo-orbit {
    position: absolute;
    width: 380px;
    height: 380px;
    border-radius: 50%;
    border: 1px solid rgba(122, 162, 255, 0.15);
    right: -80px;
    top: -80px;
    animation: spin 18s linear infinite;
  }

  &__demo-window {
    position: relative;
    z-index: 1;
    min-height: 100%;
    border-radius: 24px;
    padding: 20px;
    background: rgba(5, 9, 21, 0.42);
    border: 1px solid rgba(151, 196, 255, 0.12);
  }

  &__demo-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 16px 18px;
  }

  &__demo-head-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__demo-head-stats {
    display: flex;
    gap: 22px;
  }

  &__demo-title {
    color: var(--text-3);
    font-size: 12px;
    margin-left: 6px;
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.35);
  }

  &__demo-flow {
    margin-top: 26px;
    display: grid;
    gap: 12px;
  }

  &__stage {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 14px;
    padding: 18px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.03);
    align-items: center;

    strong {
      display: block;
    }

    span {
      display: block;
      margin-top: 6px;
      color: var(--text-3);
      font-size: 13px;
      line-height: 1.6;
    }

    &--arrow {
      display: grid;
      place-items: center;
      min-height: 34px;
      color: var(--brand-1);
      font-size: 24px;
      background: transparent;
    }
  }

  &__demo-footer {
    margin-top: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
  }

  &__demo-log {
    display: grid;
    gap: 6px;
    padding: 16px 18px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.03);
    flex: 1;
    min-width: 240px;

    strong {
      font-size: 14px;
    }
  }

  &__demo-log-label {
    color: var(--text-4);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  &__demo-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    background: rgba(118, 242, 198, 0.12);
    color: var(--brand-1);
    font-size: 13px;
    font-weight: 600;
  }

  &__features {
    margin-top: 26px;
  }

  &__feature {
    min-height: 100%;

    h3 {
      margin: 18px 0 0;
      font-size: 20px;
    }

    p {
      margin-top: 12px;
      color: var(--text-3);
      line-height: 1.7;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 960px) {
  .landing {
    &__hero {
      grid-template-columns: 1fr;
    }

    &__metrics {
      grid-template-columns: 1fr;
    }

    &__demo-head {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}

@media (max-width: 768px) {
  .landing {
    &__header {
      flex-direction: column;
      align-items: flex-start;
    }

    &__cta {
      flex-direction: column;
    }

    &__demo-head-stats {
      width: 100%;
      justify-content: space-between;
    }
  }
}
</style>
