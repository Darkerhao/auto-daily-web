<template>
  <div class="metric-card glass-panel section-card">
    <div class="metric-card__label">{{ item.label }}</div>
    <div class="metric-card__value">{{ item.value }}</div>
    <div class="metric-card__footer">
      <span :class="['metric-card__trend', `metric-card__trend--${item.status}`]">{{ item.trend }}</span>
      <span class="metric-card__hint">vs yesterday</span>
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

  &::after {
    content: '';
    position: absolute;
    inset: auto -20% -40% auto;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(122, 162, 255, 0.18), transparent 70%);
  }

  &__label {
    color: var(--text-3);
    font-size: 13px;
  }

  &__value {
    margin-top: 14px;
    font-size: 34px;
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
  }

  &__trend {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;

    &--brand {
      color: var(--brand-2);
      background: rgba(122, 162, 255, 0.12);
    }

    &--success {
      color: var(--success);
      background: rgba(91, 231, 169, 0.12);
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
