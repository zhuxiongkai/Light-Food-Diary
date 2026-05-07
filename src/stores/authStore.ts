import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, setAuth, clearAuth, isAuthenticated } from '@/api/client'

interface User {
  id: number
  username: string
  email: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const loggedIn = computed(() => !!user.value)

  async function init() {
    if (initialized.value) return
    initialized.value = true

    if (isAuthenticated()) {
      try {
        const res = await api<User>('/auth/me')
        user.value = res.data
      } catch {
        clearAuth()
      }
    }
  }

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const res = await api<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        }
      )
      setAuth(res.data.accessToken, res.data.refreshToken)
      user.value = res.data.user
    } finally {
      loading.value = false
    }
  }

  async function sendEmailCode(email: string) {
    await api<{ email: string; expiresIn: number }>('/auth/send-email-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async function register(username: string, password: string, email?: string, emailCode?: string) {
    loading.value = true
    try {
      const res = await api<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ username, password, email, emailCode }),
        }
      )
      setAuth(res.data.accessToken, res.data.refreshToken)
      user.value = res.data.user
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearAuth()
    user.value = null
  }

  async function fetchMe() {
    const res = await api<User>('/auth/me')
    user.value = res.data
  }

  return { user, loading, loggedIn, initialized, init, login, register, sendEmailCode, logout, fetchMe }
})
