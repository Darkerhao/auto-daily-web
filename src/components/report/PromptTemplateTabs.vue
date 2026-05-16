<template>
  <div class="prompt-tabs glass-panel section-card">
    <h3 class="panel-title">Prompt 模板</h3>
    <div class="panel-subtitle">切换不同日报语气，适配研发同步、管理汇报与简洁投递。</div>

    <n-radio-group :value="value" class="prompt-tabs__group" @update:value="emit('update:value', $event)">
      <n-space vertical>
        <label v-for="item in options" :key="item.id" class="prompt-tabs__item">
          <n-radio :value="item.id" />
          <div>
            <div class="prompt-tabs__name">{{ item.name }}</div>
            <div class="prompt-tabs__content">{{ item.content }}</div>
          </div>
        </label>
      </n-space>
    </n-radio-group>
  </div>
</template>

<script setup lang="ts">
import type { PromptPreset } from '@/types/report'

defineProps<{
  value: string
  options: PromptPreset[]
}>()

const emit = defineEmits<{
  'update:value': [value: string]
}>()
</script>

<style scoped lang="less">
.prompt-tabs {
  &__group {
    margin-top: 18px;
    width: 100%;
  }

  &__item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    align-items: start;
    padding: 14px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.02);
  }

  &__name {
    font-weight: 600;
  }

  &__content {
    margin-top: 6px;
    color: var(--text-3);
    line-height: 1.6;
    font-size: 13px;
  }
}
</style>
