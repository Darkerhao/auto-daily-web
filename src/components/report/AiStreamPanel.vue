<template>
  <div class="ai-stream-panel glass-panel-strong section-card">
    <div class="ai-stream-panel__header">
      <div>
        <h3 class="panel-title">AI 生成流</h3>
        <div class="panel-subtitle">模拟真实流式渲染，适配后端 SSE / WebSocket。</div>
      </div>
      <n-spin v-if="loading" size="small" />
    </div>

    <pre class="ai-stream-panel__content mono">{{ content || '等待生成...' }}</pre>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  content: string
  loading: boolean
}>()
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
