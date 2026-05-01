<template>
  <div class="page settings-page">
    <header class="page-header settings-header">
      <h1 class="page-title">我的</h1>
      <button class="header-action" type="button">
        <van-icon name="setting-o" />
      </button>
      <button class="header-action" type="button">
        <van-icon name="comment-o" />
        <span class="badge"></span>
      </button>
    </header>

    <!-- Profile Card -->
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-large">
          <span>{{ profileName.slice(0, 1) }}</span>
        </div>
        <div class="profile-info">
          <h2 class="profile-name">{{ profileName }}</h2>
          <p class="profile-id">ID: {{ profileId }}</p>
          <p class="profile-streak">✅ 已记录 {{ recordDays }} 天</p>
        </div>
        <button class="edit-btn">
          <van-icon name="edit" />
        </button>
      </div>

      <div class="weight-progress">
        <div class="progress-label">
          <span>减脂计划进度</span>
          <span class="progress-value">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-info">
          <span>当前体重</span>
          <span class="highlight">{{ currentWeight }} 公斤</span>
          <span class="divider">|</span>
          <span>距离目标</span>
          <span class="highlight">{{ weightDiff }} 公斤</span>
        </div>
      </div>
    </div>

    <!-- Health Goals -->
    <section class="settings-section">
      <h3 class="section-title">健康目标</h3>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="fire-o" />
          <span>每日热量目标</span>
        </div>
        <div class="item-value">{{ Number(form.dailyCalorieGoal).toLocaleString() }} 千卡 →</div>
      </div>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="balance-o" />
          <span>体重目标</span>
        </div>
        <div class="item-value">{{ targetWeight }} 公斤 →</div>
      </div>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="chart-trending-o" />
          <span>营养比例</span>
        </div>
        <div class="item-value">{{ macroSummary }} →</div>
      </div>
    </section>

    <!-- My Data -->
    <section class="settings-section">
      <h3 class="section-title">我的数据</h3>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="user-o" />
          <span>身体数据</span>
        </div>
        <div class="item-value">→</div>
      </div>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="notes-o" />
          <span>饮水记录</span>
        </div>
        <div class="item-value">→</div>
      </div>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="service-o" />
          <span>运动记录</span>
        </div>
        <div class="item-value">→</div>
      </div>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="description-o" />
          <span>历史报告</span>
        </div>
        <div class="item-value">→</div>
      </div>
    </section>

    <!-- Reminders & Sync -->
    <section class="settings-section">
      <h3 class="section-title">提醒与同步</h3>
      <div class="settings-item with-toggle">
        <div class="item-label">
          <van-icon name="clock-o" />
          <span>用餐提醒</span>
        </div>
        <span class="reminder-time">07:30, 12:30, 18:30</span>
        <van-switch v-model="reminders.mealReminder" size="24" />
      </div>
      <div class="settings-item with-toggle">
        <div class="item-label">
          <van-icon name="calendar-o" />
          <span>体重提醒</span>
        </div>
        <span class="reminder-time">每周一 08:00</span>
        <van-switch v-model="reminders.weightReminder" size="24" />
      </div>
      <div class="settings-item with-toggle">
        <div class="item-label">
          <van-icon name="like-o" />
          <span>Apple 健康同步</span>
        </div>
        <van-switch v-model="reminders.appleHealthSync" size="24" />
      </div>
    </section>

    <!-- General Settings -->
    <section class="settings-section">
      <h3 class="section-title">通用设置</h3>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="desktop-o" />
          <span>深色模式</span>
        </div>
        <div class="item-value">跟随系统</div>
      </div>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="volume-o" />
          <span>通知设置</span>
        </div>
        <div class="item-value">→</div>
      </div>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="shield-o" />
          <span>隐私与安全</span>
        </div>
        <div class="item-value">→</div>
      </div>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="question-o" />
          <span>帮助与反馈</span>
        </div>
        <div class="item-value">→</div>
      </div>
    </section>

    <!-- VIP Benefits -->
    <section class="vip-section">
      <div class="vip-banner">
        <div class="vip-icon">👑</div>
        <div class="vip-content">
          <h3>会员权益</h3>
          <p>解锁更多数据分析与专享功能</p>
        </div>
        <span class="vip-arrow">→</span>
      </div>
    </section>

    <!-- Logout Button -->
    <section class="settings-section logout-section">
      <van-button
        round
        block
        type="danger"
        @click="onLogout"
        class="logout-btn"
      >
        登出账号
      </van-button>
    </section>

    <div style="height: 30px"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Field, Button, Popup, Picker, Switch, showConfirmDialog, showToast, Icon } from 'vant'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMealStore } from '@/stores/mealStore'
import { useWeightStore } from '@/stores/weightStore'
import { useAuthStore } from '@/stores/authStore'
import { exportToJSON, exportToCSV } from '@/utils/exportService'

const router = useRouter()
const settingsStore = useSettingsStore()
const mealStore = useMealStore()
const weightStore = useWeightStore()
const authStore = useAuthStore()

const showGenderPicker = ref(false)
const genderOptions = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' }
]
const apiKeyInput = ref('')

const reminders = reactive({
  mealReminder: true,
  weightReminder: true,
  appleHealthSync: true
})

const form = reactive({
  dailyCalorieGoal: 2000,
  proteinRatio: 20,
  fatRatio: 25,
  carbsRatio: 55,
  height: 170,
  weight: 65,
  age: 25,
  gender: 'male' as string,
  weightGoal: 60
})

const profileName = computed(() => authStore.user?.username || '用户')
const profileId = computed(() => authStore.user?.id ?? '----')
const recordDays = computed(() => Math.max(weightStore.records.length, mealStore.meals.length, 0))
const currentWeight = computed(() => Number(form.weight).toFixed(1))
const targetWeight = computed(() => Number(form.weightGoal).toFixed(1))
const weightDiff = computed(() => Math.abs(Number(form.weight) - Number(form.weightGoal)).toFixed(1))
const progressPercent = computed(() => {
  const diff = Math.abs(Number(form.weight) - Number(form.weightGoal))
  return Math.max(0, Math.min(100, Math.round(100 - diff * 10)))
})
const macroSummary = computed(
  () => `碳水 ${form.carbsRatio}% · 蛋白质 ${form.proteinRatio}% · 脂肪 ${form.fatRatio}%`
)

onMounted(async () => {
  await Promise.all([
    settingsStore.loadSettings(),
    mealStore.loadMeals().catch(() => undefined),
    weightStore.loadRecords().catch(() => undefined),
    authStore.fetchMe().catch(() => undefined)
  ])
  const s = settingsStore.settings
  Object.assign(form, s)
  apiKeyInput.value = settingsStore.apiKey
})

async function saveGoals() {
  await settingsStore.saveSettings({
    dailyCalorieGoal: +form.dailyCalorieGoal,
    proteinRatio: +form.proteinRatio,
    fatRatio: +form.fatRatio,
    carbsRatio: +form.carbsRatio
  })
  showToast('已保存')
}

async function saveProfile() {
  await settingsStore.saveSettings({
    height: +form.height,
    weight: +form.weight,
    age: +form.age,
    gender: form.gender as 'male' | 'female',
    weightGoal: +form.weightGoal
  })
  showToast('已保存')
}

async function saveApiKey() {
  await settingsStore.setApiKey(apiKeyInput.value)
  showToast('API Key 已保存')
}

function onGenderConfirm({ selectedOptions }: any) {
  form.gender = selectedOptions[0].value
  showGenderPicker.value = false
}

async function onExportJSON() {
  // Load all meals and weights via API for the past year
  const end = new Date().toISOString().slice(0, 10)
  const start = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)
  const [meals, weights] = await Promise.all([
    mealStore.getMealsByDateRange(start, end),
    weightStore.getRecordsByDateRange(start, end),
  ])
  exportToJSON(meals, weights)
  showToast('导出成功')
}

async function onExportCSV() {
  const end = new Date().toISOString().slice(0, 10)
  const start = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)
  const meals = await mealStore.getMealsByDateRange(start, end)
  exportToCSV(meals)
  showToast('导出成功')
}

async function onClearData() {
  // Clear all data is handled per-record deletion from the API
  // For simplicity, we delegate to the meal and weight stores
  try {
    await showConfirmDialog({ title: '确认', message: '这将删除所有记录数据，不可恢复！' })
    const end = new Date().toISOString().slice(0, 10)
    const start = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)
    const meals = await mealStore.getMealsByDateRange(start, end)
    const weights = await weightStore.getRecordsByDateRange(start, end)
    for (const m of meals) {
      if (m.id) await mealStore.deleteMeal(m.id)
    }
    for (const w of weights) {
      if (w.id) await weightStore.deleteRecord(w.id)
    }
    showToast('已清除')
  } catch { /* cancelled */ }
}

async function onLogout() {
  try {
    await showConfirmDialog({ title: '确认', message: '确定要登出账号吗？' })
    authStore.logout()
    router.replace('/login')
  } catch { /* cancelled */ }
}
</script>

<style scoped>
.settings-page {
  padding: 54px 16px calc(92px + var(--safe-bottom));
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  padding: 0;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  flex: 1;
}

.header-action {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--card-bg);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.header-action:active {
  background: var(--bg);
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  background: var(--danger);
  border-radius: 50%;
}

.profile-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(132, 149, 171, 0.08);
}

.avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(45, 106, 79, 0.22);
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 4px 0;
}

.profile-id,
.profile-streak {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 2px 0;
}

.profile-streak {
  color: var(--primary);
  font-weight: 600;
}

.edit-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--primary-soft);
  border: none;
  color: var(--primary);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.edit-btn:active {
  background: #c8e8d0;
}

.weight-progress {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text);
  font-weight: 600;
}

.progress-value {
  color: var(--primary);
}

.progress-bar {
  height: 5px;
  background: rgba(156, 142, 132, 0.12);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, #4a9d76 100%);
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-info .highlight {
  color: var(--text);
  font-weight: 700;
}

.divider {
  color: rgba(132, 149, 171, 0.3);
  margin: 0 4px;
}

.settings-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
  padding: 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-item:active {
  background: var(--bg);
}

.settings-item.with-toggle {
  background: var(--card-bg);
  padding: 12px 16px;
  display: flex;
  align-items: center;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
}

.item-label .van-icon {
  font-size: 18px;
  color: var(--primary);
  flex-shrink: 0;
}

.item-value {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.reminder-time {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
  margin-right: 12px;
}

.vip-section {
  margin-bottom: 24px;
}

.vip-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #2d2d1a 0%, #3d3520 100%);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.vip-banner:active {
  transform: scale(0.98);
}

.vip-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.vip-content {
  flex: 1;
}

.vip-content h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
  color: #f0d78c;
}

.vip-content p {
  margin: 0;
  font-size: 12px;
  color: rgba(240, 215, 140, 0.65);
}

.vip-arrow {
  font-size: 20px;
  color: #f0d78c;
  flex-shrink: 0;
}

.logout-section {
  padding: 16px;
  margin-bottom: 24px;
}

.logout-btn {
  --van-button-danger-background: #ef4444;
  --van-button-danger-border-color: #ef4444;
  font-weight: 500;
  font-size: 16px;
}
</style>
