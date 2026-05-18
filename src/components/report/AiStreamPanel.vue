<template>
  <div class="ai-stream-panel glass-panel-strong section-card">
    <div class="ai-stream-panel__header">
      <div>
        <h3 class="panel-title">AI 生成流</h3>
        <div class="panel-subtitle">{{ subtitle }}</div>
      </div>
      <div class="ai-stream-panel__status">
        <span class="ai-stream-panel__status-dot" :class="{ 'is-active': loading || mode === 'live' }"></span>
        <span>{{ loading ? '生成中' : modeLabel }}</span>
      </div>
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

const modeLabel = computed(() => {
  if (props.loading) return 'Streaming'
  if (props.mode === 'recent') return 'Recent Stream'
  if (props.mode === 'summary') return 'Summary'
  return 'Live'
})
</script>

<style scoped lang="less">
.ai-stream-panel {
  min-height: 280px;

  &__header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--border-color-soft);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-3);
    font-size: 13px;
  }

  &__status-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--text-4);

    &.is-active {
      background: var(--brand-1);
      box-shadow: 0 0 16px rgba(118, 242, 198, 0.42);
    }
  }

  &__content {
    margin: 18px 0 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text-2);
    line-height: 1.8;
    max-height: 420px;
    overflow: auto;
    padding: 18px;
    border-radius: 20px;
    background: rgba(4, 10, 20, 0.34);
  }
}
</style>
