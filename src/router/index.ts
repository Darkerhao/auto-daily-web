import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { createDiscreteApi } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/hooks/usePermission'

const { message } = createDiscreteApi(['message'])

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/views/landing/index.vue'),
    meta: {
      title: '甲子日报 AI',
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/index.vue'),
    meta: {
      title: '登录',
    },
  },
  {
    path: '/workspace',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: {
      title: '工作台',
      requiresAuth: true,
    },
    redirect: '/workspace/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '控制台',
          requiresAuth: true,
          permission: 'dashboard:view',
        },
      },
      {
        path: 'repositories',
        name: 'repositories',
        component: () => import('@/views/repository/index.vue'),
        meta: {
          title: '仓库管理',
          requiresAuth: true,
          permission: 'repository:manage',
        },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/views/report/index.vue'),
        meta: {
          title: '日报生成',
          requiresAuth: true,
          permission: 'report:generate',
        },
      },
      {
        path: 'feishu',
        name: 'feishu',
        component: () => import('@/views/feishu/index.vue'),
        meta: {
          title: '飞书配置',
          requiresAuth: true,
          permission: 'feishu:manage',
        },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/settings/index.vue'),
        meta: {
          title: '设置中心',
          requiresAuth: true,
          permission: 'settings:manage',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/landing/index.vue'),
    meta: {
      title: '首页',
    },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
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
    return typeof to.query.redirect === 'string' ? to.query.redirect : '/workspace/dashboard'
  }

  if (authStore.isAuthenticated && to.path === '/') {
    return '/workspace/dashboard'
  }

  return true
})
