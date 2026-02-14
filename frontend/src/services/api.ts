import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const SESSION_EXPIRED_MESSAGE_KEY = 'session_expired_message'
const ACCESS_TOKEN_STORAGE_KEY = 'token'
const PROACTIVE_REFRESH_BUFFER_SECONDS = 5 * 60

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RefreshResponse = {
  access_token: string
  expires_in: number
}

let refreshPromise: Promise<string | null> | null = null
let proactiveRefreshTimeoutId: number | null = null

const redirectToLogin = () => {
  sessionStorage.setItem(
    SESSION_EXPIRED_MESSAGE_KEY,
    'Session expired. Please sign in again.',
  )
  window.location.assign('/login')
}

const decodeTokenExp = (token: string): number | null => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload)) as { exp?: number }
    return typeof decoded.exp === 'number' ? decoded.exp : null
  } catch {
    return null
  }
}

const scheduleProactiveRefresh = () => {
  if (proactiveRefreshTimeoutId !== null) {
    window.clearTimeout(proactiveRefreshTimeoutId)
    proactiveRefreshTimeoutId = null
  }

  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  if (!token) return

  const exp = decodeTokenExp(token)
  if (!exp) return

  const refreshAtMs = (exp - PROACTIVE_REFRESH_BUFFER_SECONDS) * 1000
  const delay = refreshAtMs - Date.now()
  if (delay <= 0) {
    void tryRefreshAccessToken()
    return
  }

  proactiveRefreshTimeoutId = window.setTimeout(() => {
    void tryRefreshAccessToken()
  }, delay)
}

const tryRefreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise

  refreshPromise = refreshClient
    .post<RefreshResponse>('/api/v1/auth/refresh')
    .then((response) => {
      const newToken = response.data.access_token
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, newToken)
      scheduleProactiveRefresh()
      return newToken
    })
    .catch(() => {
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
      redirectToLogin()
      return null
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & {
      _retry?: boolean
    }) | null

    const status = error.response?.status as number | undefined
    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    const newToken = await tryRefreshAccessToken()
    if (!newToken) return Promise.reject(error)

    originalRequest.headers = originalRequest.headers ?? {}
    originalRequest.headers.Authorization = `Bearer ${newToken}`
    return api(originalRequest)
  },
)

export const initAuthSessionManagement = () => {
  scheduleProactiveRefresh()
}

export const getSessionExpiredMessage = () =>
  sessionStorage.getItem(SESSION_EXPIRED_MESSAGE_KEY)

export const clearSessionExpiredMessage = () =>
  sessionStorage.removeItem(SESSION_EXPIRED_MESSAGE_KEY)

export default api
