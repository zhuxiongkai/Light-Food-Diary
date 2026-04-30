const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

interface ApiRequestInit extends RequestInit {
  timeoutMs?: number
}

function getTokens() {
  const accessToken = localStorage.getItem('access_token')
  const refreshToken = localStorage.getItem('refresh_token')
  return { accessToken, refreshToken }
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
}

function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = getTokens()
  if (!refreshToken) throw new Error('No refresh token')

  const res = await fetchWithTimeout(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    timeoutMs: 10000,
  } as ApiRequestInit)

  const json: ApiResponse = await res.json()
  if (json.code !== 0) throw new Error(json.message)

  setTokens(json.data.accessToken, json.data.refreshToken)
  return json.data.accessToken
}

async function getFreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

function buildHeaders(options: RequestInit, token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

async function fetchWithTimeout(url: string, options: ApiRequestInit = {}) {
  const { timeoutMs = 15000, ...rest } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...rest, signal: controller.signal })
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试')
    }
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}

export async function api<T = any>(
  path: string,
  options: ApiRequestInit = {}
): Promise<ApiResponse<T>> {
  const { accessToken } = getTokens()
  let headers = buildHeaders(options, accessToken || undefined)
  let res = await fetchWithTimeout(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401 && !path.includes('/auth/')) {
    try {
      if (!isRefreshing) {
        isRefreshing = true
      }
      const newToken = await getFreshAccessToken()
      headers = buildHeaders(options, newToken)
      res = await fetchWithTimeout(`${BASE_URL}${path}`, { ...options, headers })

      if (res.status === 401) {
        clearTokens()
        throw new Error('登录已过期，请重新登录')
      }
    } catch (err: any) {
      clearTokens()
      throw new Error(err?.message || '登录已过期，请重新登录')
    } finally {
      isRefreshing = false
    }
  }

  let json: ApiResponse<T>
  try {
    json = await res.json()
  } catch {
    throw new Error('服务器返回格式异常')
  }
  if (json.code !== 0) {
    throw new Error(json.message)
  }

  return json
}

// Auth helpers
export function setAuth(accessToken: string, refreshToken: string) {
  setTokens(accessToken, refreshToken)
}

export function clearAuth() {
  clearTokens()
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token')
}
