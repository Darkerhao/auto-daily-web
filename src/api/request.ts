import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { createDiscreteApi } from 'naive-ui'
import type { ApiEnvelope } from '@/types/api'
import { pinia } from '@/stores'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const { message } = createDiscreteApi(['message'])

type MockHandler = (config: InternalAxiosRequestConfig) => Promise<ApiEnvelope<unknown>>

const mockHandlers = new Map<string, MockHandler>()

function toKey(method: string, url: string) {
  return `${method.toUpperCase()} ${url}`
}

function resolveRequestData(config: InternalAxiosRequestConfig): unknown {
  const payload = config.data
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload) as unknown
    } catch {
      return payload
    }
  }

  return payload
}

export function registerMock(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  handler: MockHandler,
) {
  mockHandlers.set(toKey(method, url), handler)
}

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

service.interceptors.request.use(async (config) => {
  const appStore = useAppStore(pinia)
  const authStore = useAuthStore(pinia)
  appStore.beginRequest()

  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }

  const key = toKey(config.method ?? 'GET', config.url ?? '')
  const handler = mockHandlers.get(key)

  if (handler) {
    const envelope = await handler(config)
    config.adapter = async () => ({
      data: envelope,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })
  }

  return config
})

service.interceptors.response.use(
  (response) => {
    const appStore = useAppStore(pinia)
    appStore.endRequest()
    return response
  },
  (error: Error) => {
    const appStore = useAppStore(pinia)
    appStore.endRequest()
    message.error(error.message || '请求失败，请稍后重试')
    return Promise.reject(error)
  },
)

function unwrapResponse<T>(promise: Promise<AxiosResponse<ApiEnvelope<T>>>) {
  return promise.then((response) => {
    const envelope = response.data
    if (envelope.code !== 0) {
      message.error(envelope.message)
      return Promise.reject(new Error(envelope.message))
    }

    return envelope.data
  })
}

export function getRequestPayload<T>(config: InternalAxiosRequestConfig) {
  return resolveRequestData(config) as T
}

export const request = {
  get<T>(url: string, config?: AxiosRequestConfig) {
    return unwrapResponse<T>(service.get<ApiEnvelope<T>>(url, config))
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return unwrapResponse<T>(service.post<ApiEnvelope<T>>(url, data, config))
  },
  delete<T>(url: string, config?: AxiosRequestConfig) {
    return unwrapResponse<T>(service.delete<ApiEnvelope<T>>(url, config))
  },
}
