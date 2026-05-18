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
          <h2>登录工作台</h2>
          <span>Demo Access</span>
        </div>
        <n-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
          <n-form-item path="email" label="邮箱">
            <n-input v-model:value="form.email" placeholder="name@company.com" />
          </n-form-item>
          <n-form-item path="password" label="密码">
            <n-input v-model:value="form.password" type="password" placeholder="请输入密码" />
          </n-form-item>
          <n-button block type="primary" size="large" :loading="loading" @click="handleLogin">
            邮箱登录
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

const form = reactive({
  email: 'demo@jiazi.ai',
  password: '123456',
})

const rules: FormRules = {
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
}

async function handleLogin() {
  await formRef.value?.validate()
  await withLoading(async () => {
    await authStore.login(form)
    message.success('登录成功')
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
