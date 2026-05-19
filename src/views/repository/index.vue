<template>
  <div class="page-shell">
    <SectionHeader
      eyebrow="Repository Hub"
      title="多仓库接入与同步管理"
      description="支持 GitHub、GitLab、Gitee 与自定义 Git Repo 的接入、连接测试和拉取频率配置。"
    >
      <n-button type="primary" @click="openCreateModal">新增仓库</n-button>
    </SectionHeader>

    <div class="repository__summary surface-strip">
      <div class="metric-inline">
        <span>已接入仓库</span>
        <strong>{{ repositories.length }}</strong>
      </div>
      <div class="metric-inline">
        <span>运行中</span>
        <strong>{{ activeRepositoryCount }}</strong>
      </div>
      <div class="metric-inline">
        <span>今日提交总量</span>
        <strong>{{ totalCommitCountToday }}</strong>
      </div>
    </div>

    <div class="glass-panel section-card">
      <n-data-table :columns="columns" :data="repositories" :bordered="false" />
    </div>

    <n-modal
      v-model:show="modalVisible"
      preset="card"
      :title="isEditMode ? '编辑仓库' : '新增仓库'"
      class="repo-modal"
      @update:show="handleModalVisibilityChange"
    >
      <div class="repository-modal">
        <div class="repository-modal__hero">
          <div class="repository-modal__hero-copy">
            <div class="repository-modal__eyebrow">
              {{ isEditMode ? 'Repository Update' : 'Repository Access' }}
            </div>
            <h3>{{ isEditMode ? '调整仓库同步配置' : '创建新的仓库接入' }}</h3>
            <p>
              统一管理代码源、同步节奏与访问凭证，保存后即可接入自动日报采集与同步链路。
            </p>
          </div>
          <div class="repository-modal__hero-pills">
            <span class="info-pill">
              <strong>Provider</strong>
              {{ currentProviderLabel }}
            </span>
            <span class="info-pill">
              <strong>Branch</strong>
              {{ form.branch || 'main' }}
            </span>
            <span class="info-pill">
              <strong>Sync</strong>
              {{ currentSyncLabel }}
            </span>
          </div>
        </div>

        <n-form :model="form" label-placement="top" class="repository-form">
          <section class="repository-modal__section">
            <div class="repository-modal__section-head">
              <div>
                <h4>基础信息</h4>
                <p>定义仓库来源、地址和基础同步范围，保证采集链路清晰可追踪。</p>
              </div>
            </div>

            <div class="grid-2">
              <n-form-item label="仓库名称">
                <n-input
                  v-model:value="form.name"
                  placeholder="daily-report-web"
                  @update:value="handleNameInput"
                />
                <div
                  v-if="nameSource !== 'idle'"
                  class="repository-modal__field-tip"
                  :class="{ 'is-manual': nameSource === 'manual' }"
                >
                  <span class="repository-modal__field-badge" :class="`is-${nameSource}`">
                    {{ nameSource === 'auto' ? '自动填充' : '手动锁定' }}
                  </span>
                  <span v-if="nameSource === 'auto'">已根据仓库地址自动填充仓库名称</span>
                  <template v-else>
                    <span>已切换为手动输入，地址变化时不会自动覆盖</span>
                    <n-button
                      v-if="canRestoreAutoName"
                      text
                      size="tiny"
                      class="repository-modal__field-action"
                      @click="restoreAutoName"
                    >
                      恢复自动填充
                    </n-button>
                  </template>
                </div>
              </n-form-item>
              <n-form-item label="Git Provider">
                <n-select
                  v-model:value="form.provider"
                  :options="providerOptions"
                  @update:value="handleProviderChange"
                />
                <div
                  v-if="detectedProvider || providerMode === 'manual'"
                  class="repository-modal__field-tip"
                  :class="{ 'is-manual': providerMode === 'manual' }"
                >
                  <span class="repository-modal__field-badge" :class="`is-${providerMode}`">
                    {{ providerMode === 'manual' ? '手动模式' : '自动识别' }}
                  </span>
                  <span v-if="providerMode === 'manual'">已切换为手动模式，当前不再根据地址自动改写 Provider</span>
                  <span v-else>已根据仓库地址自动识别 Provider</span>
                  <n-button
                    v-if="providerMode === 'manual' && detectedProvider"
                    text
                    size="tiny"
                    class="repository-modal__field-action"
                    @click="restoreProviderAutoMode"
                  >
                    恢复自动识别
                  </n-button>
                </div>
              </n-form-item>
            </div>

            <n-form-item label="仓库地址">
              <n-input-group>
                <n-input v-model:value="form.url" placeholder="https://github.com/org/repo" />
                <n-button
                  secondary
                  :loading="branchLoading"
                  :disabled="!canReloadBranches"
                  @click="handleReloadBranches"
                >
                  重新拉取分支
                </n-button>
              </n-input-group>
              <div
                v-if="urlValidationState !== 'idle'"
                class="repository-modal__field-tip"
                :class="{ 'is-manual': urlValidationState === 'invalid' }"
              >
                <span class="repository-modal__field-badge" :class="`is-${urlValidationState === 'valid' ? 'auto' : 'manual'}`">
                  {{ urlValidationState === 'valid' ? '地址有效' : '地址异常' }}
                </span>
                <span v-if="urlValidationState === 'valid'">仓库地址格式已通过校验，可自动解析与拉取分支</span>
                <span v-else>{{ urlValidationMessage }}</span>
              </div>
            </n-form-item>

            <div class="grid-3">
              <n-form-item label="分支">
                <n-select
                  v-model:value="form.branch"
                  :options="branchOptions"
                  :loading="branchLoading"
                  :disabled="branchLoading || branchOptions.length === 0"
                  placeholder="输入仓库地址后自动加载分支"
                />
              </n-form-item>
              <n-form-item label="Owner">
                <n-input
                  v-model:value="form.owner"
                  placeholder="frontend-platform"
                  @update:value="handleOwnerInput"
                />
                <div
                  v-if="ownerSource !== 'idle'"
                  class="repository-modal__field-tip"
                  :class="{ 'is-manual': ownerSource === 'manual' }"
                >
                  <span class="repository-modal__field-badge" :class="`is-${ownerSource}`">
                    {{ ownerSource === 'auto' ? '自动填充' : '手动锁定' }}
                  </span>
                  <span v-if="ownerSource === 'auto'">已根据仓库地址自动解析 Owner</span>
                  <template v-else>
                    <span>已切换为手动输入，地址变化时不会自动覆盖</span>
                    <n-button
                      v-if="canRestoreAutoOwner"
                      text
                      size="tiny"
                      class="repository-modal__field-action"
                      @click="restoreAutoOwner"
                    >
                      恢复自动填充
                    </n-button>
                  </template>
                </div>
              </n-form-item>
              <n-form-item label="拉取频率">
                <n-select v-model:value="form.syncFrequency" :options="syncOptions" />
              </n-form-item>
            </div>

            <div
              v-if="branchHint"
              class="repository-modal__branch-tip"
              :class="{ 'is-error': branchHint.tone === 'error' }"
            >
              <span
                class="repository-modal__field-badge"
                :class="`is-${branchHint.badgeTone}`"
              >
                {{ branchHint.badge }}
              </span>
              <span>{{ branchHint.text }}</span>
            </div>
          </section>

          <section class="repository-modal__section repository-modal__section--accent">
            <div class="repository-modal__section-head">
              <div>
                <h4>访问与安全</h4>
                <p>配置访问令牌和分类标签，便于权限管理、筛选与后续运维排查。</p>
              </div>
            </div>

            <n-form-item label="Token">
              <n-input
                v-model:value="form.token"
                type="password"
                show-password-on="click"
                placeholder="请输入仓库访问令牌"
              />
            </n-form-item>

            <n-form-item label="标签">
              <n-dynamic-tags v-model:value="form.tags" />
            </n-form-item>
          </section>

          <div class="repository-modal__footer">
            <div class="repository-modal__switch-card">
              <div class="repository-modal__switch-copy">
                <span>同步状态</span>
                <small>关闭后仓库不会参与自动拉取与日报分析</small>
              </div>
              <n-switch v-model:value="form.enabled">
                <template #checked>启用</template>
                <template #unchecked>停用</template>
              </n-switch>
            </div>

            <div class="repository-modal__actions">
              <n-button quaternary @click="closeModal">取消</n-button>
              <n-button
                secondary
                :loading="connectionTesting"
                :disabled="!canTestConnection"
                @click="handleTestConnection"
              >
                测试连接
              </n-button>
              <n-button type="primary" :disabled="!canSaveRepository" @click="handleSave">
                {{ isEditMode ? '保存修改' : '保存仓库' }}
              </n-button>
            </div>
          </div>
        </n-form>

        <div
          v-if="connectionResult"
          class="repository-modal__result"
          :class="connectionResult.success ? 'is-success' : 'is-failed'"
        >
          <div class="repository-modal__result-head">
            <div>
              <strong>连接结果</strong>
              <p>{{ connectionResult.message }}</p>
            </div>
            <span class="repository-modal__result-badge">
              {{ connectionResult.success ? '连接正常' : '需要处理' }}
            </span>
          </div>

          <div class="repository-modal__result-grid">
            <div class="repository-modal__result-metric">
              <span>网络延迟</span>
              <strong class="mono">{{ connectionResult.latency }}ms</strong>
            </div>
            <div class="repository-modal__result-metric">
              <span>分支状态</span>
              <strong>{{ connectionResult.branchExists ? '已识别' : '未识别' }}</strong>
            </div>
            <div class="repository-modal__result-metric">
              <span>最新 Commit</span>
              <strong class="mono">{{ connectionResult.lastCommitHash || '-' }}</strong>
            </div>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { NButton, NInputGroup, NPopconfirm, NSwitch, useMessage } from 'naive-ui'
import SectionHeader from '@/components/common/SectionHeader.vue'
import { useRepositoryStore } from '@/stores/repository'
import type {
  GitProvider,
  RepositoryBranchOption,
  RepositoryForm,
  RepositoryItem,
  SyncFrequency,
} from '@/types/repository'
import { maskToken } from '@/utils/format'

const repositoryStore = useRepositoryStore()
const message = useMessage()
const modalVisible = ref(false)
const branchLoading = ref(false)
const connectionTesting = ref(false)
const branchFetchError = ref('')
const lastFetchedBranchUrl = ref('')
const urlValidationState = ref<'idle' | 'valid' | 'invalid'>('idle')
const urlValidationMessage = ref('')
const providerMode = ref<'auto' | 'manual'>('auto')
const detectedProvider = ref<GitProvider | null>(null)
const nameSource = ref<'idle' | 'auto' | 'manual'>('idle')
const ownerSource = ref<'idle' | 'auto' | 'manual'>('idle')
const lastAutoFilledName = ref('')
const lastAutoFilledOwner = ref('')

const providerOptions: SelectOption[] = [
  { label: 'GitHub', value: 'github' },
  { label: 'GitLab', value: 'gitlab' },
  { label: 'Gitee', value: 'gitee' },
  { label: 'Custom', value: 'custom' },
]

const syncOptions: SelectOption[] = [
  { label: '10 分钟', value: '10m' },
  { label: '30 分钟', value: '30m' },
  { label: '1 小时', value: '1h' },
  { label: '手动', value: 'manual' },
]

const providerLabelMap: Record<GitProvider, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  gitee: 'Gitee',
  custom: 'Custom',
}

const syncLabelMap: Record<SyncFrequency, string> = {
  '10m': '10 分钟',
  '30m': '30 分钟',
  '1h': '1 小时',
  manual: '手动',
}

const emptyForm = (): RepositoryForm => ({
  name: '',
  provider: 'github',
  url: '',
  branch: 'main',
  token: '',
  syncFrequency: '10m',
  owner: '',
  enabled: true,
  tags: [],
})

const form = reactive<RepositoryForm>(emptyForm())

const repositories = computed(() => repositoryStore.repositories)
const connectionResult = computed(() => repositoryStore.lastConnectionResult)
const branchOptions = computed<SelectOption[]>(() => repositoryStore.branchOptions)
const isEditMode = computed(() => Boolean(form.id))
const activeRepositoryCount = computed(() => repositories.value.filter((item) => item.enabled).length)
const totalCommitCountToday = computed(() =>
  repositories.value.reduce((sum, item) => sum + item.commitCountToday, 0),
)
const currentProviderLabel = computed(() => providerLabelMap[form.provider] ?? 'GitHub')
const currentSyncLabel = computed(() => syncLabelMap[form.syncFrequency] ?? '10 分钟')
const canReloadBranches = computed(
  () => Boolean(form.url.trim()) && urlValidationState.value === 'valid',
)
const canTestConnection = computed(
  () => Boolean(form.url.trim()) && Boolean(form.branch.trim()) && urlValidationState.value === 'valid',
)
const canSaveRepository = computed(
  () =>
    Boolean(form.name.trim()) &&
    Boolean(form.owner.trim()) &&
    Boolean(form.url.trim()) &&
    Boolean(form.branch.trim()) &&
    urlValidationState.value === 'valid',
)
const canRestoreAutoName = computed(
  () => nameSource.value === 'manual' && Boolean(lastAutoFilledName.value),
)
const canRestoreAutoOwner = computed(
  () => ownerSource.value === 'manual' && Boolean(lastAutoFilledOwner.value),
)
const branchHint = computed(() => {
  if (branchLoading.value) {
    return {
      badge: '自动读取中',
      text: '正在读取仓库分支列表...',
      tone: 'normal' as const,
      badgeTone: 'auto' as const,
    }
  }

  if (branchFetchError.value) {
    return {
      badge: '读取异常',
      text: branchFetchError.value,
      tone: 'error' as const,
      badgeTone: 'manual' as const,
    }
  }

  if (branchOptions.value.length > 0) {
    return {
      badge: '自动读取',
      text: `已自动读取 ${branchOptions.value.length} 个分支，请直接选择。`,
      tone: 'normal' as const,
      badgeTone: 'auto' as const,
    }
  }

  if (!form.url.trim()) {
    return {
      badge: '待输入',
      text: '请先输入仓库地址，系统会自动读取分支列表。',
      tone: 'normal' as const,
      badgeTone: 'muted' as const,
    }
  }

  if (urlValidationState.value !== 'valid') {
    return {
      badge: '待校验',
      text: '请先输入合法仓库地址并完成地址校验。',
      tone: 'error' as const,
      badgeTone: 'manual' as const,
    }
  }

  return {
    badge: '待读取',
    text: '地址已通过校验，可等待系统自动读取，或点击“重新拉取分支”。',
    tone: 'normal' as const,
    badgeTone: 'muted' as const,
  }
})

const columns: DataTableColumns<RepositoryItem> = [
  { title: '仓库', key: 'name' },
  { title: 'Provider', key: 'provider' },
  { title: '分支', key: 'branch' },
  { title: 'Token', key: 'token', render: (row) => maskToken(row.token) },
  { title: '同步频率', key: 'syncFrequency' },
  {
    title: '状态',
    key: 'enabled',
    render(row) {
      return h(NSwitch, {
        value: row.enabled,
        disabled: true,
      })
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h('div', { style: 'display:flex;gap:8px;' }, [
        h(
          NButton,
          {
            size: 'small',
            secondary: true,
            onClick: () => handleSync(row.id),
          },
          { default: () => '同步' },
        ),
        h(
          NButton,
          {
            size: 'small',
            secondary: true,
            onClick: () => editRow(row),
          },
          { default: () => '编辑' },
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row.id),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: 'small',
                  tertiary: true,
                  type: 'error',
                },
                { default: () => '删除' },
              ),
            default: () => '确认删除该仓库？',
          },
        ),
      ])
    },
  },
]

function patchForm(payload: RepositoryForm) {
  Object.assign(form, payload)
}

function openCreateModal() {
  patchForm(emptyForm())
  repositoryStore.clearConnectionResult()
  repositoryStore.clearBranchOptions()
  branchFetchError.value = ''
  lastFetchedBranchUrl.value = ''
  urlValidationState.value = 'idle'
  urlValidationMessage.value = ''
  providerMode.value = 'auto'
  detectedProvider.value = null
  nameSource.value = 'idle'
  ownerSource.value = 'idle'
  lastAutoFilledName.value = ''
  lastAutoFilledOwner.value = ''
  modalVisible.value = true
}

function editRow(row: RepositoryItem) {
  patchForm({ ...row })
  repositoryStore.clearConnectionResult()
  repositoryStore.clearBranchOptions()
  branchFetchError.value = ''
  lastFetchedBranchUrl.value = row.url
  urlValidationState.value = 'idle'
  urlValidationMessage.value = ''
  providerMode.value = 'auto'
  detectedProvider.value = inferProviderFromUrl(row.url)
  nameSource.value = 'idle'
  ownerSource.value = 'idle'
  lastAutoFilledName.value = ''
  lastAutoFilledOwner.value = ''
  modalVisible.value = true
  void loadBranchesForUrl({ silent: true, preserveCurrentBranch: true })
}

function handleModalVisibilityChange(value: boolean) {
  modalVisible.value = value

  if (!value) {
    repositoryStore.clearConnectionResult()
    repositoryStore.clearBranchOptions()
    branchFetchError.value = ''
    lastFetchedBranchUrl.value = ''
    urlValidationState.value = 'idle'
    urlValidationMessage.value = ''
    providerMode.value = 'auto'
    detectedProvider.value = null
    nameSource.value = 'idle'
    ownerSource.value = 'idle'
    lastAutoFilledName.value = ''
    lastAutoFilledOwner.value = ''
  }
}

function closeModal() {
  handleModalVisibilityChange(false)
}

async function handleSave() {
  if (!canSaveRepository.value) {
    message.warning('请先填写仓库名称、合法仓库地址、Owner 和分支')
    return
  }

  await repositoryStore.saveRepository({ ...form })
  message.success('仓库已保存')
  closeModal()
}

async function handleDelete(id: string) {
  await repositoryStore.deleteRepository(id)
  message.success('仓库已删除')
}

async function handleSync(id: string) {
  const result = await repositoryStore.syncRepository(id)
  message.success(`${result.message}，共 ${result.syncedCount} 条提交`)
}

async function handleTestConnection() {
  if (!canTestConnection.value) {
    message.warning('请先填写合法仓库地址，并选择要测试的分支')
    return
  }

  connectionTesting.value = true

  try {
    const result = await repositoryStore.testConnection({ ...form })

    if (result.success) {
      message.success('连接测试通过')
      return
    }

    message.warning(result.message)
  } finally {
    connectionTesting.value = false
  }
}

function normalizeRepositoryUrl(url: string) {
  return url.trim()
}

function inferProviderFromUrl(url: string): GitProvider | null {
  const normalized = url.toLowerCase()

  if (normalized.includes('github.com')) {
    return 'github'
  }

  if (normalized.includes('gitlab.com') || normalized.includes('gitlab.')) {
    return 'gitlab'
  }

  if (normalized.includes('gitee.com')) {
    return 'gitee'
  }

  return null
}

function inferRepositoryNameFromUrl(url: string) {
  const normalized = normalizeRepositoryUrl(url)
  const match = normalized.match(/https?:\/\/[^/]+\/([^/]+)\/([^/?#]+?)(?:\.git)?(?:[/?#].*)?$/i)
  return match?.[2] ?? ''
}

function inferOwnerFromUrl(url: string) {
  const normalized = normalizeRepositoryUrl(url)
  const match = normalized.match(/https?:\/\/[^/]+\/([^/]+)\/([^/?#]+?)(?:\.git)?(?:[/?#].*)?$/i)
  return match?.[1] ?? ''
}

function validateRepositoryUrl(url: string) {
  const normalized = normalizeRepositoryUrl(url)

  if (!normalized) {
    return {
      state: 'idle' as const,
      message: '',
    }
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(normalized)
  } catch {
    return {
      state: 'invalid' as const,
      message: '请输入完整仓库地址，例如 https://github.com/org/repo',
    }
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      state: 'invalid' as const,
      message: '仓库地址仅支持 http 或 https 协议。',
    }
  }

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
  if (pathSegments.length < 2) {
    return {
      state: 'invalid' as const,
      message: '仓库地址至少需要包含 owner 和 repo 两级路径。',
    }
  }

  return {
    state: 'valid' as const,
    message: '',
  }
}

function applyAutoName(nextName: string) {
  if (!nextName) {
    return
  }

  const currentName = form.name.trim()
  const canOverride =
    !currentName || nameSource.value === 'auto' || currentName === lastAutoFilledName.value

  if (!canOverride) {
    return
  }

  form.name = nextName
  nameSource.value = 'auto'
  lastAutoFilledName.value = nextName
}

function applyAutoOwner(nextOwner: string) {
  if (!nextOwner) {
    return
  }

  const currentOwner = form.owner.trim()
  const canOverride =
    !currentOwner || ownerSource.value === 'auto' || currentOwner === lastAutoFilledOwner.value

  if (!canOverride) {
    return
  }

  form.owner = nextOwner
  ownerSource.value = 'auto'
  lastAutoFilledOwner.value = nextOwner
}

function clearAutoName() {
  const currentName = form.name.trim()

  if (nameSource.value === 'auto' || currentName === lastAutoFilledName.value) {
    form.name = ''
    nameSource.value = 'idle'
    lastAutoFilledName.value = ''
  }
}

function clearAutoOwner() {
  const currentOwner = form.owner.trim()

  if (ownerSource.value === 'auto' || currentOwner === lastAutoFilledOwner.value) {
    form.owner = ''
    ownerSource.value = 'idle'
    lastAutoFilledOwner.value = ''
  }
}

async function loadBranchesForUrl(options?: {
  silent?: boolean
  preserveCurrentBranch?: boolean
}) {
  const url = normalizeRepositoryUrl(form.url)

  if (!url) {
    repositoryStore.clearBranchOptions()
    branchFetchError.value = ''
    lastFetchedBranchUrl.value = ''
    return
  }

  if (urlValidationState.value !== 'valid') {
    repositoryStore.clearBranchOptions()
    branchFetchError.value = ''
    return
  }

  if (branchLoading.value) {
    return
  }

  if (url === lastFetchedBranchUrl.value && repositoryStore.branchOptions.length > 0) {
    return
  }

  branchLoading.value = true
  branchFetchError.value = ''

  try {
    const branches = await repositoryStore.fetchBranches({
      provider: form.provider,
      url,
      token: form.token,
    })

    lastFetchedBranchUrl.value = url

    if (branches.length > 0) {
      const matched = branches.some((item: RepositoryBranchOption) => item.value === form.branch)
      if (!options?.preserveCurrentBranch || !matched) {
        form.branch = branches[0]?.value ?? ''
      }

      if (!options?.silent) {
        message.success(`已读取 ${branches.length} 个分支`)
      }

      return
    }

    repositoryStore.clearBranchOptions()
    branchFetchError.value = '未读取到分支列表，请检查仓库地址、Provider 或访问令牌。'
  } catch {
    repositoryStore.clearBranchOptions()
    branchFetchError.value = '分支读取失败，请检查仓库地址、Provider 或访问令牌。'

    if (!options?.silent) {
      message.warning('分支读取失败，可检查地址或令牌后重试')
    }
  } finally {
    branchLoading.value = false
  }
}

async function handleReloadBranches() {
  if (!canReloadBranches.value) {
    return
  }

  lastFetchedBranchUrl.value = ''
  repositoryStore.clearBranchOptions()
  branchFetchError.value = ''
  void loadBranchesForUrl({ preserveCurrentBranch: true })
}

function handleProviderChange(value: GitProvider) {
  form.provider = value

  if (detectedProvider.value && value !== detectedProvider.value) {
    providerMode.value = 'manual'
    return
  }

  if (!detectedProvider.value) {
    providerMode.value = 'manual'
  }
}

function restoreProviderAutoMode() {
  providerMode.value = 'auto'

  if (detectedProvider.value) {
    form.provider = detectedProvider.value
    void handleReloadBranches()
  }
}

function restoreAutoName() {
  if (!lastAutoFilledName.value) {
    return
  }

  form.name = lastAutoFilledName.value
  nameSource.value = 'auto'
}

function restoreAutoOwner() {
  if (!lastAutoFilledOwner.value) {
    return
  }

  form.owner = lastAutoFilledOwner.value
  ownerSource.value = 'auto'
}

function handleNameInput(value: string) {
  if (!value.trim()) {
    nameSource.value = 'idle'
    return
  }

  nameSource.value = value === lastAutoFilledName.value ? 'auto' : 'manual'
}

function handleOwnerInput(value: string) {
  if (!value.trim()) {
    ownerSource.value = 'idle'
    return
  }

  ownerSource.value = value === lastAutoFilledOwner.value ? 'auto' : 'manual'
}

watch(
  () => modalVisible.value,
  (visible) => {
    if (!visible || !form.url.trim()) {
      return
    }

    void loadBranchesForUrl({ silent: true, preserveCurrentBranch: true })
  },
)

watch(
  () => form.provider,
  () => {
    if (!modalVisible.value) {
      return
    }

    repositoryStore.clearBranchOptions()
    repositoryStore.clearConnectionResult()
    branchFetchError.value = ''
    lastFetchedBranchUrl.value = ''
  },
)

watch(
  () => form.url,
  (next, prev, onCleanup) => {
    if (!modalVisible.value) {
      return
    }

    const normalizedNext = normalizeRepositoryUrl(next)
    const normalizedPrev = normalizeRepositoryUrl(prev ?? '')

    if (normalizedNext === normalizedPrev) {
      return
    }

    const validation = validateRepositoryUrl(normalizedNext)
    urlValidationState.value = validation.state
    urlValidationMessage.value = validation.message

    const inferredProvider = inferProviderFromUrl(normalizedNext)
    detectedProvider.value = inferredProvider

    if (providerMode.value === 'auto' && inferredProvider) {
      form.provider = inferredProvider
    }

    const inferredOwner = inferOwnerFromUrl(normalizedNext)
    applyAutoOwner(inferredOwner)

    const inferredRepositoryName = inferRepositoryNameFromUrl(normalizedNext)
    applyAutoName(inferredRepositoryName)

    repositoryStore.clearBranchOptions()
    repositoryStore.clearConnectionResult()
    branchFetchError.value = ''
    lastFetchedBranchUrl.value = ''

    if (!normalizedNext) {
      detectedProvider.value = null
      form.branch = ''
      clearAutoName()
      clearAutoOwner()
      return
    }

    if (validation.state !== 'valid') {
      repositoryStore.clearBranchOptions()
      branchFetchError.value = ''
      form.branch = ''
      clearAutoName()
      clearAutoOwner()
      return
    }

    const timer = window.setTimeout(() => {
      void loadBranchesForUrl()
    }, 500)

    onCleanup(() => {
      window.clearTimeout(timer)
    })
  },
)

watch(
  () => [form.branch, form.token] as const,
  () => {
    if (!modalVisible.value) {
      return
    }

    repositoryStore.clearConnectionResult()
  },
)

onMounted(() => {
  void repositoryStore.fetchRepositories()
})
</script>

<style scoped lang="less">
.repository {
  &__summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-bottom: 18px;
  }
}

:global(.repo-modal) {
  width: min(980px, calc(100vw - 32px));
}

:global(.n-card.n-modal.repo-modal) {
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

:global(.n-card.n-modal.repo-modal .n-card-header) {
  padding-bottom: 20px;
  flex: 0 0 auto;
}

:global(.n-card.n-modal.repo-modal .n-card-content) {
  padding-top: 0;
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.repository-modal {
  min-height: min-content;
  display: grid;
  gap: 22px;

  &__eyebrow {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    width: fit-content;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(118, 242, 198, 0.18);
    background: rgba(118, 242, 198, 0.08);
    color: var(--brand-1);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  &__hero {
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
    gap: 18px;
    margin-top: 22px;
    padding: 24px;
    border-radius: 24px;
    border: 1px solid var(--modal-border-strong);
    background:
      radial-gradient(circle at right top, rgba(109, 177, 255, 0.14), transparent 38%),
      linear-gradient(135deg, rgba(118, 242, 198, 0.12), rgba(109, 177, 255, 0.08) 48%, rgba(255, 255, 255, 0.02));
  }

  &__hero-copy {
    h3 {
      margin: 14px 0 0;
      font-size: clamp(24px, 4vw, 32px);
      line-height: 1.04;
      letter-spacing: -0.04em;
    }

    p {
      margin: 12px 0 0;
      max-width: 560px;
      color: var(--text-2);
      line-height: 1.8;
    }
  }

  &__hero-pills {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    justify-content: flex-end;
    gap: 10px;

    :deep(.info-pill) {
      min-height: 40px;
      padding: 0 16px;
      background: rgba(8, 16, 32, 0.34);
      border-color: rgba(109, 177, 255, 0.14);
      color: var(--text-1);
      backdrop-filter: blur(18px);
    }

    strong {
      color: var(--text-3);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  }

  &__section {
    padding: 22px;
    border-radius: 24px;
    border: 1px solid var(--modal-border);
    background: rgba(8, 16, 31, 0.26);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  &__section--accent {
    background:
      linear-gradient(180deg, rgba(109, 177, 255, 0.06), rgba(118, 242, 198, 0.03)),
      rgba(8, 16, 31, 0.26);
  }

  &__section-head {
    margin-bottom: 18px;

    h4 {
      margin: 0;
      font-size: 18px;
      letter-spacing: -0.02em;
    }

    p {
      margin: 8px 0 0;
      color: var(--text-3);
      line-height: 1.7;
    }
  }

  &__branch-tip {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 4px;
    color: var(--text-3);
    font-size: 13px;
    line-height: 1.6;
  }

  &__branch-tip.is-error {
    color: var(--danger);
  }

  &__field-tip {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 8px;
    color: var(--text-3);
    font-size: 12px;
    line-height: 1.5;
  }

  &__field-tip.is-manual {
    color: var(--warning);
  }

  &__field-badge {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(109, 177, 255, 0.16);
    background: rgba(109, 177, 255, 0.1);
    color: var(--brand-2);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  &__field-badge.is-auto {
    border-color: rgba(84, 227, 160, 0.24);
    background: rgba(84, 227, 160, 0.12);
    color: var(--success);
  }

  &__field-badge.is-manual {
    border-color: rgba(255, 207, 112, 0.2);
    background: rgba(255, 207, 112, 0.12);
    color: var(--warning);
  }

  &__field-badge.is-muted {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-3);
  }

  &__field-action {
    padding: 0;
    font-size: 12px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__switch-card {
    display: flex;
    align-items: center;
    gap: 18px;
    min-height: 74px;
    padding: 14px 18px;
    border-radius: 22px;
    border: 1px solid var(--modal-border);
    background: rgba(8, 16, 32, 0.36);
  }

  &__switch-copy {
    display: flex;
    flex-direction: column;
    gap: 6px;

    span {
      font-weight: 700;
    }

    small {
      color: var(--text-3);
      line-height: 1.6;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__result {
    display: grid;
    gap: 16px;
    padding: 22px;
    border-radius: 24px;
    border: 1px solid var(--modal-border);
    background: rgba(8, 16, 32, 0.34);
  }

  &__result.is-success {
    border-color: rgba(84, 227, 160, 0.26);
    background:
      linear-gradient(180deg, rgba(84, 227, 160, 0.08), rgba(84, 227, 160, 0.02)),
      rgba(8, 16, 32, 0.36);
  }

  &__result.is-failed {
    border-color: rgba(255, 125, 144, 0.22);
    background:
      linear-gradient(180deg, rgba(255, 125, 144, 0.08), rgba(255, 125, 144, 0.02)),
      rgba(8, 16, 32, 0.36);
  }

  &__result-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;

    strong {
      font-size: 16px;
    }

    p {
      margin: 8px 0 0;
      color: var(--text-3);
      line-height: 1.7;
    }
  }

  &__result-badge {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid currentColor;
    color: var(--text-2);
    font-size: 12px;
    font-weight: 600;
  }

  &__result-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  &__result-metric {
    display: grid;
    gap: 8px;
    padding: 16px 18px;
    border-radius: 20px;
    border: 1px solid var(--modal-border);
    background: rgba(255, 255, 255, 0.03);

    span {
      color: var(--text-3);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    strong {
      font-size: 16px;
      line-height: 1.35;
      word-break: break-all;
    }
  }
}

.repository-form {
  display: grid;
  gap: 18px;

  :deep(.n-form-item) {
    margin-bottom: 0;
  }

  :deep(.n-form-item-label) {
    padding-bottom: 10px;
    color: var(--text-2);
    font-size: 13px;
    font-weight: 600;
  }

  :deep(.n-input .n-input-wrapper),
  :deep(.n-base-selection),
  :deep(.n-dynamic-tags),
  :deep(.n-input-group .n-button) {
    border-radius: 18px;
    background: rgba(15, 25, 46, 0.86);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    transition:
      box-shadow 0.22s ease,
      background 0.22s ease,
      transform 0.22s ease;
  }

  :deep(.n-input .n-input-wrapper:hover),
  :deep(.n-base-selection:hover),
  :deep(.n-dynamic-tags:hover),
  :deep(.n-input-group .n-button:hover) {
    box-shadow: inset 0 0 0 1px rgba(109, 177, 255, 0.2);
  }

  :deep(.n-input-group) {
    width: 100%;
  }

  :deep(.n-input-group .n-input) {
    flex: 1;
  }

  :deep(.n-input-group .n-button) {
    min-width: 128px;
    color: var(--text-2);
  }

  :deep(.n-input.n-input--focus .n-input-wrapper),
  :deep(.n-base-selection.n-base-selection--active),
  :deep(.n-dynamic-tags:focus-within) {
    background: rgba(17, 28, 52, 0.94);
    box-shadow:
      0 0 0 3px rgba(109, 177, 255, 0.14),
      inset 0 0 0 1px rgba(109, 177, 255, 0.34);
  }

  :deep(.n-dynamic-tags) {
    min-height: 52px;
    padding: 8px;
  }

  :deep(.n-dynamic-tags .n-tag),
  :deep(.n-dynamic-tags .n-button) {
    border-radius: 14px;
  }
}

@media (max-width: 768px) {
  :global(.repo-modal) {
    width: calc(100vw - 16px);
  }

  :global(.n-card.n-modal.repo-modal) {
    max-height: calc(100vh - 16px);
  }

  .repository {
    &__summary {
      grid-template-columns: 1fr;
    }
  }

  .repository-modal {
    &__hero,
    &__result-grid {
      grid-template-columns: 1fr;
    }

    &__hero {
      padding: 20px;
    }

    &__hero-pills,
    &__actions {
      justify-content: flex-start;
    }

    &__footer,
    &__switch-card,
    &__result-head {
      align-items: flex-start;
      flex-direction: column;
    }

    &__actions {
      width: 100%;

      :deep(.n-button) {
        width: 100%;
      }
    }
  }
}
</style>
