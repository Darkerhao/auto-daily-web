<template>
  <div class="page-heading">
    <div>
      <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
      <h1 class="page-heading__title">{{ title }}</h1>
      <p v-if="description" class="page-heading__desc">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="page-heading__actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>
