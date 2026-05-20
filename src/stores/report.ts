import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { reportApi } from '@/api/modules/report'
import { createReportStream } from '@/api/modules/stream'
import type {
  CommitItem,
  GenerateReportPayload,
  GeneratedReport,
  PromptPreset,
  ReportHistoryFilters,
  ReportTone,
} from '@/types/report'
import { readStorage, storageKeys, writeStorage } from '@/utils/storage'

interface ReportPreferences {
  selectedRepoId: string
  selectedPromptId: ReportTone
  selectedReportId: string
  reportDate: string
  gitUsername: string
  historyFilters: ReportHistoryFilters
}

interface StreamPanelState {
  latestReportId: string
  latestContent: string
}

const defaultReportPreferences: ReportPreferences = {
  selectedRepoId: '',
  selectedPromptId: 'professional',
  selectedReportId: '',
  reportDate: new Date().toISOString().slice(0, 10),
  gitUsername: '',
  historyFilters: {
    repoId: 'all',
    style: 'all',
    pushStatus: 'all',
    keyword: '',
  },
}

const defaultStreamPanelState: StreamPanelState = {
  latestReportId: '',
  latestContent: '',
}

function normalizeReportPreferences(preferences: Partial<ReportPreferences>): ReportPreferences {
  return {
    ...defaultReportPreferences,
    ...preferences,
    historyFilters: {
      ...defaultReportPreferences.historyFilters,
      ...preferences.historyFilters,
    },
  }
}

function normalizeStreamPanelState(state: Partial<StreamPanelState>): StreamPanelState {
  return {
    ...defaultStreamPanelState,
    ...state,
  }
}

export const useReportStore = defineStore('report', () => {
  const reportPreferences = normalizeReportPreferences(
    readStorage<Partial<ReportPreferences>>(storageKeys.reportPreferences, defaultReportPreferences),
  )
  const streamPanelState = normalizeStreamPanelState(
    readStorage<Partial<StreamPanelState>>(storageKeys.reportStreamPanel, defaultStreamPanelState),
  )
  const commits = ref<CommitItem[]>([])
  const reports = ref<GeneratedReport[]>([])
  const prompts = ref<PromptPreset[]>([])
  const currentReport = ref<GeneratedReport | null>(null)
  const streamContent = ref('')
  const latestStreamReportId = ref(streamPanelState.latestReportId)
  const latestStreamContent = ref(streamPanelState.latestContent)
  const selectedRepoId = ref(reportPreferences.selectedRepoId)
  const selectedPromptId = ref<ReportTone>(reportPreferences.selectedPromptId)
  const selectedReportId = ref(reportPreferences.selectedReportId)
  const reportDate = ref(reportPreferences.reportDate)
  const gitUsername = ref(reportPreferences.gitUsername)
  const historyFilters = ref<ReportHistoryFilters>(reportPreferences.historyFilters)

  function persistPreferences() {
    writeStorage(storageKeys.reportPreferences, {
      selectedRepoId: selectedRepoId.value,
      selectedPromptId: selectedPromptId.value,
      selectedReportId: selectedReportId.value,
      reportDate: reportDate.value,
      gitUsername: gitUsername.value,
      historyFilters: historyFilters.value,
    } satisfies ReportPreferences)
  }

  function persistStreamPanelState() {
    writeStorage(storageKeys.reportStreamPanel, {
      latestReportId: latestStreamReportId.value,
      latestContent: latestStreamContent.value,
    } satisfies StreamPanelState)
  }

  async function appendStreamWithTypewriter(delta: string) {
    for (const char of delta) {
      streamContent.value += char

      if (char === '\n') {
        continue
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, /\s/.test(char) ? 8 : 18)
      })
    }
  }

  function syncCurrentReport() {
    if (selectedReportId.value) {
      currentReport.value =
        reports.value.find((item) => item.id === selectedReportId.value) ?? currentReport.value
    }

    const firstReport = reports.value[0]
    if (!currentReport.value && firstReport) {
      currentReport.value = firstReport
      selectedReportId.value = firstReport.id
    }
  }

  async function fetchCommits(repoId: string) {
    selectedRepoId.value = repoId
    commits.value = await reportApi.getCommits(repoId)
    return commits.value
  }

  async function fetchReports() {
    reports.value = await reportApi.getReports()
    syncCurrentReport()
    return reports.value
  }

  async function fetchPrompts() {
    prompts.value = await reportApi.getPrompts()
    return prompts.value
  }

  async function generateReport(payload: GenerateReportPayload) {
    selectedRepoId.value = payload.repoId
    selectedPromptId.value = payload.style
    streamContent.value = ''
    let generatedReport: GeneratedReport | null = null

    for await (const chunk of createReportStream(payload)) {
      if (!chunk.done && chunk.delta) {
        await appendStreamWithTypewriter(chunk.delta)
      }

      if (chunk.report) {
        generatedReport = chunk.report
      }
    }

    if (!generatedReport) {
      throw new Error('未收到日报生成结果')
    }

    currentReport.value = generatedReport
    selectedReportId.value = generatedReport.id
    latestStreamReportId.value = generatedReport.id
    latestStreamContent.value = streamContent.value
    await fetchReports()
    return generatedReport
  }

  async function pushFeishu(reportId: string) {
    const result = await reportApi.sendFeishu({ reportId })
    selectedReportId.value = reportId
    await fetchReports()
    return result
  }

  async function updateReport(reportId: string, markdown: string) {
    const report = await reportApi.updateReport(reportId, { reportId, markdown })
    currentReport.value = report
    selectedReportId.value = report.id
    reports.value = reports.value.map((item) => (item.id === report.id ? report : item))
    return report
  }

  function selectReport(report: GeneratedReport) {
    streamContent.value = ''
    currentReport.value = report
    selectedReportId.value = report.id
  }

  function patchHistoryFilters(payload: Partial<ReportHistoryFilters>) {
    historyFilters.value = {
      ...historyFilters.value,
      ...payload,
    }
  }

  watch([selectedRepoId, selectedPromptId, selectedReportId, reportDate, gitUsername, historyFilters], persistPreferences, {
    deep: true,
  })
  watch([latestStreamReportId, latestStreamContent], persistStreamPanelState, {
    deep: true,
  })

  return {
    commits,
    reports,
    prompts,
    currentReport,
    streamContent,
    latestStreamReportId,
    latestStreamContent,
    selectedRepoId,
    selectedPromptId,
    selectedReportId,
    reportDate,
    gitUsername,
    historyFilters,
    fetchCommits,
    fetchReports,
    fetchPrompts,
    generateReport,
    pushFeishu,
    updateReport,
    selectReport,
    patchHistoryFilters,
  }
})
