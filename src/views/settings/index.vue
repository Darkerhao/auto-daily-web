<template>
  <div class="page-shell">
    <SectionHeader
      eyebrow="AI Settings"
      title="模型与平台配置"
      description="配置 OpenAI、DeepSeek、Claude 或自定义模型服务，控制流式输出、温度和默认日报风格。"
    />

    <div class="grid-2">
      <div class="settings__stack">
        <div class="glass-panel section-card">
          <h3 class="panel-title">工作区配置</h3>
          <p class="panel-subtitle">模拟 SaaS 多工作区与团队信息，本地持久化保存。</p>
          <n-form :model="workspaceForm" label-placement="top">
            <div class="grid-2">
              <n-form-item label="工作区名称">
                <n-input v-model:value="workspaceForm.workspaceName" />
              </n-form-item>
              <n-form-item label="团队名称">
                <n-input v-model:value="workspaceForm.teamName" />
              </n-form-item>
            </div>
            <n-form-item label="运行环境">
              <n-select v-model:value="workspaceForm.environment" :options="environmentOptions" />
            </n-form-item>
            <n-button type="primary" secondary @click="handleSaveWorkspace">保存工作区配置</n-button>
          </n-form>
        </div>

        <div class="glass-panel section-card">
        <n-form v-if="form" :model="form" label-placement="top">
          <div class="grid-2">
            <n-form-item label="模型厂商">
              <n-select v-model:value="form.provider" :options="providerOptions" />
            </n-form-item>
            <n-form-item label="模型名称">
              <n-input v-model:value="form.modelName" />
            </n-form-item>
          </div>
          <n-form-item label="API Key">
            <n-input v-model:value="form.apiKey" type="password" show-password-on="click" />
          </n-form-item>
          <n-form-item label="Base URL">
            <n-input v-model:value="form.baseUrl" />
          </n-form-item>
          <div class="grid-3">
            <n-form-item label="Temperature">
              <n-input-number v-model:value="form.temperature" :min="0" :max="1" :step="0.1" />
            </n-form-item>
            <n-form-item label="Max Tokens">
              <n-input-number v-model:value="form.maxTokens" :min="500" :max="10000" :step="100" />
            </n-form-item>
            <n-form-item label="默认风格">
              <n-select v-model:value="form.defaultStyle" :options="styleOptions" />
            </n-form-item>
          </div>
          <div class="settings__switches">
            <n-switch v-model:value="form.enableStreaming">
              <template #checked>启用 Streaming</template>
              <template #unchecked>关闭 Streaming</template>
            </n-switch>
            <n-switch v-model:value="form.mergeDuplicateCommits">
              <template #checked>合并重复 Commit</template>
              <template #unchecked>逐条保留 Commit</template>
            </n-switch>
          </div>
          <n-button type="primary" @click="handleSave">保存模型配置</n-button>
        </n-form>
      </div>
      </div>

      <div class="glass-panel section-card">
        <h3 class="panel-title">平台设计原则</h3>
        <div class="settings__notes">
          <div class="settings__note">
            <strong>不虚构</strong>
            <span>日报内容基于 Commit 与 Diff 真实推导，不机械复述 commit message。</span>
          </div>
          <div class="settings__note">
            <strong>自动分类</strong>
            <span>自动归纳功能开发、Bug 修复、重构优化和风险项，适合团队汇报。</span>
          </div>
          <div class="settings__note">
            <strong>高可扩展</strong>
            <span>前端目录结构、请求层和主题系统已为 SaaS 化、ECharts 统计和真实联调预留接口。</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { SelectOption } from 'naive-ui'
import { useMessage } from 'naive-ui'
import SectionHeader from '@/components/common/SectionHeader.vue'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import type { ModelSettings } from '@/types/settings'
import type { WorkspaceProfile } from '@/types/common'

const settingsStore = useSettingsStore()
const appStore = useAppStore()
const message = useMessage()
const form = ref<ModelSettings | null>(null)
const workspaceForm = reactive<WorkspaceProfile>({
  ...appStore.workspaceProfile,
})

const providerOptions: SelectOption[] = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'Claude', value: 'claude' },
  { label: 'Custom', value: 'custom' },
]

const styleOptions: SelectOption[] = [
  { label: '专业研发', value: 'professional' },
  { label: '简洁模式', value: 'concise' },
  { label: '管理视角', value: 'management' },
]

const environmentOptions: SelectOption[] = [
  { label: 'Demo', value: 'demo' },
  { label: 'Staging', value: 'staging' },
  { label: 'Production', value: 'production' },
]

async function handleSave() {
  if (!form.value) {
    return
  }
  await settingsStore.saveModelSettings(form.value)
  message.success('模型配置已保存')
}

function handleSaveWorkspace() {
  appStore.updateWorkspaceProfile(workspaceForm)
  message.success('工作区配置已保存')
}

onMounted(async () => {
  const result = await settingsStore.fetchModelSettings()
  form.value = reactive({ ...result }) as ModelSettings
})
</script>

<style scoped lang="less">
.settings {
  &__stack {
    display: grid;
    gap: 16px;
  }

  &__switches {
    display: grid;
    gap: 18px;
    margin-bottom: 22px;
  }

  &__notes {
    margin-top: 20px;
    display: grid;
    gap: 14px;
  }

  &__note {
    padding: 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.03);

    strong {
      display: block;
    }

    span {
      display: block;
      margin-top: 10px;
      color: var(--text-3);
      line-height: 1.7;
    }
  }
}
</style>
