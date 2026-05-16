<template>
  <div class="commit-list glass-panel section-card">
    <div class="commit-list__header">
      <h3 class="panel-title">Commit 列表</h3>
      <div class="panel-subtitle">{{ commits.length }} 条提交已聚合</div>
    </div>

    <n-checkbox-group :value="selectedIds" @update:value="handleSelectionChange">
      <div class="commit-list__items">
        <label v-for="item in commits" :key="item.id" class="commit-list__item">
          <n-checkbox :value="item.id" />
          <div class="commit-list__content">
            <div class="commit-list__top">
              <span class="mono">{{ item.shortHash }}</span>
              <span class="commit-list__time">{{ item.time }}</span>
            </div>
            <div class="commit-list__message">{{ item.message }}</div>
            <div class="commit-list__modules">
              <n-tag v-for="module in item.modules" :key="module" size="small" round :bordered="false">
                {{ module }}
              </n-tag>
            </div>
          </div>
        </label>
      </div>
    </n-checkbox-group>
  </div>
</template>

<script setup lang="ts">
import type { CommitItem } from '@/types/report'

defineProps<{
  commits: CommitItem[]
  selectedIds: string[]
}>()

const emit = defineEmits<{
  'update:selectedIds': [value: string[]]
}>()

function handleSelectionChange(value: Array<string | number>) {
  emit(
    'update:selectedIds',
    value.filter((item): item is string => typeof item === 'string'),
  )
}
</script>

<style scoped lang="less">
.commit-list {
  &__items {
    margin-top: 18px;
    display: grid;
    gap: 12px;
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

  &__top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--text-3);
    font-size: 13px;
  }

  &__message {
    margin-top: 8px;
    line-height: 1.6;
    font-weight: 600;
  }

  &__modules {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  &__time {
    color: var(--text-3);
  }
}
</style>
