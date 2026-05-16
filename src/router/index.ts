import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { createDiscreteApi } from 'naive-ui'
import { appRoutes, workspaceChildren } from './routes'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/hooks/usePermission'

const { message } = createDiscreteApi(['message'])

function toRouteRecord(route: (typeof appRoutes)[number]): RouteRecordRaw {
  const base: RouteRecordRaw = {
    path: route.path,
    name: route.name,
    component: route.component,
  }

  if (route.meta) {
    base.meta = route.meta
  }

  return base
}

function toWorkspaceChildRecord(route: (typeof workspaceChildren)[number]): RouteRecordRaw {
  const child: RouteRecordRaw = {
    path: route.path,
    name: route.name,
    component: route.component,
  }

  if (route.meta) {
    child.meta = route.meta
  }

  return child
}

export const router = createRouter({
  history: createWebHistory(),
  routes: appRoutes.map((route) =>
    route.path === '/workspace'
      ? {
          ...toRouteRecord(route),
          redirect: '/workspace/dashboard',
          children: workspaceChildren.map(toWorkspaceChildRecord),
        }
      : toRouteRecord(route),
  ),
})

router.beforeEach((to) => {
  document.title = `${to.meta.title ?? '甲子日报 AI'} - 甲子日报 AI`

  const authStore = useAuthStore()
  const { hasPermission } = usePermission()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.permission && !hasPermission(to.meta.permission)) {
    message.warning('当前账号无权限访问该页面')
    if (to.path !== '/workspace/dashboard') {
      return '/workspace/dashboard'
    }
    return false
  }

  if (authStore.isAuthenticated && to.path === '/login') {
    const redirectTarget =
      typeof to.query.redirect === 'string' && to.query.redirect !== '/login'
        ? to.query.redirect
        : '/workspace/dashboard'
    return redirectTarget
  }

  if (authStore.isAuthenticated && to.path === '/') {
    return '/workspace/dashboard'
  }

  return true
})
