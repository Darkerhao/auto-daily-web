<template>
  <div class="page-shell">
    <SectionHeader
      eyebrow="User Center"
      title="用户管理"
      description="查看已注册用户的基础信息、Git 用户名和权限角色，方便后续按提交作者生成日报。"
    />

    <div class="grid-2">
      <div class="glass-panel section-card">
        <div class="users-page__head">
          <div>
            <h3 class="panel-title">注册用户</h3>
            <div class="panel-subtitle">系统会记录用户注册时填写的 Git 用户名，用于日报提交筛选。</div>
          </div>
          <n-button secondary @click="authStore.fetchUsers">刷新</n-button>
        </div>

        <n-data-table :columns="columns" :data="authStore.users" :bordered="false" />
      </div>

      <div class="glass-panel section-card">
        <h3 class="panel-title">当前账号</h3>
        <div class="panel-subtitle">登录态中的用户信息会同步展示在工作台右上角。</div>

        <div v-if="authStore.user" class="profile-card">
          <n-avatar round :size="72" :src="authStore.user.avatar" />
          <div>
            <strong>{{ authStore.user.name }}</strong>
            <span>{{ authStore.user.email }}</span>
            <span>{{ authStore.user.company }}</span>
          </div>
        </div>

        <div class="permission-list">
          <n-tag v-for="permission in authStore.user?.permissions ?? []" :key="permission" :bordered="false">
            {{ permission }}
          </n-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted } from 'vue'
import { NTag, type DataTableColumns } from 'naive-ui'
import SectionHeader from '@/components/common/SectionHeader.vue'
import { useAuthStore } from '@/stores/auth'
import type { UserListItem } from '@/types/auth'

const authStore = useAuthStore()

const columns: DataTableColumns<UserListItem> = [
  {
    title: '姓名',
    key: 'name',
  },
  {
    title: '邮箱',
    key: 'email',
  },
  {
    title: 'Git 用户名',
    key: 'gitUsername',
  },
  {
    title: '角色',
    key: 'role',
    render(row) {
      return h(NTag, { bordered: false, type: row.role === 'admin' ? 'success' : 'info' }, { default: () => row.role })
    },
  },
  {
    title: '注册时间',
    key: 'createdAt',
  },
  {
    title: '最近登录',
    key: 'lastLoginAt',
  },
]

onMounted(() => {
  void authStore.fetchUsers()
})
</script>

<style scoped lang="less">
.users-page__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.profile-card {
  margin-top: 22px;
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--border-color-soft);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);

  div {
    display: grid;
    gap: 6px;
  }

  strong {
    font-size: 20px;
  }

  span {
    color: var(--text-3);
  }
}

.permission-list {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
