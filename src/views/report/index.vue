<template>
  <div class="page-shell">
    <SectionHeader
      eyebrow="Daily Report"
      title="按提交信息生成日报"
      description="输入日期和 Git 用户名，系统只读取当天提交记录的文本信息生成日报；生成后可直接编辑 Markdown，再同步到飞书。"
    >
      <n-space>
        <n-button secondary @click="handleSyncRepository">同步仓库</n-button>
        <n-button :loading="generating" type="primary" @click="handleGenerate">生成日报</n-button>
      </n-space>
    </SectionHeader>

    <div class="report-grid__toolbar surface-strip">
      <n-form class="report-form" label-placement="top">
        <n-form-item label="仓库">
          <n-select v-model:value="selectedRepoId" :options="repoOptions" placeholder="选择仓库" />
        </n-form-item>
        <n-form-item label="日期">
          <n-date-picker v-model:formatted-value="reportDate" value-format="yyyy-MM-dd" type="date" clearable />
        </n-form-item>
        <n-form-item label="Git 用户名">
          <n-input v-model:value="gitUsername" placeholder="例如：陈北川 / beichuan / git author" clearable />
        </n-form-item>
        <n-form-item label="输出风格">
          <n-select v-model:value="selectedPromptId" :options="promptOptions" />
        </n-form-item>
      </n-form>
      <div class="info-pills">
        <span class="info-pill">匹配提交 {{ filteredCommits.length }}</span>
        <span class="info-pill">当前仓库 {{ currentRepoName }}</span>
        <span class="info-pill">生成依据 Commit Message</span>
      </div>
    </div>

    <div class="report-grid">
      <div class="report-grid__left">
        <div class="glass-panel section-card">
          <div class="report-grid__section-head">
            <div>
              <h3 class="panel-title">提交记录</h3>
              <div class="panel-subtitle">这里展示本次日报会使用的 Commit Message，不再读取或分析文件 Diff。</div>
            </div>
            <n-button text @click="hydrateRepoCommits(selectedRepoId)">刷新提交</n-button>
          </div>

          <div v-if="filteredCommits.length > 0" class="commit-message-list">
            <div v-for="commit in filteredCommits" :key="commit.id" class="commit-message-item">
              <div class="commit-message-item__meta">
                <span class="mono">{{ commit.shortHash }}</span>
                <span>{{ commit.author }}</span>
                <span>{{ commit.time }}</span>
              </div>
              <strong>{{ commit.message }}</strong>
              <small>{{ commit.branch }}</small>
            </div>
          </div>
          <n-empty v-else description="暂无匹配提交，请同步仓库或调整日期、Git 用户名" />
        </div>

        <AiStreamPanel :content="streamPanelContent" :loading="generating" :mode="streamPanelMode" />

        <div class="glass-panel section-card">
          <h3 class="panel-title">日报历史</h3>
          <div class="panel-subtitle">生成后的日报会进入历史列表，选中后可继续编辑或推送。</div>
          <div class="report-grid__history-filters">
            <n-input v-model:value="historyKeyword" placeholder="搜索标题或摘要" />
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
                <div class="muted">{{ item.repoName }} / {{ item.style }} / {{ item.pushStatus }}</div>
                <p class="report-grid__history-summary">{{ item.summary }}</p>
              </div>
              <span class="mono">{{ item.tokenCost }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="report-grid__right">
        <div class="glass-panel section-card report-editor-card">
          <div class="report-grid__actions">
            <div>
              <h3 class="panel-title">日报编辑</h3>
              <div class="panel-subtitle">生成结果是草稿，可修改措辞、补充验证结论后再推送飞书。</div>
            </div>
            <n-space>
              <n-button secondary :disabled="!currentReport" @click="handleSaveReport">保存修改</n-button>
              <n-button secondary :disabled="!editableMarkdown" @click="handleCopy">复制</n-button>
              <n-button type="primary" :disabled="!currentReport" @click="handlePushFeishu">同步飞书</n-button>
            </n-space>
          </div>
          <n-input
            v-model:value="editableMarkdown"
            type="textarea"
            :autosize="{ minRows: 22, maxRows: 34 }"
            placeholder="生成日报后可在这里编辑 Markdown 内容"
          />
        </div>

        <div class="glass-panel section-card">
          <h3 class="panel-title">预览</h3>
          <div class="panel-subtitle">保存前也可以先预览当前编辑内容。</div>
          <MarkdownPreview :content="editableMarkdown || defaultPreview" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute } from 'vue-router'
import AiStreamPanel from '@/components/report/AiStreamPanel.vue'
import MarkdownPreview from '@/components/common/MarkdownPreview.vue'
import SectionHeader from '@/components/common/SectionHeader.vue'
import { copyText } from '@/hooks/useClipboard'
import { useLoading } from '@/hooks/useLoading'
import { useReportStore } from '@/stores/report'
import { useRepositoryStore } from '@/stores/repository'
import type { CommitItem, GeneratedReport, PushStatus, ReportTone } from '@/types/report'

const reportStore = useReportStore()
const repositoryStore = useRepositoryStore()
const route = useRoute()
const message = useMessage()
const { loading: generating, withLoading } = useLoading()

const editableMarkdown = ref('')
const defaultPreview = '日报尚未生成，请填写日期和 Git 用户名后点击“生成日报”。'

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

const reportDate = computed({
  get: () => reportStore.reportDate ?? '',
  set: (value: string | null) => {
    reportStore.reportDate = value ?? ''
  },
})

const gitUsername = computed({
  get: () => reportStore.gitUsername ?? '',
  set: (value: string) => {
    reportStore.gitUsername = value ?? ''
  },
})

const historyKeyword = computed({
  get: () => reportStore.historyFilters.keyword ?? '',
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
const promptOptions = computed(() => reportStore.prompts.map((item) => ({ label: item.name, value: item.id })))
const currentReport = computed(() => reportStore.currentReport ?? reportStore.reports[0] ?? null)
const currentRepoName = computed(
  () => repositoryStore.repositories.find((item) => item.id === selectedRepoId.value)?.name ?? '未选择仓库',
)
function matchesCurrentCommitFilters(commit: CommitItem) {
  const targetDate = reportDate.value
  const targetAuthor = (gitUsername.value ?? '').trim().toLowerCase()
  const dateMatched = targetDate ? commit.time.slice(0, 10) === targetDate : true
  const authorMatched = targetAuthor ? commit.author.toLowerCase().includes(targetAuthor) : true

  return dateMatched && authorMatched
}

const filteredCommits = computed(() => {
  return reportStore.commits.filter(matchesCurrentCommitFilters)
})
const streamPanelMode = computed<'live' | 'recent' | 'summary'>(() => {
  if (generating.value || (reportStore.streamContent ?? '').trim().length > 0) return 'live'

  if (
    currentReport.value &&
    currentReport.value.id === reportStore.latestStreamReportId &&
    (reportStore.latestStreamContent ?? '').trim().length > 0
  ) {
    return 'recent'
  }

  return 'summary'
})
const streamPanelContent = computed(() => {
  const liveStream = (reportStore.streamContent ?? '').trim()
  if (liveStream.length > 0) return liveStream

  if (
    currentReport.value &&
    currentReport.value.id === reportStore.latestStreamReportId &&
    (reportStore.latestStreamContent ?? '').trim().length > 0
  ) {
    return reportStore.latestStreamContent
  }

  if (!currentReport.value) return ''

  return [
    `当前展示历史日报：${currentReport.value.title}`,
    `仓库：${currentReport.value.repoName} / 风格：${currentReport.value.style} / Token：${currentReport.value.tokenCost}`,
    '',
    currentReport.value.summary,
  ].join('\n')
})
const filteredReports = computed(() => {
  const keyword = (reportStore.historyFilters.keyword ?? '').trim().toLowerCase()
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

async function hydrateRepoCommits(repoId: string) {
  if (!repoId) return
  const commits = await reportStore.fetchCommits(repoId)
  const firstCommit = commits[0]
  if (firstCommit && !commits.some(matchesCurrentCommitFilters)) {
    gitUsername.value = firstCommit.author
  }
}

function handleSelectHistory(report: GeneratedReport) {
  reportStore.selectReport(report)
  editableMarkdown.value = report.markdown
  if (selectedRepoId.value !== report.repoId) {
    selectedRepoId.value = report.repoId
  }
}

async function handleGenerate() {
  if (!selectedRepoId.value) {
    message.warning('请先选择仓库')
    return
  }

  if (!reportDate.value) {
    message.warning('请先选择日报日期')
    return
  }

  if (!(gitUsername.value ?? '').trim()) {
    message.warning('请先输入 Git 用户名')
    return
  }

  if (filteredCommits.value.length === 0) {
    message.warning('当前条件没有匹配到提交记录')
    return
  }

  await withLoading(async () => {
    const report = await reportStore.generateReport({
      repoId: selectedRepoId.value,
      reportDate: reportDate.value,
      gitUsername: (gitUsername.value ?? '').trim(),
      promptTemplate: reportStore.prompts.find((item) => item.id === selectedPromptId.value)?.content ?? '',
      style: selectedPromptId.value,
    })
    editableMarkdown.value = report.markdown
    message.success('日报生成完成，可以继续编辑')
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

async function handleSaveReport() {
  if (!currentReport.value) {
    message.warning('请先生成或选择一份日报')
    return
  }

  const report = await reportStore.updateReport(currentReport.value.id, editableMarkdown.value)
  editableMarkdown.value = report.markdown
  message.success('日报修改已保存')
}

async function handleCopy() {
  if (!editableMarkdown.value.trim()) {
    message.warning('暂无可复制日报')
    return
  }

  await copyText(editableMarkdown.value)
  message.success('日报内容已复制')
}

async function handlePushFeishu() {
  if (!currentReport.value) return

  if (editableMarkdown.value !== currentReport.value.markdown) {
    await handleSaveReport()
  }

  const result = await reportStore.pushFeishu(currentReport.value.id)
  if (result.success) {
    message.success(result.message)
    return
  }

  message.warning(result.message)
}

watch(selectedRepoId, (value) => {
  if (value) void hydrateRepoCommits(value)
})

watch(currentReport, (report) => {
  editableMarkdown.value = report?.markdown ?? ''
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
    if (targetReport) handleSelectHistory(targetReport)
  }

  selectedRepoId.value =
    repoIdFromQuery ||
    selectedRepoId.value ||
    currentReport.value?.repoId ||
    repositoryStore.repositories[0]?.id ||
    ''

  if (!gitUsername.value && reportStore.commits[0]?.author) {
    gitUsername.value = reportStore.commits[0].author
  }

  if (selectedRepoId.value) {
    await hydrateRepoCommits(selectedRepoId.value)
  }

  if (!gitUsername.value && reportStore.commits[0]?.author) {
    gitUsername.value = reportStore.commits[0].author
  }
})
</script>

<style scoped lang="less">
.report-grid {
  &__toolbar {
    margin-bottom: 18px;
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

  &__section-head,
  &__actions {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
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
}

.report-form {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 180px minmax(220px, 1fr) 180px;
  gap: 12px;
  align-items: end;
}

.commit-message-list {
  display: grid;
  gap: 12px;
  max-height: 440px;
  overflow: auto;
  padding-right: 4px;
}

.commit-message-item {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--border-color-soft);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);

  strong {
    line-height: 1.5;
  }

  small {
    color: var(--text-3);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    color: var(--text-3);
    font-size: 12px;
  }
}

.report-editor-card {
  :deep(.n-input__textarea-el) {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    line-height: 1.7;
  }
}

@media (max-width: 1120px) {
  .report-grid {
    grid-template-columns: 1fr;
  }

  .report-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .report-grid {
    &__history-filters,
    .report-form {
      grid-template-columns: 1fr;
    }

    &__actions,
    &__section-head {
      flex-direction: column;
    }
  }
}
</style>
