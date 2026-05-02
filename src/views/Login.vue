<template>
  <div class="login-page">
    <div class="top-decoration" aria-hidden="true"></div>
    <div class="bottom-decoration" aria-hidden="true"></div>

    <div class="welcome-block">
      <img src="/app-logo.png" alt="轻卡记" class="app-logo" />
      <p class="brand-name">轻卡记</p>
      <h1 class="welcome-title">欢迎回来</h1>
      <p class="welcome-subtitle">记录每日热量，轻松管理饮食与健康</p>
    </div>

    <div class="login-card">
      <van-form @submit="onLogin">
        <div class="field-panel">
          <van-field
            v-model="username"
            name="username"
            left-icon="contact-o"
            placeholder="手机号 / 邮箱"
            :rules="[{ required: true, message: '请输入手机号或邮箱' }]"
          />
          <van-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            left-icon="shield-o"
            :right-icon="showPassword ? 'eye-o' : 'closed-eye'"
            placeholder="密码"
            :rules="[{ required: true, message: '请输入密码' }]"
            @click-right-icon="showPassword = !showPassword"
          />
        </div>

        <button type="button" class="forgot-password" disabled>
          忘记密码（暂不可用）
        </button>

        <div class="auth-actions">
          <van-button
            block
            type="primary"
            native-type="submit"
            :loading="authStore.loading"
            loading-text="登录中..."
            class="login-btn"
          >
            登录
          </van-button>
          <van-button block type="default" to="/register" class="register-btn">
            注册新账号
          </van-button>
        </div>
      </van-form>
    </div>

    <div class="other-login-block">
      <div class="divider">或使用以下方式登录</div>
      <div class="other-login">
        <button type="button" class="login-option" disabled>
          <van-icon name="comment-o" />
          <span>验证码登录（规划中）</span>
        </button>
        <button type="button" class="login-option" @click="onGuestExperience">
          <van-icon name="user-o" />
          <span>游客体验</span>
        </button>
      </div>
    </div>

    <label class="agreement">
      <van-checkbox v-model="agreeTerms" icon-size="20" checked-color="var(--primary)" />
      <span>我已阅读并同意</span>
      <button type="button" class="agreement-link" @click="showLegal('terms')">《用户协议》</button>
      <span>和</span>
      <button type="button" class="agreement-link" @click="showLegal('privacy')">《隐私政策》</button>
    </label>

    <p class="bottom-slogan">开启你的轻盈生活</p>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showDialog, showToast } from 'vant'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const agreeTerms = ref(false)
const showPassword = ref(false)

async function onLogin() {
  if (!agreeTerms.value) {
    showToast('请同意用户协议和隐私政策')
    return
  }
  try {
    await authStore.login(username.value, password.value)
    router.replace('/')
  } catch (e: any) {
    showToast(e.message || '登录失败')
  }
}

function onGuestExperience() {
  router.replace('/guest')
}

function showLegal(type: 'terms' | 'privacy') {
  showDialog({
    title: type === 'terms' ? '用户协议' : '隐私政策',
    message: type === 'terms'
      ? '使用轻卡记代表你同意以真实、合法的方式记录个人饮食与健康数据。本应用仅用于日常健康管理参考，不替代专业医疗建议。'
      : '轻卡记会保存你的账号、饮食、体重与目标设置，用于提供热量记录、统计和同步服务。我们不会在未获授权的情况下向第三方出售你的个人数据。',
    confirmButtonText: '知道了'
  })
}
</script>

<style scoped>
.login-page {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  padding: calc(env(safe-area-inset-top, 0px) + 20px) 24px
    calc(env(safe-area-inset-bottom, 0px) + 20px);
  background:
    radial-gradient(145% 88% at 100% 0%, rgba(45, 106, 79, 0.1) 0%, rgba(45, 106, 79, 0.02) 34%, rgba(45, 106, 79, 0) 62%),
    linear-gradient(180deg, var(--bg) 0%, var(--bg-warm) 56%, var(--bg) 100%);
}

.top-decoration {
  position: absolute;
  right: -56px;
  top: 126px;
  width: 218px;
  height: 218px;
  border-radius: 50%;
  border: 18px solid rgba(45, 106, 79, 0.08);
  clip-path: inset(0 0 22% 0);
}

.bottom-decoration {
  position: absolute;
  left: -22px;
  right: -22px;
  bottom: -12px;
  height: 132px;
  background:
    radial-gradient(30px 56px at 22% 78%, rgba(45, 106, 79, 0.15) 0, rgba(45, 106, 79, 0) 95%),
    radial-gradient(34px 66px at 78% 78%, rgba(45, 106, 79, 0.15) 0, rgba(45, 106, 79, 0) 92%),
    linear-gradient(180deg, rgba(216, 243, 220, 0) 0%, rgba(216, 243, 220, 0.5) 68%, rgba(200, 235, 208, 0.7) 100%);
  pointer-events: none;
}

.welcome-block {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 560px;
}

.app-logo {
  width: 86px;
  height: 86px;
  margin-bottom: 10px;
  border-radius: 24px;
  box-shadow: 0 8px 24px rgba(45, 106, 79, 0.12);
}

.brand-name {
  font-size: 34px;
  line-height: 1;
  font-weight: 500;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text-strong);
  margin: 0 0 10px;
}

.welcome-title {
  font-size: 30px;
  line-height: 1.08;
  letter-spacing: 0;
  font-weight: 600;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text-strong);
  margin-top: 10px;
}

.welcome-subtitle {
  margin: 10px 0 20px;
  color: var(--text-soft);
  font-size: 18px;
  line-height: 1.44;
}

.login-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 560px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 18px 16px 16px;
  box-shadow: 0 14px 38px rgba(69, 89, 118, 0.09);
  backdrop-filter: blur(10px);
}

.field-panel {
  background: rgba(244, 247, 250, 0.92);
  border-radius: 16px;
  overflow: hidden;
}

.field-panel :deep(.van-field) {
  background: transparent;
  padding: 14px 14px;
  min-height: 58px;
  --van-cell-horizontal-padding: 0;
  --van-cell-background: transparent;
  --van-cell-text-color: var(--text-soft);
  --van-field-placeholder-text-color: var(--text-secondary);
  --van-cell-font-size: 16px;
}

.field-panel :deep(.van-cell::after) {
  border-bottom-color: rgba(161, 174, 192, 0.35);
  left: 14px;
  right: 14px;
}

.field-panel :deep(.van-field__left-icon),
.field-panel :deep(.van-field__right-icon) {
  color: var(--primary);
  font-size: 22px;
  margin-right: 10px;
}

.field-panel :deep(.van-field__right-icon) {
  color: var(--text-secondary);
  margin-right: 0;
}

.forgot-password {
  display: block;
  width: fit-content;
  margin: 12px 0 18px auto;
  border: none;
  background: transparent;
  color: var(--primary);
  font-size: 14px;
  line-height: 1.2;
  padding: 0;
}

.forgot-password:disabled {
  color: var(--text-secondary);
}

.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-btn {
  height: 50px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  --van-button-primary-background: linear-gradient(90deg, var(--primary) 0%, var(--primary-strong) 100%);
  --van-button-primary-border-color: transparent;
}

.register-btn {
  height: 50px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--primary);
  border-color: rgba(19, 178, 106, 0.86);
  background: var(--card-bg);
}

.other-login-block {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 560px;
  margin-top: 4px;
}

.divider {
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 12px;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 31%;
  height: 1px;
  background: rgba(143, 158, 176, 0.45);
}

.divider::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 31%;
  height: 1px;
  background: rgba(143, 158, 176, 0.45);
}

.other-login {
  display: flex;
  gap: 12px;
}

.login-option {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  min-height: 60px;
  border: 0;
  border-radius: 12px;
  background: var(--card-bg);
  box-shadow: 0 7px 18px rgba(72, 93, 122, 0.08);
  color: var(--text);
  font-size: 15px;
  white-space: nowrap;
}

.login-option:disabled {
  color: var(--text-secondary);
  background: rgba(245, 247, 250, 0.88);
  box-shadow: none;
}

.login-option:active {
  opacity: 0.82;
}

.login-option :deep(.van-icon) {
  color: var(--primary);
  font-size: 20px;
}

.agreement {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.agreement-link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--primary);
  font-weight: 500;
  text-decoration: none;
  font-size: inherit;
}

.agreement :deep(.van-checkbox__icon .van-badge__wrapper) {
  border: 1px solid var(--primary);
}

.agreement :deep(.van-checkbox) {
  flex-shrink: 0;
}

.bottom-slogan {
  position: relative;
  z-index: 2;
  margin-top: 8px;
  text-align: center;
  color: rgba(45, 106, 79, 0.55);
  font-size: 16px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  line-height: 1.2;
}

@media (max-width: 420px) {
  .login-page {
    padding-left: 16px;
    padding-right: 16px;
    gap: 10px;
  }

  .brand-name {
    font-size: 30px;
    margin-bottom: 8px;
  }

  .welcome-title {
    font-size: 36px;
  }

  .welcome-subtitle {
    margin-top: 10px;
    margin-bottom: 16px;
    font-size: 15px;
  }

  .other-login {
    flex-direction: column;
  }

  .login-option {
    width: 100%;
    white-space: normal;
  }

  .bottom-slogan {
    font-size: 14px;
  }
}
</style>
