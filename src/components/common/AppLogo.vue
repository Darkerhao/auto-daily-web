<template>
  <div class="app-logo">
    <div class="app-logo__mark">
      <Sparkles :size="18" />
    </div>
    <div v-if="!collapsed" class="app-logo__text">
      <strong>甲子日报 AI</strong>
      <span>Engineering Daily Workspace</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sparkles } from '@lucide/vue'

defineProps<{
  collapsed?: boolean
}>()
</script>

<style scoped lang="less">
.app-logo {
  display: flex;
  align-items: center;
  gap: 12px;

  &__mark {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    color: #081321;
    background: var(--brand-gradient);
    box-shadow:
      0 14px 34px rgba(88, 215, 255, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 3px;

    strong {
      font-size: 15px;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    span {
      color: var(--text-4);
      font-size: 11px;
      line-height: 1.2;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  }
}
</style>
