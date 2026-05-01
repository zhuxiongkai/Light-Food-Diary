<template>
  <div class="page settings-page">
    <header class="page-header settings-header">
      <h1 class="page-title">我的</h1>
    </header>

    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-large">
          <span>{{ profileName.slice(0, 1) }}</span>
        </div>
        <div class="profile-info">
          <h2 class="profile-name">{{ profileName }}</h2>
          <p class="profile-id">ID: {{ profileId }}</p>
          <p class="profile-streak">已记录 {{ recordDays }} 天</p>
        </div>
      </div>

      <div class="weight-progress">
        <div class="progress-label">
          <span>体重目标进度</span>
          <span class="progress-value">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-info">
          <span>当前体重</span>
          <span class="highlight">{{ currentWeight }} 公斤</span>
          <span class="divider">|</span>
          <span>目标体重</span>
          <span class="highlight">{{ targetWeight }} 公斤</span>
        </div>
      </div>
    </div>

    <section class="settings-section">
      <h3 class="section-title">健康目标</h3>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="fire-o" />
          <span>每日热量目标</span>
        </div>
        <div class="item-value">{{ Number(form.dailyCalorieGoal).toLocaleString() }} 千卡</div>
      </div>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="balance-o" />
          <span>体重目标</span>
        </div>
        <div class="item-value">{{ targetWeight }} 公斤</div>
      </div>
      <div class="settings-item">
        <div class="item-label">
          <van-icon name="chart-trending-o" />
          <span>营养比例</span>
        </div>
        <div class="item-value">{{ macroSummary }}</div>
      </div>
    </section>

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
import { reactive, onMounted, computed, ref } from 'vue'
import type { MealRecord } from '@/types'
import { useRouter } from 'vue-router'
import { Button, showConfirmDialog, Icon } from 'vant'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMealStore } from '@/stores/mealStore'
import { useWeightStore } from '@/stores/weightStore'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const settingsStore = useSettingsStore()
const mealStore = useMealStore()
const weightStore = useWeightStore()
const authStore = useAuthStore()

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
const fetchedMeals = ref<MealRecord[]>([])
const recordDays = computed(() => {
  const dates = new Set<string>()
  // weight records
  for (const r of weightStore.records) {
    if (r && r.date) dates.add(r.date)
  }
  // fetched meal records (history)
  for (const m of fetchedMeals.value) {
    if (m && m.date) dates.add(m.date)
  }
  // also include currently loaded meals (today)
  for (const m of mealStore.meals) {
    if (m && m.date) dates.add(m.date)
  }
  return dates.size
})
const currentWeight = computed(() => Number(form.weight).toFixed(1))
const targetWeight = computed(() => Number(form.weightGoal).toFixed(1))
const progressPercent = computed(() => {
  const base = Math.max(Number(form.weightGoal), 1)
  const diff = Math.abs(Number(form.weight) - Number(form.weightGoal))
  return Math.max(0, Math.min(100, Math.round((1 - diff / base) * 100)))
})
const macroSummary = computed(
  () => `碳水 ${form.carbsRatio}% · 蛋白质 ${form.proteinRatio}% · 脂肪 ${form.fatRatio}%`
)

onMounted(async () => {
  await Promise.all([
    settingsStore.loadSettings(),
    mealStore.loadMeals().catch(() => undefined),
    weightStore.loadRecords().catch(() => undefined),
    // fetch past year meals to compute recorded days
    (async () => {
      try {
        const now = new Date()
        const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const past = new Date()
        past.setDate(now.getDate() - 365)
        const start = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`
        const data = await mealStore.getMealsByDateRange(start, end)
        fetchedMeals.value = data
      } catch {
        fetchedMeals.value = []
      }
    })(),
    authStore.fetchMe().catch(() => undefined)
  ])
  Object.assign(form, settingsStore.settings)
})

async function onLogout() {
  try {
    await showConfirmDialog({ title: '确认', message: '确定要登出账号吗？' })
    authStore.logout()
    router.replace('/login')
  } catch {
    // cancelled
  }
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
}

.static-item {
  margin-bottom: 0;
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
  text-align: right;
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
