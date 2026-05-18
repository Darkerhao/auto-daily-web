<template>
  <div class="page-shell">
    <SectionHeader
      eyebrow="Core Workspace"
      title="日报生成工作台"
      description="左侧查看 Commit 与 Diff，右侧流式生成日报，可调整语气、一键复制并推送飞书。"
    >
      <n-space>
        <n-select v-model:value="selectedRepoId" :options="repoOptions" style="width: 240px" />
        <n-button secondary @click="handleSyncRepository">同步并刷新</n-button>
        <n-button :loading="generating" type="primary" @click="handleGenerate">重新生成</n-button>
      </n-space>
    </SectionHeader>

    <div class="report-grid__toolbar surface-strip">
      <div class="metric-inline">
        <span>当前仓库</span>
        <strong>{{ currentRepoName }}</strong>
      </div>
      <div class="info-pills">
        <span class="info-pill">已选 Commit {{ selectedCommitIds.length }}</span>
        <span class="info-pill">待分析文件 {{ selectedFiles.length }}</span>
        <span class="info-pill">输出风格 {{ selectedPromptName }}</span>
      </div>
    </div>

    <div class="report-grid">
      <div class="report-grid__left">
        <CommitList v-model:selected-ids="selectedCommitIds" :commits="commits" />

        <div class="glass-panel section-card">
          <div class="report-grid__section-head">
            <div>
              <h3 class="panel-title">Diff 文件树</h3>
              <div class="panel-subtitle">优先查看本次选中提交关联的文件变更，再决定是否重新生成日报。</div>
            </div>
            <div class="info-pill mono">{{ selectedFiles.length }} files</div>
          </div>
          <div class="report-grid__file-list">
            <button
              v-for="file in selectedFiles"
              :key="file.path"
              type="button"
              :class="['report-grid__file', activeFile?.path === file.path ? 'is-active' : '']"
              @click="activeFile = file"
            >
              <span>{{ file.path }}</span>
              <small class="mono">{{ file.status ?? 'modified' }} · +{{ file.additions }} / -{{ file.deletions }}</small>
            </button>
          </div>
        </div>

        <DiffViewer v-if="activeFile" :file="activeFile" />
      </div>

      <div class="report-grid__right">
        <AiStreamPanel :content="streamPanelContent" :loading="generating" :mode="streamPanelMode" />
        <PromptTemplateTabs v-model:value="selectedPromptId" :options="prompts" />

        <div class="glass-panel section-card">
          <h3 class="panel-title">日报历史</h3>
          <div class="panel-subtitle">按仓库、风格、推送状态和关键词快速回看历史日报。</div>
          <div class="report-grid__history-filters">
            <n-input v-model:value="historyKeyword" placeholder="搜索日报标题或摘要" />
            <n-select v-model:value="historyRepoId" :options="historyRepoOptions" />
            <n-select v-model:value="historyStyle" :options="styleOptions" />
            <n-select v-model:value="historyPushStatus" :options="pushStatusOptions" />
          </div>
          <div class="report-grid__history-list">
            <button
              v-for="item in filteredReports"
              :key="item.id"
              type="button"
              :class="['report-grid__history-item', currentReport?.id === item.id ? 'is-active' : '']"
              @click="handleSelectHistory(item)"
            >
              <div>
                <strong>{{ item.title }}</strong>
                <div class="muted">{{ item.repoName }} · {{ item.style }} · {{ item.pushStatus }}</div>
                <p class="report-grid__history-summary">{{ item.summary }}</p>
              </div>
              <span class="mono">{{ item.tokenCost }}</span>
            </button>
          </div>
        </div>

        <div class="glass-panel section-card">
          <div class="report-grid__actions">
            <div>
              <h3 class="panel-title">日报预览</h3>
              <div class="panel-subtitle">可复制、可再次生成、可推送至飞书。</div>
            </div>
            <n-space>
              <n-button secondary @click="handleCopy">一键复制</n-button>
              <n-button type="primary" :disabled="!currentReport" @click="handlePushFeishu">推送飞书</n-button>
            </n-space>
          </div>
          <MarkdownPreview :content="currentReport?.markdown ?? defaultPreview" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute } from 'vue-router'
import CommitList from '@/components/report/CommitList.vue'
import PromptTemplateTabs from '@/components/report/PromptTemplateTabs.vue'
import AiStreamPanel from '@/components/report/AiStreamPanel.vue'
import DiffViewer from '@/components/common/DiffViewer.vue'
import MarkdownPreview from '@/components/common/MarkdownPreview.vue'
import SectionHeader from '@/components/common/SectionHeader.vue'
import { copyText } from '@/hooks/useClipboard'
import { useLoading } from '@/hooks/useLoading'
import { useReportStore } from '@/stores/report'
import { useRepositoryStore } from '@/stores/repository'
import type { DiffFile, GeneratedReport, PushStatus, ReportTone } from '@/types/report'

const reportStore = useReportStore()
const repositoryStore = useRepositoryStore()
const route = useRoute()
const message = useMessage()
const { loading: generating, withLoading } = useLoading()

const selectedCommitIds = ref<string[]>([])
const activeFile = ref<DiffFile | null>(null)
const defaultPreview = '日报尚未生成，选择 Commit 后点击“重新生成”开始分析。'

const selectedRepoId = computed({
  get: () => reportStore.selectedRepoId,
  set: (value: string) => {
    reportStore.selectedRepoId = value
  },
})

const selectedPromptId = computed({
  get: () => reportStore.selectedPromptId,
  set: (value: ReportTone) => {
    reportStore.selectedPromptId = value
  },
})

const historyKeyword = computed({
  get: () => reportStore.historyFilters.keyword,
  set: (value: string) => reportStore.patchHistoryFilters({ keyword: value }),
})

const historyRepoId = computed({
  get: () => reportStore.historyFilters.repoId,
  set: (value: string) => reportStore.patchHistoryFilters({ repoId: value }),
})

const historyStyle = computed({
  get: () => reportStore.historyFilters.style,
  set: (value: ReportTone | 'all') => reportStore.patchHistoryFilters({ style: value }),
})

const historyPushStatus = computed({
  get: () => reportStore.historyFilters.pushStatus,
  set: (value: PushStatus | 'all') => reportStore.patchHistoryFilters({ pushStatus: value }),
})

const repoOptions = computed(() =>
  repositoryStore.repositories.map((item) => ({
    label: item.name,
    value: item.id,
  })),
)

const commits = computed(() => reportStore.commits)
const prompts = computed(() => reportStore.prompts)
const currentReport = computed(() => reportStore.currentReport ?? reportStore.reports[0] ?? null)
const currentRepoName = computed(
  () => repositoryStore.repositories.find((item) => item.id === selectedRepoId.value)?.name ?? '未选择仓库',
)
const selectedPromptName = computed(
  () => prompts.value.find((item) => item.id === selectedPromptId.value)?.name ?? '未选择风格',
)
const streamPanelMode = computed<'live' | 'recent' | 'summary'>(() => {
  if (generating.value || reportStore.streamContent.trim().length > 0) {
    return 'live'
  }

  if (
    currentReport.value &&
    currentReport.value.id === reportStore.latestStreamReportId &&
    reportStore.latestStreamContent.trim().length > 0
  ) {
    return 'recent'
  }

  return 'summary'
})
const streamPanelContent = computed(() => {
  const liveStream = reportStore.streamContent.trim()
  if (liveStream.length > 0) {
    return liveStream
  }

  if (
    currentReport.value &&
    currentReport.value.id === reportStore.latestStreamReportId &&
    reportStore.latestStreamContent.trim().length > 0
  ) {
    return reportStore.latestStreamContent
  }

  if (!currentReport.value) {
    return ''
  }

  return [
    `当前展示的是历史日报摘要：${currentReport.value.title}`,
    `仓库：${currentReport.value.repoName} · 风格：${currentReport.value.style} · Token：${currentReport.value.tokenCost}`,
    '',
    currentReport.value.summary,
    '',
    `风险项：${currentReport.value.riskItems.join('；') || '暂无'}`,
    `明日计划：${currentReport.value.tomorrowPlan.join('；') || '暂无'}`,
  ].join('\n')
})
const filteredReports = computed(() => {
  const keyword = reportStore.historyFilters.keyword.trim().toLowerCase()
  return reportStore.reports.filter((item) => {
    const repoMatched =
      reportStore.historyFilters.repoId === 'all' || item.repoId === reportStore.historyFilters.repoId
    const styleMatched =
      reportStore.historyFilters.style === 'all' || item.style === reportStore.historyFilters.style
    const statusMatched =
      reportStore.historyFilters.pushStatus === 'all' ||
      item.pushStatus === reportStore.historyFilters.pushStatus
    const keywordMatched =
      keyword.length === 0 ||
      item.title.toLowerCase().includes(keyword) ||
      item.summary.toLowerCase().includes(keyword)
    return repoMatched && styleMatched && statusMatched && keywordMatched
  })
})
const historyRepoOptions = computed(() => [{ label: '全部仓库', value: 'all' }, ...repoOptions.value])
const styleOptions = [
  { label: '全部风格', value: 'all' },
  { label: '专业研发', value: 'professional' },
  { label: '简洁模式', value: 'concise' },
  { label: '管理视角', value: 'management' },
]
const pushStatusOptions = [
  { label: '全部状态', value: 'all' },
  { label: 'success', value: 'success' },
  { label: 'pending', value: 'pending' },
  { label: 'failed', value: 'failed' },
]

const selectedFiles = computed(() =>
  reportStore.commits
    .filter((commit) => selectedCommitIds.value.includes(commit.id))
    .flatMap((commit) => commit.files),
)

async function hydrateRepoCommits(repoId: string) {
  await reportStore.fetchCommits(repoId)
  selectedCommitIds.value = reportStore.commits.map((item) => item.id)
  activeFile.value = reportStore.commits[0]?.files[0] ?? null
}

function handleSelectHistory(report: GeneratedReport) {
  reportStore.selectReport(report)
  if (selectedRepoId.value !== report.repoId) {
    selectedRepoId.value = report.repoId
  }
}

async function handleGenerate() {
  if (!selectedRepoId.value || selectedCommitIds.value.length === 0) {
    message.warning('请先选择仓库与 Commit')
    return
  }

  await withLoading(async () => {
    await reportStore.generateReport({
      repoId: selectedRepoId.value,
      commitIds: selectedCommitIds.value,
      promptTemplate: prompts.value.find((item) => item.id === selectedPromptId.value)?.content ?? '',
      style: selectedPromptId.value as ReportTone,
    })
    message.success('日报生成完成')
  })
}

async function handleSyncRepository() {
  if (!selectedRepoId.value) {
    message.warning('请先选择仓库')
    return
  }

  const result = await repositoryStore.syncRepository(selectedRepoId.value)
  await hydrateRepoCommits(selectedRepoId.value)
  message.success(`${result.message}，共 ${result.syncedCount} 条提交`)
}

async function handleCopy() {
  if (!currentReport.value) {
    message.warning('暂无可复制日报')
    return
  }

  await copyText(currentReport.value.markdown)
  message.success('日报内容已复制')
}

async function handlePushFeishu() {
  if (!currentReport.value) {
    return
  }

  const result = await reportStore.pushFeishu(currentReport.value.id)
  if (result.success) {
    message.success(result.message)
    return
  }

  message.warning(result.message)
}

watch(selectedRepoId, (value) => {
  if (value) {
    void hydrateRepoCommits(value)
  }
})

watch(selectedFiles, (files) => {
  activeFile.value = files[0] ?? null
})

onMounted(async () => {
  await Promise.all([
    repositoryStore.fetchRepositories(),
    reportStore.fetchReports(),
    reportStore.fetchPrompts(),
  ])
  const reportIdFromQuery = typeof route.query.reportId === 'string' ? route.query.reportId : ''
  const repoIdFromQuery = typeof route.query.repoId === 'string' ? route.query.repoId : ''

  if (reportIdFromQuery) {
    const targetReport = reportStore.reports.find((item) => item.id === reportIdFromQuery)
    if (targetReport) {
      handleSelectHistory(targetReport)
    }
  }

  selectedRepoId.value =
    repoIdFromQuery ||
    selectedRepoId.value ||
    currentReport.value?.repoId ||
    repositoryStore.repositories[0]?.id ||
    ''

  if (selectedRepoId.value) {
    await hydrateRepoCommits(selectedRepoId.value)
  }
})
</script>

<style scoped lang="less">
.report-grid {
  &__toolbar {
    margin-bottom: 18px;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    align-items: center;
  }

  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 16px;

  &__left,
  &__right {
    display: grid;
    gap: 16px;
    align-content: start;
  }

  &__section-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  &__history-filters {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  &__history-list {
    margin-top: 16px;
    display: grid;
    gap: 10px;
    max-height: 320px;
    overflow: auto;
    padding-right: 4px;
  }

  &__history-item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid transparent;
    color: var(--text-2);
    background: rgba(255, 255, 255, 0.03);
    cursor: pointer;
    text-align: left;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      border-color: rgba(109, 177, 255, 0.14);
      background: rgba(109, 177, 255, 0.06);
    }

    &.is-active {
      border-color: rgba(109, 177, 255, 0.24);
      background: rgba(109, 177, 255, 0.08);
      color: var(--text-1);
    }
  }

  &__history-summary {
    margin: 8px 0 0;
    color: var(--text-3);
    line-height: 1.6;
  }

  &__file-list {
    margin-top: 18px;
    display: grid;
    gap: 10px;
    max-height: 440px;
    overflow: auto;
    padding-right: 4px;
  }

  &__file {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid transparent;
    color: var(--text-2);
    background: rgba(255, 255, 255, 0.02);
    cursor: pointer;
    text-align: left;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      border-color: rgba(109, 177, 255, 0.14);
      background: rgba(109, 177, 255, 0.06);
    }

    &.is-active {
      border-color: rgba(109, 177, 255, 0.24);
      background: rgba(109, 177, 255, 0.08);
      color: var(--text-1);
    }
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    margin-bottom: 18px;
  }
}

@media (max-width: 1120px) {
  .report-grid {
    &__toolbar {
      grid-template-columns: 1fr;
    }

    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .report-grid {
    &__history-filters {
      grid-template-columns: 1fr;
    }

    &__actions {
      flex-direction: column;
      align-items: flex-start;
    }

    &__section-head {
      flex-direction: column;
    }

    &__file {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
