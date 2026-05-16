<template>
  <div class="page-shell">
    <SectionHeader
      eyebrow="Dashboard"
      title="研发日报自动化总览"
      description="聚合今日 Commit、日报生成、AI Token 与飞书推送状态，适合作为团队研发日报中台首页。"
    >
      <n-space>
        <n-select v-model:value="dashboardView" :options="dashboardViewOptions" style="width: 180px" />
      </n-space>
    </SectionHeader>

    <div class="stats-grid">
      <MetricCard v-for="item in metrics" :key="item.key" :item="item" />
    </div>

    <div class="grid-2 dashboard-grid">
      <div class="dashboard-grid__main">
        <div class="glass-panel section-card">
          <h3 class="panel-title">Token 消耗趋势</h3>
          <p class="panel-subtitle">用于观察日报生成成本与模型调用稳定性。</p>
          <TokenTrendChart :data="tokenTrend" />
        </div>

        <div v-if="dashboardView === 'overview'" class="glass-panel section-card">
          <h3 class="panel-title">最近日报</h3>
          <p class="panel-subtitle">最近生成的日报摘要，便于直接回看与二次推送。</p>
          <n-data-table :columns="reportColumns" :data="recentReports" :bordered="false" />
        </div>
        <div v-else class="glass-panel section-card">
          <h3 class="panel-title">团队工作负载洞察</h3>
          <p class="panel-subtitle">结合日报摘要与 Token 开销，快速识别近期重点仓库与输出密度。</p>
          <div class="dashboard-grid__insight-list">
            <div v-for="report in recentReports" :key="report.id" class="dashboard-grid__insight-item">
              <div>
                <strong>{{ report.repoName }}</strong>
                <div class="muted">{{ report.summary }}</div>
              </div>
              <div class="dashboard-grid__insight-meta mono">{{ report.tokenCost }} tokens</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid__side">
        <ActivityFeed />

        <div class="glass-panel section-card">
          <h3 class="panel-title">仓库概览</h3>
          <div class="dashboard-grid__repo-list">
            <div v-for="repo in repositories" :key="repo.id" class="dashboard-grid__repo-item">
              <div>
                <strong>{{ repo.name }}</strong>
                <div class="muted">{{ repo.provider }} · {{ repo.branch }}</div>
              </div>
              <n-tag :type="repo.enabled ? 'success' : 'warning'" round :bordered="false">
                {{ repo.enabled ? 'Active' : 'Paused' }}
              </n-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NTag, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import MetricCard from '@/components/common/MetricCard.vue'
import SectionHeader from '@/components/common/SectionHeader.vue'
import ActivityFeed from '@/components/dashboard/ActivityFeed.vue'
import TokenTrendChart from '@/components/dashboard/TokenTrendChart.vue'
import { useDashboardStore } from '@/stores/dashboard'
import type { GeneratedReport } from '@/types/report'
import { formatRelativeTime } from '@/utils/format'

const dashboardStore = useDashboardStore()
const router = useRouter()
const message = useMessage()
const dashboardView = computed({
  get: () => dashboardStore.dashboardView,
  set: (value: 'overview' | 'insight') => dashboardStore.setDashboardView(value),
})
const dashboardViewOptions = [
  { label: '总览', value: 'overview' },
  { label: '洞察', value: 'insight' },
]

const metrics = computed(() => dashboardStore.summary?.metrics ?? [])
const tokenTrend = computed(() => dashboardStore.summary?.tokenTrend ?? [])
const recentReports = computed(() => dashboardStore.summary?.recentReports ?? [])
const repositories = computed(() => dashboardStore.summary?.repositories ?? [])

const reportColumns: DataTableColumns<GeneratedReport> = [
  {
    title: '标题',
    key: 'title',
  },
  {
    title: '推送状态',
    key: 'pushStatus',
    render(row) {
      const type = row.pushStatus === 'success' ? 'success' : row.pushStatus === 'pending' ? 'warning' : 'error'
      return h(NTag, { type, round: true, bordered: false }, { default: () => row.pushStatus })
    },
  },
  {
    title: '生成时间',
    key: 'createdAt',
    render(row) {
      return formatRelativeTime(row.createdAt)
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => {
            message.info(`已定位到日报：${row.title}`)
            router.push({
              path: '/workspace/reports',
              query: { reportId: row.id, repoId: row.repoId },
            })
          },
        },
        { default: () => '查看' },
      )
    },
  },
]

onMounted(() => {
  void dashboardStore.fetchSummary()
})
</script>

<style scoped lang="less">
.dashboard-grid {
  margin-top: 16px;

  &__main,
  &__side {
    display: grid;
    gap: 16px;
  }

  &__repo-list {
    margin-top: 18px;
    display: grid;
    gap: 12px;
  }

  &__insight-list {
    margin-top: 18px;
    display: grid;
    gap: 12px;
  }

  &__insight-item {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
    padding: 16px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.03);
  }

  &__insight-meta {
    color: var(--brand-1);
    white-space: nowrap;
  }

  &__repo-item {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid rgba(151, 196, 255, 0.08);
  }
}
</style>
