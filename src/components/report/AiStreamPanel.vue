<template>
  <div class="ai-stream-panel glass-panel-strong section-card">
    <div class="ai-stream-panel__header">
      <div>
        <h3 class="panel-title">AI 生成流</h3>
        <div class="panel-subtitle">{{ subtitle }}</div>
      </div>
      <n-spin v-if="loading" size="small" />
    </div>

    <pre class="ai-stream-panel__content mono">{{ content || '等待生成...' }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: string
  loading: boolean
  mode: 'live' | 'recent' | 'summary'
}>()

const subtitle = computed(() => {
  if (props.loading || props.mode === 'live') {
    return '展示后端 SSE 实时增量输出，便于确认生成过程与最终结果。'
  }

  if (props.mode === 'recent') {
    return '展示最近一次生成时的完整流记录，便于回看 AI 逐步归纳过程。'
  }

  return '当前未在重新生成，展示所选日报的摘要、风险项与明日计划。'
})
</script>

<style scoped lang="less">
.ai-stream-panel {
  min-height: 260px;

  &__header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  &__content {
    margin: 18px 0 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text-2);
    line-height: 1.8;
  }
}
</style>
