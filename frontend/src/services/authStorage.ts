const ACCESS_TOKEN_STORAGE_KEY = 'token'
const LOGOUT_BROADCAST_KEY = 'logout_broadcast'

const getPrimaryStorage = (): Storage | null => {
  try {
    localStorage.setItem('__storage_probe__', 'ok')
    localStorage.removeItem('__storage_probe__')
    return localStorage
  } catch {
    try {
      sessionStorage.setItem('__storage_probe__', 'ok')
      sessionStorage.removeItem('__storage_probe__')
      return sessionStorage
    } catch {
      return null
    }
  }
}

export const getAccessToken = (): string | null => {
  const storage = getPrimaryStorage()
  if (!storage) return null
  return storage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}

export const saveAccessToken = (token: string): boolean => {
  const storage = getPrimaryStorage()
  if (!storage) return false

  try {
    storage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
    return true
  } catch {
    return false
  }
}

export const getStoredRole = (): string | null => {
  const token = getAccessToken()
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload)) as { role?: string }
    return typeof decoded.role === 'string' ? decoded.role : null
  } catch {
    return null
  }
}

export const clearAccessToken = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export const broadcastLogout = () => {
  try {
    localStorage.setItem(LOGOUT_BROADCAST_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export const subscribeToLogout = (onLogout: () => void) => {
  const handler = (event: StorageEvent) => {
    if (event.key === LOGOUT_BROADCAST_KEY) {
      onLogout()
    }
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
