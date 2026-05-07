<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">创建账号</h1>
      <p class="auth-subtitle">注册后开始记录饮食</p>

      <van-form @submit="onRegister">
        <van-cell-group inset>
          <van-field
            v-model="username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请输入用户名' }]"
          />
          <van-field
            v-model="password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码（至少6位）"
            :rules="[
              { required: true, message: '请输入密码' },
              { validator: checkPassword, message: '密码至少6位' }
            ]"
          />
          <van-field
            v-model="email"
            name="email"
            label="邮箱"
            placeholder="选填，填写后需验证"
            :rules="[{ validator: checkEmail, message: '邮箱格式不正确' }]"
          />
          <van-field
            v-if="email.trim()"
            v-model="emailCode"
            name="emailCode"
            label="验证码"
            placeholder="请输入邮箱验证码"
            maxlength="6"
            :rules="[{ validator: checkEmailCode, message: '请输入6位验证码' }]"
          >
            <template #button>
              <van-button
                size="small"
                type="primary"
                native-type="button"
                :disabled="!canSendEmailCode || countdown > 0"
                :loading="sendingCode"
                @click="onSendEmailCode"
              >
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </van-button>
            </template>
          </van-field>
        </van-cell-group>

        <div class="auth-actions">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="authStore.loading"
            loading-text="注册中..."
          >
            注册
          </van-button>
          <p class="auth-link">
            已有账号？<router-link to="/login">去登录</router-link>
          </p>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const email = ref('')
const emailCode = ref('')
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: number | undefined

const canSendEmailCode = computed(() => checkEmail(email.value))

function checkPassword(val: string) {
  return val.length >= 6
}

function checkEmail(val: string) {
  const trimmed = val.trim()
  if (!trimmed) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

function checkEmailCode(val: string) {
  if (!email.value.trim()) return true
  return /^\d{6}$/.test(val.trim())
}

function startCountdown(seconds: number) {
  countdown.value = seconds
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
  }
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && countdownTimer) {
      window.clearInterval(countdownTimer)
      countdownTimer = undefined
    }
  }, 1000)
}

async function onSendEmailCode() {
  if (!checkEmail(email.value)) {
    showToast('邮箱格式不正确')
    return
  }

  sendingCode.value = true
  try {
    await authStore.sendEmailCode(email.value.trim())
    showToast('验证码已发送')
    startCountdown(30)
  } catch (e: any) {
    showToast(e.message || '验证码发送失败')
  } finally {
    sendingCode.value = false
  }
}

async function onRegister() {
  try {
    const trimmedEmail = email.value.trim()
    await authStore.register(
      username.value,
      password.value,
      trimmedEmail || undefined,
      trimmedEmail ? emailCode.value.trim() : undefined
    )
    router.replace('/')
  } catch (e: any) {
    showToast(e.message || '注册失败')
  }
}

onUnmounted(() => {
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 80% 50% at 50% 20%, rgba(45, 106, 79, 0.08), transparent 60%),
    linear-gradient(180deg, var(--bg-warm) 0%, var(--bg) 50%, var(--bg) 100%);
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 360px;
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  padding: 32px 24px;
  box-shadow: var(--shadow-lg);
}

.auth-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px;
}

.auth-subtitle {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px;
}

.auth-actions {
  margin-top: 24px;
  padding: 0 16px;
}

.auth-link {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 16px;
}

.auth-link a {
  color: var(--primary);
  font-weight: 500;
}
</style>
