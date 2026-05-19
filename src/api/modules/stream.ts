import { reportApi } from './report'
import type { GenerateReportPayload, GeneratedReport, StreamChunk } from '@/types/report'
import { readStorage, storageKeys } from '@/utils/storage'

const useMockStream = import.meta.env.VITE_USE_API_MOCK === 'true'

interface SseMessage {
  event: string
  data: unknown
}

function parseSseMessage(rawMessage: string): SseMessage | null {
  const normalizedMessage = rawMessage.replace(/\r/g, '').trim()
  if (!normalizedMessage) {
    return null
  }

  let event = 'message'
  const dataLines: string[] = []

  for (const line of normalizedMessage.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim()
      continue
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim())
    }
  }

  if (dataLines.length === 0) {
    return null
  }

  const rawData = dataLines.join('\n')
  try {
    return {
      event,
      data: JSON.parse(rawData) as unknown,
    }
  } catch {
    return {
      event,
      data: rawData,
    }
  }
}

function getTokenHeader() {
  const token = readStorage<string>(storageKeys.token, '')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function readErrorMessage(rawBody: string) {
  try {
    const parsed = JSON.parse(rawBody) as { message?: string }
    return parsed.message?.trim() || rawBody.trim()
  } catch {
    return rawBody.trim()
  }
}

async function* createMockReportStream(
  payload: GenerateReportPayload,
): AsyncGenerator<StreamChunk, void, unknown> {
  const report = await reportApi.generate(payload)
  yield {
    delta: report.markdown,
    done: false,
  }
  yield {
    delta: '',
    done: true,
    report,
  }
}

export async function* createReportStream(
  payload: GenerateReportPayload,
): AsyncGenerator<StreamChunk, void, unknown> {
  if (useMockStream) {
    yield* createMockReportStream(payload)
    return
  }

  const response = await fetch('/api/report/stream', {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...getTokenHeader(),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const rawBody = await response.text()
    const message = readErrorMessage(rawBody) || `流式生成失败（HTTP ${response.status}）`
    throw new Error(message)
  }

  if (!response.body) {
    throw new Error('流式响应不可用')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })

    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''

    for (const frame of frames) {
      const message = parseSseMessage(frame)
      if (!message) {
        continue
      }

      if (message.event === 'delta') {
        const data = message.data as { delta?: string }
        yield {
          delta: data.delta ?? '',
          done: false,
        }
        continue
      }

      if (message.event === 'report') {
        yield {
          delta: '',
          done: false,
          report: message.data as GeneratedReport,
        }
        continue
      }

      if (message.event === 'error') {
        const data = message.data as { message?: string }
        throw new Error(data.message ?? '流式生成失败')
      }

      if (message.event === 'done') {
        yield {
          delta: '',
          done: true,
        }
      }
    }

    if (done) {
      break
    }
  }

  const tailMessage = parseSseMessage(buffer)
  if (tailMessage?.event === 'report') {
    yield {
      delta: '',
      done: false,
      report: tailMessage.data as GeneratedReport,
    }
  }
}
