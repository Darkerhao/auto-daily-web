<template>
  <div class="page-shell">
    <SectionHeader
      eyebrow="Feishu Delivery"
      title="飞书投递配置"
      description="支持 Webhook、机器人密钥、飞书文档与自动发送时间配置，适配企业内日报同步链路。"
    />

    <div class="grid-2">
      <div class="glass-panel section-card">
        <n-form v-if="form" :model="form" label-placement="top">
          <n-form-item label="Webhook 地址">
            <n-input v-model:value="form.webhookUrl" />
          </n-form-item>
          <n-form-item label="机器人 Secret">
            <n-input v-model:value="form.botSecret" type="password" show-password-on="click" />
          </n-form-item>
          <n-form-item label="飞书文档地址">
            <n-input v-model:value="form.docUrl" />
          </n-form-item>
          <div class="grid-2">
            <n-form-item label="应用 App ID">
              <n-input v-model:value="form.appId" placeholder="cli_xxx，仅文档同步需要" />
            </n-form-item>
            <n-form-item label="应用 App Secret">
              <n-input
                v-model:value="form.appSecret"
                type="password"
                show-password-on="click"
                placeholder="仅文档同步需要"
              />
            </n-form-item>
          </div>
          <div class="grid-2">
            <n-form-item label="自动发送时间">
              <n-time-picker
                v-model:formatted-value="form.autoSendTime"
                value-format="HH:mm"
                format="HH:mm"
                clearable
              />
            </n-form-item>
            <div class="feishu__switches">
              <n-switch v-model:value="form.enableRobot">
                <template #checked>启用机器人</template>
                <template #unchecked>停用机器人</template>
              </n-switch>
              <n-switch v-model:value="form.enableDocSync">
                <template #checked>启用文档同步</template>
                <template #unchecked>停用文档同步</template>
              </n-switch>
            </div>
          </div>
          <n-button type="primary" @click="handleSave">保存飞书配置</n-button>
        </n-form>
      </div>

      <div class="glass-panel section-card">
        <h3 class="panel-title">推送链路说明</h3>
        <p class="panel-subtitle">
          机器人推送使用群机器人 Webhook；文档同步需要飞书开放平台自建应用的 App ID / App Secret
          来换取 tenant_access_token。
        </p>
        <div class="feishu__steps">
          <div class="feishu__step">
            <Webhook :size="18" />
            <span>Webhook 推送到群聊机器人</span>
          </div>
          <div class="feishu__step">
            <NotebookText :size="18" />
            <span>同步日报 Markdown 到飞书文档</span>
          </div>
          <div class="feishu__step">
            <Clock3 :size="18" />
            <span>按设定时间进行自动投递</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock3, NotebookText, Webhook } from '@lucide/vue'
import { onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import SectionHeader from '@/components/common/SectionHeader.vue'
import { useSettingsStore } from '@/stores/settings'
import type { FeishuConfig } from '@/types/settings'

const settingsStore = useSettingsStore()
const message = useMessage()
const form = ref<FeishuConfig | null>(null)

async function handleSave() {
  if (!form.value) {
    return
  }
  await settingsStore.saveFeishuConfig(form.value)
  message.success('飞书配置已保存')
}

onMounted(async () => {
  const result = await settingsStore.fetchFeishuConfig()
  form.value = reactive({ ...result }) as FeishuConfig
})
</script>

<style scoped lang="less">
.feishu {
  &__switches {
    display: grid;
    gap: 18px;
    align-content: center;
  }

  &__steps {
    margin-top: 24px;
    display: grid;
    gap: 12px;
  }

  &__step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.03);
  }
}
</style>
