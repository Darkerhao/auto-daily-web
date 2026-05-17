<template>
  <div class="page-shell">
    <SectionHeader
      eyebrow="Repository Hub"
      title="多仓库接入与同步管理"
      description="支持 GitHub、GitLab、Gitee 与自定义 Git Repo 的接入、连接测试和拉取频率配置。"
    >
      <n-button type="primary" @click="openCreateModal">新增仓库</n-button>
    </SectionHeader>

    <div class="glass-panel section-card">
      <n-data-table :columns="columns" :data="repositories" :bordered="false" />
    </div>

    <n-modal v-model:show="modalVisible" preset="card" title="仓库配置" class="repo-modal">
      <n-form :model="form" label-placement="top">
        <div class="grid-2">
          <n-form-item label="仓库名称">
            <n-input v-model:value="form.name" placeholder="daily-report-web" />
          </n-form-item>
          <n-form-item label="Git Provider">
            <n-select v-model:value="form.provider" :options="providerOptions" />
          </n-form-item>
        </div>
        <n-form-item label="仓库地址">
          <n-input v-model:value="form.url" placeholder="https://github.com/org/repo" />
        </n-form-item>
        <div class="grid-3">
          <n-form-item label="分支">
            <n-input v-model:value="form.branch" placeholder="main" />
          </n-form-item>
          <n-form-item label="Owner">
            <n-input v-model:value="form.owner" placeholder="frontend-platform" />
          </n-form-item>
          <n-form-item label="拉取频率">
            <n-select v-model:value="form.syncFrequency" :options="syncOptions" />
          </n-form-item>
        </div>
        <n-form-item label="Token">
          <n-input v-model:value="form.token" type="password" show-password-on="click" />
        </n-form-item>
        <n-form-item label="标签">
          <n-dynamic-tags v-model:value="form.tags" />
        </n-form-item>
        <n-space justify="space-between">
          <n-switch v-model:value="form.enabled">
            <template #checked>启用</template>
            <template #unchecked>停用</template>
          </n-switch>
          <n-space>
            <n-button @click="handleTestConnection">测试连接</n-button>
            <n-button type="primary" @click="handleSave">保存</n-button>
          </n-space>
        </n-space>
      </n-form>

      <div v-if="connectionResult" class="repository__connection glass-panel section-card">
        <div class="repository__connection-title">连接结果</div>
        <div class="repository__connection-desc">{{ connectionResult.message }}</div>
        <div class="repository__connection-meta mono">
          latency={{ connectionResult.latency }}ms · branch={{ connectionResult.branchExists }} · commit={{ connectionResult.lastCommitHash }}
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { NButton, NPopconfirm, NSwitch, useMessage } from 'naive-ui'
import SectionHeader from '@/components/common/SectionHeader.vue'
import { useRepositoryStore } from '@/stores/repository'
import type { RepositoryForm, RepositoryItem } from '@/types/repository'
import { maskToken } from '@/utils/format'

const repositoryStore = useRepositoryStore()
const message = useMessage()
const modalVisible = ref(false)

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
  modalVisible.value = true
}

function editRow(row: RepositoryItem) {
  patchForm({ ...row })
  modalVisible.value = true
}

async function handleSave() {
  await repositoryStore.saveRepository({ ...form })
  message.success('仓库已保存')
  modalVisible.value = false
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
  await repositoryStore.testConnection({ ...form })
  message.success('连接测试完成')
}

onMounted(() => {
  void repositoryStore.fetchRepositories()
})
</script>

<style scoped lang="less">
.repository {
  &__connection {
    margin-top: 20px;
  }

  &__connection-title {
    font-weight: 700;
  }

  &__connection-desc,
  &__connection-meta {
    margin-top: 10px;
    color: var(--text-3);
    line-height: 1.7;
  }
}

:deep(.repo-modal) {
  width: min(920px, calc(100vw - 24px));
}
</style>
