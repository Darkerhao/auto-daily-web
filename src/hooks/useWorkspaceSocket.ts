import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { ActivityEvent } from '@/types/dashboard'

const socketSeed: ActivityEvent[] = [
  {
    id: 'ws-1',
    title: 'Git Webhook 已接入',
    description: 'auto-daily-api 新增 push 事件，进入日报队列。',
    time: '刚刚',
    type: 'system',
  },
  {
    id: 'ws-2',
    title: '日报推送成功',
    description: '甲子日报 AI 已将今日摘要同步到飞书机器人。',
    time: '2 分钟前',
    type: 'push',
  },
]

export function useWorkspaceSocket() {
  const connected = ref(false)
  const messages = ref<ActivityEvent[]>([...socketSeed])
  let timer = 0

  onMounted(() => {
    connected.value = true
    timer = window.setInterval(() => {
      messages.value = [
        {
          id: crypto.randomUUID(),
          title: 'AI 汇总队列刷新',
          description: '检测到新的 Commit 批次，准备进入 Diff 聚合流程。',
          time: '刚刚',
          type: 'commit',
        },
        ...messages.value.slice(0, 5),
      ]
    }, 10000)
  })

  onBeforeUnmount(() => {
    connected.value = false
    window.clearInterval(timer)
  })

  return {
    connected,
    messages,
  }
}
