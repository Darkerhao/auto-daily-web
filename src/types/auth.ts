export type AppPermission =
  | 'dashboard:view'
  | 'repository:manage'
  | 'report:generate'
  | 'feishu:manage'
  | 'settings:manage'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  role: 'admin' | 'developer'
  company: string
  permissions: AppPermission[]
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResult {
  token: string
  user: UserProfile
}
