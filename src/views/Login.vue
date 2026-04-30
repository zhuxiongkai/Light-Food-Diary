<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">热量助手</h1>
      <p class="auth-subtitle">登录你的账号</p>

      <van-form @submit="onLogin">
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
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="auth-actions">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="authStore.loading"
            loading-text="登录中..."
          >
            登录
          </van-button>
          <p class="auth-link">
            还没有账号？<router-link to="/register">立即注册</router-link>
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

async function onLogin() {
  try {
    await authStore.login(username.value, password.value)
    router.replace('/')
  } catch (e: any) {
    showToast(e.message || '登录失败')
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.auth-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 4px;
}

.auth-subtitle {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin: 0 0 24px;
}

.auth-actions {
  margin-top: 24px;
  padding: 0 16px;
}

.auth-link {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-top: 16px;
}

.auth-link a {
  color: #667eea;
  font-weight: 500;
}
</style>
