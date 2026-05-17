export const storageKeys = {
  theme: 'jiazi-theme',
  token: 'jiazi-token',
  user: 'jiazi-user',
  sidebarCollapsed: 'jiazi-sidebar-collapsed',
  workspaceProfile: 'jiazi-workspace-profile',
  reportPreferences: 'jiazi-report-preferences',
  reportStreamPanel: 'jiazi-report-stream-panel',
} as const

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorage(key: string) {
  localStorage.removeItem(key)
}
