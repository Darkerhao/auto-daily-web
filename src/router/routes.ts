import type { Component } from 'vue'
import {
  Blocks,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  Webhook,
} from '@lucide/vue'

export interface AppRoute {
  path: string
  name: string
  component: () => Promise<Component>
  meta?: {
    title: string
    requiresAuth?: boolean
    permission?: import('@/types/auth').AppPermission
    icon?: Component
    showInSidebar?: boolean
  }
}

export const workspaceChildren: AppRoute[] = [
  {
    path: 'dashboard',
    name: 'dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: {
      title: '控制台',
      requiresAuth: true,
      permission: 'dashboard:view',
      icon: LayoutDashboard,
      showInSidebar: true,
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
      icon: Blocks,
      showInSidebar: true,
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
      icon: FileText,
      showInSidebar: true,
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
      icon: Webhook,
      showInSidebar: true,
    },
  },
  {
    path: 'users',
    name: 'users',
    component: () => import('@/views/users/index.vue'),
    meta: {
      title: '用户管理',
      requiresAuth: true,
      permission: 'user:manage',
      icon: Users,
      showInSidebar: true,
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
      icon: Settings,
      showInSidebar: true,
    },
  },
]

export const appRoutes: AppRoute[] = [
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
    name: 'workspace',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: {
      title: '工作台',
      requiresAuth: true,
    },
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
