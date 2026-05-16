<template>
  <div class="activity-feed glass-panel section-card">
    <div class="activity-feed__header">
      <h3 class="panel-title">实时活动流</h3>
      <n-tag :type="connected ? 'success' : 'warning'" round :bordered="false">
        {{ connected ? 'WebSocket Online' : 'Reconnecting' }}
      </n-tag>
    </div>

    <div class="activity-feed__list">
      <div v-for="item in messages" :key="item.id" class="activity-feed__item">
        <div class="activity-feed__dot"></div>
        <div>
          <div class="activity-feed__title">{{ item.title }}</div>
          <div class="activity-feed__desc">{{ item.description }}</div>
        </div>
        <span class="activity-feed__time">{{ item.time }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkspaceSocket } from '@/hooks/useWorkspaceSocket'

const { connected, messages } = useWorkspaceSocket()
</script>

<style scoped lang="less">
.activity-feed {
  &__header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  &__list {
    margin-top: 18px;
    display: grid;
    gap: 14px;
  }

  &__item {
    display: grid;
    grid-template-columns: 12px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: start;
    padding: 14px 0;
    border-bottom: 1px solid rgba(151, 196, 255, 0.08);
  }

  &__dot {
    width: 10px;
    height: 10px;
    margin-top: 7px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
    box-shadow: 0 0 16px rgba(122, 162, 255, 0.4);
  }

  &__title {
    font-weight: 600;
  }

  &__desc,
  &__time {
    color: var(--text-3);
    font-size: 13px;
  }

  &__desc {
    margin-top: 6px;
    line-height: 1.6;
  }
}
</style>
