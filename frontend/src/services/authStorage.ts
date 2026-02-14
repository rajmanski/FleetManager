const ACCESS_TOKEN_STORAGE_KEY = 'token'

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

export const clearAccessToken = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
  }
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
  }
}
