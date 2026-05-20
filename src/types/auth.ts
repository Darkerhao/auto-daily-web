export type AppPermission =
  | 'dashboard:view'
  | 'repository:manage'
  | 'report:generate'
  | 'feishu:manage'
  | 'settings:manage'
  | 'user:manage'

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

export interface RegisterPayload {
  name: string
  email: string
  password: string
  company: string
  gitUsername: string
}

export interface UserListItem extends UserProfile {
  gitUsername: string
  createdAt: string
  lastLoginAt: string
}
