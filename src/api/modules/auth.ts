import { request } from '../request'
import type { LoginPayload, LoginResult } from '@/types/auth'

export const authApi = {
  login(payload: LoginPayload) {
    return request.post<LoginResult>('/login', payload)
  },
}
