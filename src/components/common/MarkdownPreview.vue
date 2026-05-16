<template>
  <article class="markdown-preview glass-panel section-card" v-html="html"></article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{
  content: string
}>()

const html = computed(() => renderMarkdown(props.content))
</script>

<style scoped lang="less">
.markdown-preview {
  line-height: 1.8;
  color: var(--text-2);

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    color: var(--text-1);
    margin-top: 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
  }

  :deep(code) {
    padding: 2px 6px;
    border-radius: 8px;
    background: rgba(122, 162, 255, 0.1);
    font-family: 'JetBrains Mono', Consolas, monospace;
  }
}
</style>
