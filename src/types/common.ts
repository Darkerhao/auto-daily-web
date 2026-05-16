export type ThemeMode = 'dark' | 'light'
export type WorkspaceEnvironment = 'demo' | 'staging' | 'production'

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface NavItem {
  key: string
  label: string
  path: string
}

export interface StatusOption {
  label: string
  value: string
}

export interface WorkspaceProfile {
  workspaceName: string
  teamName: string
  environment: WorkspaceEnvironment
}
