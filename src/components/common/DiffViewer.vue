<template>
  <div class="diff-viewer glass-panel section-card">
    <div class="diff-viewer__header">
      <div>
        <h3 class="panel-title">{{ file.path }}</h3>
        <div class="panel-subtitle">
          {{ file.language }} · {{ file.status ?? 'modified' }} · +{{ file.additions }} / -{{ file.deletions }}
        </div>
      </div>
      <div class="info-pill mono">{{ file.patch.length }} lines</div>
    </div>

    <div class="diff-viewer__code mono">
      <div
        v-for="(line, index) in file.patch"
        :key="`${file.path}-${index}`"
        :class="[
          'diff-viewer__line',
          line.startsWith('+') ? 'diff-viewer__line--add' : '',
          line.startsWith('-') ? 'diff-viewer__line--remove' : '',
          line.startsWith('@@') ? 'diff-viewer__line--meta' : '',
        ]"
      >
        {{ line }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiffFile } from '@/types/report'

defineProps<{
  file: DiffFile
}>()
</script>

<style scoped lang="less">
.diff-viewer {
  &__header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  &__code {
    margin-top: 18px;
    display: grid;
    gap: 8px;
    font-size: 13px;
    line-height: 1.7;
    max-height: 560px;
    overflow: auto;
  }

  &__line {
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.02);
    white-space: pre-wrap;
    word-break: break-word;

    &--add {
      color: #8df7c0;
      background: rgba(84, 227, 160, 0.08);
    }

    &--remove {
      color: #ff9aa9;
      background: rgba(255, 125, 144, 0.08);
    }

    &--meta {
      color: var(--brand-3);
      background: rgba(88, 215, 255, 0.08);
    }
  }
}
</style>
