import { computed, watchEffect } from 'vue'
import type { GlobalThemeOverrides } from 'naive-ui'
import { useAppStore } from '@/stores/app'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#6db1ff',
    primaryColorHover: '#88c2ff',
    primaryColorPressed: '#5898f2',
    borderRadius: '20px',
    borderRadiusSmall: '14px',
    bodyColor: 'var(--bg-base)',
    closeIconColor: 'var(--text-3)',
    closeIconColorHover: 'var(--text-1)',
    closeIconColorPressed: 'var(--text-2)',
    closeColorHover: 'rgba(109, 177, 255, 0.12)',
    closeColorPressed: 'rgba(109, 177, 255, 0.18)',
    boxShadow2: 'var(--shadow-floating)',
    boxShadow3: 'var(--shadow-floating)',
    successColor: '#54e3a0',
    warningColor: '#ffcf70',
    errorColor: '#ff7d90',
    fontFamily:
      '"Space Grotesk", "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
    fontFamilyMono: '"JetBrains Mono", Consolas, monospace',
  },
  Card: {
    borderRadius: '28px',
  },
  Input: {
    borderHover: '1px solid rgba(109, 177, 255, 0.4)',
    boxShadowFocus: '0 0 0 3px rgba(109, 177, 255, 0.16)',
    color: 'var(--bg-muted)',
  },
  Popconfirm: {
    borderRadius: '22px',
  },
  Popover: {
    borderRadius: '22px',
  },
  DataTable: {
    thColor: 'rgba(109, 177, 255, 0.06)',
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
