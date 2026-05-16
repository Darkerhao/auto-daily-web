<template>
  <div class="app-logo">
    <div class="app-logo__mark">
      <Sparkles :size="18" />
    </div>
    <div v-if="!collapsed" class="app-logo__text">
      <strong>甲子日报 AI</strong>
      <span>Git Diff to Feishu</span>
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
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: #081321;
    background:
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.84), transparent 32%),
      linear-gradient(135deg, var(--brand-1), var(--brand-2));
    box-shadow: 0 12px 32px rgba(109, 214, 255, 0.28);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
      font-size: 15px;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }

    span {
      color: var(--text-3);
      font-size: 12px;
      line-height: 1.2;
    }
  }
}
</style>
