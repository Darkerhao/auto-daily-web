import { createApp } from 'vue'
import App from './App.vue'
import { pinia } from '@/stores'
import { router } from '@/router'
import '@/styles/index.less'

if (import.meta.env.VITE_USE_API_MOCK === 'true') {
  await import('@/api/mock')
}

const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
