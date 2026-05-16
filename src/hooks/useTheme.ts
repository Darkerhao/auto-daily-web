import { computed, watchEffect } from 'vue'
import type { GlobalThemeOverrides } from 'naive-ui'
import { useAppStore } from '@/stores/app'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#7aa2ff',
    primaryColorHover: '#8cb0ff',
    primaryColorPressed: '#6b95fb',
    borderRadius: '18px',
    borderRadiusSmall: '14px',
    successColor: '#5be7a9',
    warningColor: '#ffcf70',
    errorColor: '#ff7d90',
    fontFamily:
      '"Space Grotesk", "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
    fontFamilyMono: '"JetBrains Mono", Consolas, monospace',
  },
  Card: {
    color: 'transparent',
    borderRadius: '24px',
  },
  Input: {
    borderHover: '1px solid rgba(122, 162, 255, 0.35)',
    boxShadowFocus: '0 0 0 2px rgba(122, 162, 255, 0.18)',
    color: 'rgba(8, 14, 27, 0.08)',
  },
  DataTable: {
    thColor: 'rgba(255, 255, 255, 0.02)',
    tdColor: 'transparent',
  },
}

export function useTheme() {
  const appStore = useAppStore()
  const currentTheme = computed(() => appStore.theme)

  watchEffect(() => {
    document.documentElement.dataset.theme = currentTheme.value
  })

  return {
    currentTheme,
    themeOverrides,
    toggleTheme: appStore.toggleTheme,
  }
}
