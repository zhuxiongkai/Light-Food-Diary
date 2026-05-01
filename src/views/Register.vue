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
            placeholder="选填"
          />
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const email = ref('')

function checkPassword(val: string) {
  return val.length >= 6
}

async function onRegister() {
  try {
    await authStore.register(username.value, password.value, email.value || undefined)
    router.replace('/')
  } catch (e: any) {
    showToast(e.message || '注册失败')
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 80% 50% at 50% 20%, rgba(45, 106, 79, 0.08), transparent 60%),
    linear-gradient(180deg, #f7f3ed 0%, var(--bg) 50%, #f0ede6 100%);
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
