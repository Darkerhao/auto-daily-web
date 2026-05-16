import { mockPromptPresets } from '@/mock/data'
import type { GenerateReportPayload, StreamChunk } from '@/types/report'

const streamParts = [
  '正在聚合今日 Commit 批次...\n',
  '已识别功能开发、Bug 修复、重构优化三类研发动作。\n',
  '正在抽取业务价值与飞书同步结果...\n',
  '日报草稿生成完成，可继续润色后推送。\n',
]

export async function* createReportStream(
  payload: GenerateReportPayload,
): AsyncGenerator<StreamChunk, void, unknown> {
  const preset = mockPromptPresets.find((item) => item.id === payload.style)
  for (let index = 0; index < streamParts.length; index += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 320))
    const suffix = index === 0 ? `模板：${preset?.name ?? '默认'}\n` : ''
    yield {
      delta: `${suffix}${streamParts[index]}`,
      done: false,
    }
  }

  yield {
    delta: '',
    done: true,
  }
}
