<template>
  <div class="metric-card glass-panel section-card">
    <div class="metric-card__bar"></div>
    <div class="metric-card__label">{{ item.label }}</div>
    <div class="metric-card__value">{{ item.value }}</div>
    <div class="metric-card__footer">
      <span :class="['metric-card__trend', `metric-card__trend--${item.status}`]">{{ item.trend }}</span>
      <span class="metric-card__hint">较昨日</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MetricCard } from '@/types/dashboard'

defineProps<{
  item: MetricCard
}>()
</script>

<style scoped lang="less">
.metric-card {
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--border-color-strong);
  }

  &__bar {
    width: 56px;
    height: 5px;
    border-radius: 999px;
    background: var(--brand-gradient);
    box-shadow: 0 8px 18px rgba(109, 177, 255, 0.3);
  }

  &__label {
    margin-top: 16px;
    color: var(--text-3);
    font-size: 13px;
  }

  &__value {
    margin-top: 14px;
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.04em;
  }

  &__footer {
    margin-top: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    flex-wrap: wrap;
  }

  &__trend {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;

    &--brand {
      color: var(--brand-2);
      background: rgba(109, 177, 255, 0.12);
    }

    &--success {
      color: var(--success);
      background: rgba(84, 227, 160, 0.12);
    }

    &--warning {
      color: var(--warning);
      background: rgba(255, 207, 112, 0.12);
    }
  }

  &__hint {
    color: var(--text-3);
  }
}
</style>
