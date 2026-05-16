<template>
  <div class="workspace-layout">
    <aside :class="['workspace-layout__sidebar', appStore.sidebarCollapsed ? 'is-collapsed' : '']">
      <div class="workspace-layout__sidebar-inner glass-panel">
        <AppLogo :collapsed="appStore.sidebarCollapsed" />

        <nav class="workspace-layout__nav">
          <router-link
            v-for="item in sidebarRoutes"
            :key="item.name"
            :to="item.path"
            class="workspace-layout__nav-link"
            active-class="is-active"
          >
            <component :is="item.meta?.icon" :size="18" />
            <span v-if="!appStore.sidebarCollapsed">{{ item.meta?.title }}</span>
          </router-link>
        </nav>

        <div class="workspace-layout__sidebar-footer">
          <n-button quaternary circle @click="appStore.setSidebarCollapsed(!appStore.sidebarCollapsed)">
            <template #icon>
              <component :is="appStore.sidebarCollapsed ? PanelLeftOpen : PanelLeftClose" :size="16" />
            </template>
          </n-button>
        </div>
      </div>
    </aside>

    <main class="workspace-layout__content">
      <header class="workspace-layout__header glass-panel">
        <div class="workspace-layout__header-left">
          <div>
            <div class="workspace-layout__header-title">{{ route.meta.title }}</div>
            <div class="workspace-layout__header-subtitle">
              {{ appStore.workspaceLabel }} · {{ environmentLabel }}
            </div>
          </div>
          <n-tag round type="info" :bordered="false">SaaS Preview</n-tag>
        </div>

        <div class="workspace-layout__header-actions">
          <n-button quaternary circle @click="toggleTheme">
            <template #icon>
              <component :is="appStore.theme === 'dark' ? Sun : Moon" :size="16" />
            </template>
          </n-button>
          <n-avatar round size="medium" :src="authStore.user?.avatar ?? ''" />
          <div class="workspace-layout__profile">
            <span>{{ authStore.user?.name }}</span>
            <small>{{ authStore.user?.company }}</small>
          </div>
          <n-button quaternary circle @click="handleLogout">
            <template #icon>
              <LogOut :size="16" />
            </template>
          </n-button>
        </div>
      </header>

      <section class="workspace-layout__body">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogOut, Moon, PanelLeftClose, PanelLeftOpen, Sun } from '@lucide/vue'
import AppLogo from '@/components/common/AppLogo.vue'
import { workspaceChildren } from '@/router/routes'
import { useTheme } from '@/hooks/useTheme'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const { toggleTheme } = useTheme()
const environmentLabel = computed(() => {
  const value = appStore.workspaceProfile.environment
  if (value === 'production') return 'Production'
  if (value === 'staging') return 'Staging'
  return 'Demo'
})

const sidebarRoutes = computed(() =>
  workspaceChildren
    .filter((item) => item.meta?.showInSidebar)
    .map((item) => ({
      ...item,
      path: `/workspace/${item.path}`,
    })),
)

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped lang="less">
.workspace-layout {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  min-height: 100vh;
  gap: 16px;
  padding: 16px;

  &__sidebar {
    width: 268px;
    transition: width 0.25s ease;

    &.is-collapsed {
      width: 92px;
    }
  }

  &__sidebar-inner {
    position: sticky;
    top: 16px;
    display: flex;
    flex-direction: column;
    gap: 26px;
    min-height: calc(100vh - 32px);
    padding: 24px 18px;
  }

  &__nav {
    display: grid;
    gap: 10px;
  }

  &__nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    padding: 0 14px;
    border-radius: 16px;
    color: var(--text-2);
    transition:
      transform 0.25s ease,
      background 0.25s ease,
      color 0.25s ease;

    &:hover {
      transform: translateX(2px);
      background: rgba(122, 162, 255, 0.08);
      color: var(--text-1);
    }

    &.is-active {
      background: linear-gradient(135deg, rgba(122, 162, 255, 0.14), rgba(122, 240, 209, 0.08));
      color: var(--text-1);
      border: 1px solid rgba(122, 162, 255, 0.18);
    }
  }

  &__sidebar-footer {
    margin-top: auto;
    display: flex;
    justify-content: center;
  }

  &__content {
    min-width: 0;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 18px 24px;
  }

  &__header-left,
  &__header-actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__header-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  &__header-subtitle {
    margin-top: 4px;
    color: var(--text-3);
    font-size: 13px;
  }

  &__profile {
    display: flex;
    flex-direction: column;
    gap: 2px;

    span {
      font-size: 14px;
      font-weight: 600;
    }

    small {
      color: var(--text-3);
      font-size: 12px;
    }
  }

  &__body {
    margin-top: 16px;
  }
}

@media (max-width: 960px) {
  .workspace-layout {
    grid-template-columns: 1fr;

    &__sidebar {
      width: 100%;
    }

    &__sidebar-inner {
      min-height: auto;
      position: static;
    }

    &__nav {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    &__nav-link {
      justify-content: center;
      padding: 0;
    }

    &__header {
      flex-direction: column;
      align-items: flex-start;
    }

    &__header-actions {
      width: 100%;
      justify-content: space-between;
    }
  }
}

@media (max-width: 768px) {
  .workspace-layout {
    padding: 10px;

    &__nav {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}
</style>
