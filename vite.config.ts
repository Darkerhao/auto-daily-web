import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3300'

  return {
    plugins: [
      vue(),
      Components({
        dts: 'src/components.d.ts',
        resolvers: [NaiveUiResolver()],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return
            }

            if (id.includes('echarts')) {
              return 'vendor-echarts'
            }

            if (id.includes('vue-router') || id.includes('pinia')) {
              return 'vendor-state'
            }

            if (id.includes('/vue/') || id.includes('\\vue\\') || id.includes('@vue')) {
              return 'vendor-vue-core'
            }

            if (id.includes('axios') || id.includes('dayjs') || id.includes('markdown-it')) {
              return 'vendor-utils'
            }
          },
        },
      },
    },
  }
})
