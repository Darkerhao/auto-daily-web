<template>
  <n-config-provider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-message-provider>
            <RouterView v-slot="{ Component, route }">
              <transition name="page-fade" mode="out-in">
                <component :is="Component" :key="route.fullPath" />
              </transition>
            </RouterView>
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import {
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
} from 'naive-ui'
import { useTheme } from '@/hooks/useTheme'

const { themeOverrides, currentTheme } = useTheme()
const naiveTheme = computed(() => (currentTheme.value === 'dark' ? darkTheme : null))
</script>
