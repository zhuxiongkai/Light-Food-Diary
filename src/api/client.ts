const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
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
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = []

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = getTokens()
  if (!refreshToken) throw new Error('No refresh token')

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const json: ApiResponse = await res.json()
  if (json.code !== 0) throw new Error(json.message)

  setTokens(json.data.accessToken, json.data.refreshToken)
  return json.data.accessToken
}

export async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const { accessToken } = getTokens()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // Handle 401 - try to refresh token
  if (res.status === 401 && !path.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const newToken = await refreshAccessToken()
        // Retry original request
        headers['Authorization'] = `Bearer ${newToken}`
        res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
        // Resolve queued requests
        for (const q of refreshQueue) q.resolve(newToken)
        refreshQueue = []
      } catch (err) {
        clearTokens()
        for (const q of refreshQueue) q.reject(err)
        refreshQueue = []
        throw err
      } finally {
        isRefreshing = false
      }
    } else {
      // Wait for the in-progress refresh
      const newToken = await new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      })
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    }
  }

  const json: ApiResponse<T> = await res.json()
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
