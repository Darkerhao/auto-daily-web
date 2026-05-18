import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { createDiscreteApi } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/hooks/usePermission'
import type { AppRoute } from './routes'
import { appRoutes, workspaceChildren } from './routes'

const { message } = createDiscreteApi(['message'])

const workspaceRoot = appRoutes.find((item) => item.name === 'workspace')
const notFoundRoute = appRoutes.find((item) => item.name === 'not-found')
const staticRoutes = appRoutes.filter((item) => item.name !== 'workspace' && item.name !== 'not-found')

if (!workspaceRoot || !notFoundRoute) {
  throw new Error('路由配置缺失工作台或兜底页')
}

function toRouteRecord(route: AppRoute): RouteRecordRaw {
  const record: RouteRecordRaw = {
    path: route.path,
    name: route.name,
    component: route.component,
  }

  if (route.meta) {
    record.meta = route.meta
  }

  return record
}

const routes: RouteRecordRaw[] = [
  ...staticRoutes.map(toRouteRecord),
  {
    path: workspaceRoot.path,
    name: workspaceRoot.name,
    component: workspaceRoot.component,
    redirect: '/workspace/dashboard',
    children: workspaceChildren.map(toRouteRecord),
  },
  toRouteRecord(notFoundRoute),
]

if (workspaceRoot.meta) {
  routes[staticRoutes.length]!.meta = workspaceRoot.meta
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  document.title = `${to.meta.title ?? '甲子日报 AI'} · 甲子日报 AI`

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
    return typeof to.query.redirect === 'string' ? to.query.redirect : '/workspace/dashboard'
  }

  if (authStore.isAuthenticated && to.path === '/') {
    return '/workspace/dashboard'
  }

  return true
})
