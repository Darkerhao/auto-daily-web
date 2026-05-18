<template>
  <div class="workspace-layout">
    <aside :class="['workspace-layout__sidebar', appStore.sidebarCollapsed ? 'is-collapsed' : '']">
      <div class="workspace-layout__sidebar-inner glass-panel">
        <div class="workspace-layout__sidebar-top">
          <AppLogo :collapsed="appStore.sidebarCollapsed" />
          <div v-if="!appStore.sidebarCollapsed" class="workspace-layout__workspace-meta">
            <strong>{{ appStore.workspaceProfile.workspaceName }}</strong>
            <span>{{ appStore.workspaceProfile.teamName }}</span>
          </div>
        </div>

        <nav class="workspace-layout__nav">
          <router-link
            v-for="item in sidebarRoutes"
            :key="item.name"
            :to="item.path"
            class="workspace-layout__nav-link"
            active-class="is-active"
          >
            <div class="workspace-layout__nav-icon">
              <component :is="item.meta?.icon" :size="18" />
            </div>
            <div v-if="!appStore.sidebarCollapsed" class="workspace-layout__nav-copy">
              <span>{{ item.meta?.title }}</span>
              <small>{{ navDescriptions[item.name] }}</small>
            </div>
          </router-link>
        </nav>

        <div class="workspace-layout__sidebar-footer surface-strip">
          <div v-if="!appStore.sidebarCollapsed" class="workspace-layout__sidebar-footer-copy">
            <strong>{{ environmentLabel }}</strong>
            <span>当前工作区运行环境</span>
          </div>
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
          <div class="workspace-layout__header-copy">
            <div class="workspace-layout__header-title">{{ route.meta.title }}</div>
            <div class="workspace-layout__header-subtitle">
              {{ appStore.workspaceLabel }} · {{ environmentLabel }}
            </div>
          </div>
          <div class="info-pills workspace-layout__header-pills">
            <span class="info-pill">SaaS Preview</span>
            <span class="info-pill">{{ route.path }}</span>
          </div>
        </div>

        <div class="workspace-layout__header-actions">
          <div class="workspace-layout__request-status">
            <span class="workspace-layout__request-dot" :class="{ 'is-active': appStore.isRequestLoading }"></span>
            <span>{{ appStore.isRequestLoading ? '系统处理中' : '系统空闲' }}</span>
          </div>
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

const navDescriptions: Record<string, string> = {
  dashboard: '效率总览',
  repositories: '接入与同步',
  reports: '流式生成',
  feishu: '投递链路',
  settings: '模型与参数',
}

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
  gap: 18px;
  padding: 18px;
  align-items: start;

  &__sidebar {
    width: 300px;
    transition: width 0.25s ease;

    &.is-collapsed {
      width: 104px;
    }
  }

  &__sidebar-inner {
    position: sticky;
    top: 18px;
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-height: calc(100vh - 36px);
    padding: 22px 18px 18px;
  }

  &__sidebar-top {
    display: grid;
    gap: 16px;
  }

  &__workspace-meta {
    display: grid;
    gap: 6px;
    padding: 14px 16px;
    border-radius: 20px;
    border: 1px solid var(--border-color-soft);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));

    strong {
      font-size: 14px;
    }

    span {
      color: var(--text-3);
      font-size: 12px;
    }
  }

  &__nav {
    display: grid;
    gap: 10px;
  }

  &__nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 64px;
    padding: 0 14px;
    border-radius: 20px;
    border: 1px solid transparent;
    color: var(--text-2);
    transition:
      transform 0.22s ease,
      background 0.25s ease,
      color 0.25s ease,
      border-color 0.25s ease;

    &:hover {
      transform: translateX(2px);
      background: rgba(109, 177, 255, 0.08);
      border-color: rgba(109, 177, 255, 0.14);
      color: var(--text-1);
    }

    &.is-active {
      background: linear-gradient(135deg, rgba(109, 177, 255, 0.16), rgba(118, 242, 198, 0.1));
      color: var(--text-1);
      border: 1px solid rgba(109, 177, 255, 0.2);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }
  }

  &__nav-icon {
    width: 38px;
    height: 38px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-1);
    flex-shrink: 0;
  }

  &__nav-copy {
    display: grid;
    gap: 4px;

    span {
      font-weight: 600;
    }

    small {
      color: var(--text-3);
      font-size: 12px;
    }
  }

  &__sidebar-footer {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
  }

  &__sidebar-footer-copy {
    display: grid;
    gap: 4px;

    strong {
      font-size: 13px;
    }

    span {
      color: var(--text-3);
      font-size: 12px;
    }
  }

  &__content {
    min-width: 0;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
    padding: 20px 24px;
  }

  &__header-left,
  &__header-actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__header-left {
    flex-wrap: wrap;
  }

  &__header-copy {
    min-width: 0;
  }

  &__header-title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  &__header-subtitle {
    margin-top: 6px;
    color: var(--text-3);
    font-size: 13px;
  }

  &__header-pills {
    align-self: center;
  }

  &__request-status {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--border-color-soft);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-3);
    font-size: 13px;
  }

  &__request-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--text-4);

    &.is-active {
      background: var(--brand-1);
      box-shadow: 0 0 18px rgba(118, 242, 198, 0.44);
    }
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
    margin-top: 18px;
  }
}

@media (max-width: 960px) {
  .workspace-layout {
    grid-template-columns: 1fr;
    padding: 12px;

    &__sidebar {
      width: 100%;
    }

    &__sidebar-inner {
      min-height: auto;
      position: static;
      gap: 16px;
      padding: 16px;
    }

    &__nav {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__nav-link {
      padding: 14px;
    }

    &__header {
      flex-direction: column;
      align-items: flex-start;
    }

    &__header-actions {
      width: 100%;
      justify-content: space-between;
      flex-wrap: wrap;
    }

    &__sidebar-footer {
      justify-content: center;
    }

    &__sidebar-footer-copy {
      display: none;
    }
  }
}

@media (max-width: 768px) {
  .workspace-layout {
    gap: 12px;

    &__header {
      padding: 18px;
    }

    &__request-status {
      width: 100%;
      justify-content: center;
    }
  }
}

@media (max-width: 560px) {
  .workspace-layout {
    &__workspace-meta {
      display: none;
    }

    &__nav {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__nav-link {
      min-height: 54px;
      padding: 12px;
    }

    &__nav-copy {
      small {
        display: none;
      }
    }

    &__header-pills {
      display: none;
    }
  }
}
</style>
