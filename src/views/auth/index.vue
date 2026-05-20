<template>
  <div class="auth-page">
    <div class="auth-page__panel glass-panel-strong">
      <div class="auth-page__hero">
        <AppLogo />
        <h1>接入你的研发工作流</h1>
        <p>把 Commit、Diff、日报生成与飞书投递串成一条真正可运营的研发日报链路。</p>
        <div class="auth-page__badges">
          <n-tag round :bordered="false">GitHub OAuth Reserved</n-tag>
          <n-tag round :bordered="false">GitLab OAuth Reserved</n-tag>
        </div>
        <div class="auth-page__insights surface-strip">
          <div class="metric-inline">
            <span>多仓库聚合</span>
            <strong>12 repos</strong>
          </div>
          <div class="metric-inline">
            <span>今日投递</span>
            <strong>14 reports</strong>
          </div>
          <div class="metric-inline">
            <span>稳定性</span>
            <strong>98.4%</strong>
          </div>
        </div>
      </div>

      <div class="auth-page__form glass-panel">
        <div class="auth-page__form-head">
          <h2>{{ mode === 'login' ? '登录工作台' : '注册账号' }}</h2>
          <span>{{ mode === 'login' ? 'Demo Access' : 'User Profile' }}</span>
        </div>
        <n-tabs v-model:value="mode" type="segment" animated>
          <n-tab-pane name="login" tab="登录" />
          <n-tab-pane name="register" tab="注册" />
        </n-tabs>
        <n-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleSubmit">
          <n-form-item v-if="mode === 'register'" path="name" label="姓名">
            <n-input v-model:value="form.name" placeholder="请输入姓名" />
          </n-form-item>
          <n-form-item path="email" label="邮箱">
            <n-input v-model:value="form.email" placeholder="name@company.com" />
          </n-form-item>
          <n-form-item path="password" label="密码">
            <n-input v-model:value="form.password" type="password" placeholder="请输入密码" />
          </n-form-item>
          <n-form-item v-if="mode === 'register'" path="company" label="公司 / 团队">
            <n-input v-model:value="form.company" placeholder="请输入公司或团队名称" />
          </n-form-item>
          <n-form-item v-if="mode === 'register'" path="gitUsername" label="Git 用户名">
            <n-input v-model:value="form.gitUsername" placeholder="用于按提交作者生成日报" />
          </n-form-item>
          <n-button block type="primary" size="large" :loading="loading" @click="handleSubmit">
            {{ mode === 'login' ? '邮箱登录' : '注册并进入' }}
          </n-button>
          <div class="auth-page__actions">
            <n-button secondary block>GitHub 登录（预留）</n-button>
            <n-button secondary block>GitLab 登录（预留）</n-button>
          </div>
        </n-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import AppLogo from '@/components/common/AppLogo.vue'
import { useAuthStore } from '@/stores/auth'
import { useLoading } from '@/hooks/useLoading'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()
const formRef = ref<FormInst | null>(null)
const { loading, withLoading } = useLoading()

const mode = ref<'login' | 'register'>('login')
const form = reactive({
  name: '陈北川',
  email: 'demo@jiazi.ai',
  password: '123456',
  company: '甲子日报 AI',
  gitUsername: '陈北川',
})

const rules: FormRules = {
  name: {
    required: true,
    message: '请输入姓名',
    trigger: ['blur', 'input'],
  },
  email: {
    required: true,
    message: '请输入邮箱',
    trigger: ['blur', 'input'],
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: ['blur', 'input'],
  },
  company: {
    required: true,
    message: '请输入公司或团队名称',
    trigger: ['blur', 'input'],
  },
  gitUsername: {
    required: true,
    message: '请输入 Git 用户名',
    trigger: ['blur', 'input'],
  },
}

async function handleSubmit() {
  await formRef.value?.validate()
  await withLoading(async () => {
    if (mode.value === 'login') {
      await authStore.login({
        email: form.email,
        password: form.password,
      })
      message.success('登录成功')
    } else {
      await authStore.register({
        name: form.name,
        email: form.email,
        password: form.password,
        company: form.company,
        gitUsername: form.gitUsername,
      })
      message.success('注册成功')
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/workspace/dashboard'
    router.push(redirect)
  })
}
</script>

<style scoped lang="less">
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;

  &__panel {
    width: min(1100px, 100%);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);
    gap: 20px;
    padding: 20px;
  }

  &__hero,
  &__form {
    padding: 30px;
  }

  &__hero {
    display: flex;
    flex-direction: column;
    justify-content: center;

    h1 {
      margin: 24px 0 0;
      font-size: clamp(32px, 4vw, 54px);
      line-height: 1;
      letter-spacing: -0.05em;
    }

    p {
      margin-top: 18px;
      color: var(--text-2);
      line-height: 1.8;
      max-width: 540px;
    }
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
  }

  &__insights {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 28px;
  }

  &__form {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 100%), var(--panel-bg);

    h2 {
      margin: 0;
      font-size: 26px;
    }
  }

  &__form-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    margin-bottom: 22px;

    span {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 0 12px;
      border-radius: 999px;
      background: rgba(109, 177, 255, 0.1);
      color: var(--brand-2);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
  }

  :deep(.n-tabs) {
    margin-bottom: 18px;
  }

  &__actions {
    display: grid;
    gap: 12px;
    margin-top: 14px;
  }
}

@media (max-width: 960px) {
  .auth-page {
    &__panel {
      grid-template-columns: 1fr;
    }

    &__insights {
      grid-template-columns: 1fr;
    }
  }
}
</style>
