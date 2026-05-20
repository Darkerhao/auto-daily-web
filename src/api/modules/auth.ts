import { request } from '../request'
import type { LoginPayload, LoginResult, RegisterPayload, UserListItem } from '@/types/auth'

export const authApi = {
  login(payload: LoginPayload) {
    return request.post<LoginResult>('/login', payload)
  },
  register(payload: RegisterPayload) {
    return request.post<LoginResult>('/auth/register', payload)
  },
  getUsers() {
    return request.get<UserListItem[]>('/users')
  },
}
