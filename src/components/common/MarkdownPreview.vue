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
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 100%), var(--panel-bg-accent);

  :deep(> *:first-child) {
    margin-top: 0;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    color: var(--text-1);
    margin-top: 1.4em;
    margin-bottom: 0.6em;
    letter-spacing: -0.02em;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
  }

  :deep(p),
  :deep(li) {
    color: var(--text-2);
  }

  :deep(blockquote) {
    margin: 18px 0;
    padding: 12px 16px;
    border-left: 3px solid var(--brand-2);
    border-radius: 0 16px 16px 0;
    background: rgba(109, 177, 255, 0.08);
    color: var(--text-2);
  }

  :deep(code) {
    padding: 2px 6px;
    border-radius: 8px;
    background: rgba(109, 177, 255, 0.1);
    font-family: 'JetBrains Mono', Consolas, monospace;
  }

  :deep(pre) {
    padding: 16px;
    border-radius: 18px;
    overflow: auto;
    background: rgba(4, 10, 20, 0.44);
  }
}
</style>
