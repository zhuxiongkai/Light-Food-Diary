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
      <button class="settings-item" type="button" @click="openEdit('calorie')">
        <div class="item-label">
          <van-icon name="fire-o" />
          <span>每日热量目标</span>
        </div>
        <div class="item-value">{{ Number(form.dailyCalorieGoal).toLocaleString() }} 千卡</div>
        <van-icon name="arrow" class="item-arrow" />
      </button>
      <button class="settings-item" type="button" @click="openEdit('weight')">
        <div class="item-label">
          <van-icon name="balance-o" />
          <span>体重目标</span>
        </div>
        <div class="item-value">{{ targetWeight }} 公斤</div>
        <van-icon name="arrow" class="item-arrow" />
      </button>
      <button class="settings-item" type="button" @click="openEdit('macro')">
        <div class="item-label">
          <van-icon name="chart-trending-o" />
          <span>营养比例</span>
        </div>
        <div class="item-value">{{ macroSummary }}</div>
        <van-icon name="arrow" class="item-arrow" />
      </button>
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

    <van-popup v-model:show="showEdit" position="bottom" round @closed="clearEditQuery">
      <div class="edit-popup">
        <h3>{{ editTitle }}</h3>

        <template v-if="editSection === 'calorie'">
          <van-field
            v-model="editForm.dailyCalorieGoal"
            type="number"
            label="每日目标"
            placeholder="请输入每日热量目标"
            input-align="right"
          >
            <template #extra>千卡</template>
          </van-field>
        </template>

        <template v-else-if="editSection === 'weight'">
          <van-field
            v-model="editForm.weightGoal"
            type="number"
            label="目标体重"
            placeholder="请输入目标体重"
            input-align="right"
          >
            <template #extra>公斤</template>
          </van-field>
        </template>

        <template v-else-if="editSection === 'macro'">
          <van-field v-model="editForm.carbsRatio" type="number" label="碳水" input-align="right">
            <template #extra>%</template>
          </van-field>
          <van-field v-model="editForm.proteinRatio" type="number" label="蛋白质" input-align="right">
            <template #extra>%</template>
          </van-field>
          <van-field v-model="editForm.fatRatio" type="number" label="脂肪" input-align="right">
            <template #extra>%</template>
          </van-field>
          <p class="macro-total" :class="{ invalid: macroTotal !== 100 }">当前合计 {{ macroTotal }}%</p>
        </template>

        <div class="edit-actions">
          <van-button block plain @click="closeEdit">取消</van-button>
          <van-button block type="primary" :loading="savingEdit" @click="saveEdit">保存</van-button>
        </div>
      </div>
    </van-popup>

    <div style="height: 30px"></div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed, ref, watch } from 'vue'
import type { MealRecord, UserSettings } from '@/types'
import { useRoute, useRouter } from 'vue-router'
import { Button, Field, Icon, Popup, showConfirmDialog, showToast } from 'vant'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMealStore } from '@/stores/mealStore'
import { useWeightStore } from '@/stores/weightStore'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
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

type EditSection = 'calorie' | 'weight' | 'macro'

const showEdit = ref(false)
const editSection = ref<EditSection>('calorie')
const savingEdit = ref(false)
const editForm = reactive({
  dailyCalorieGoal: 2000,
  proteinRatio: 20,
  fatRatio: 25,
  carbsRatio: 55,
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
  () => `碳水${form.carbsRatio}%·蛋白质${form.proteinRatio}%·脂肪${form.fatRatio}%`
)
const macroTotal = computed(() =>
  Number(editForm.carbsRatio) + Number(editForm.proteinRatio) + Number(editForm.fatRatio)
)
const editTitle = computed(() => {
  if (editSection.value === 'calorie') return '编辑每日热量目标'
  if (editSection.value === 'weight') return '编辑体重目标'
  return '编辑营养比例'
})

watch(() => route.query.edit, (value) => {
  openEditFromQuery(value)
})

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
  openEditFromQuery(route.query.edit)
})

function openEdit(section: EditSection) {
  editSection.value = section
  editForm.dailyCalorieGoal = Number(form.dailyCalorieGoal)
  editForm.weightGoal = Number(form.weightGoal)
  editForm.proteinRatio = Number(form.proteinRatio)
  editForm.fatRatio = Number(form.fatRatio)
  editForm.carbsRatio = Number(form.carbsRatio)
  showEdit.value = true
}

function openEditFromQuery(value: unknown) {
  if (value === 'calorie' || value === 'weight' || value === 'macro') {
    openEdit(value)
  }
}

function closeEdit() {
  showEdit.value = false
}

function clearEditQuery() {
  if (route.query.edit === undefined) return
  const query = { ...route.query }
  delete query.edit
  router.replace({ query })
}

async function saveEdit() {
  const payload: Partial<UserSettings> = {}

  if (editSection.value === 'calorie') {
    const dailyCalorieGoal = Math.round(Number(editForm.dailyCalorieGoal))
    if (!Number.isFinite(dailyCalorieGoal) || dailyCalorieGoal <= 0) {
      showToast('请输入有效热量目标')
      return
    }
    payload.dailyCalorieGoal = dailyCalorieGoal
  }

  if (editSection.value === 'weight') {
    const weightGoal = Number(editForm.weightGoal)
    if (!Number.isFinite(weightGoal) || weightGoal <= 0) {
      showToast('请输入有效目标体重')
      return
    }
    payload.weightGoal = Math.round(weightGoal * 10) / 10
  }

  if (editSection.value === 'macro') {
    const carbsRatio = Math.round(Number(editForm.carbsRatio))
    const proteinRatio = Math.round(Number(editForm.proteinRatio))
    const fatRatio = Math.round(Number(editForm.fatRatio))

    if ([carbsRatio, proteinRatio, fatRatio].some((value) => !Number.isFinite(value) || value < 0)) {
      showToast('营养比例不能小于 0')
      return
    }

    if (carbsRatio + proteinRatio + fatRatio !== 100) {
      showToast('营养比例合计需为 100%')
      return
    }

    payload.carbsRatio = carbsRatio
    payload.proteinRatio = proteinRatio
    payload.fatRatio = fatRatio
  }

  try {
    savingEdit.value = true
    await settingsStore.saveSettings(payload)
    Object.assign(form, settingsStore.settings)
    showToast('已保存')
    closeEdit()
  } catch (e: any) {
    showToast(e.message || '保存失败')
  } finally {
    savingEdit.value = false
  }
}

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
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 62px;
  padding: 14px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 8px;
  text-align: left;
  cursor: pointer;
}

.static-item {
  margin-bottom: 0;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  flex: 0 0 auto;
  min-width: 106px;
  white-space: nowrap;
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
  flex: 1;
  min-width: 0;
  line-height: 1.35;
  overflow-wrap: normal;
}

.settings-item:last-of-type .item-value {
  font-size: 13px;
  white-space: nowrap;
}

.item-arrow {
  color: var(--text-secondary);
  font-size: 14px;
  flex-shrink: 0;
}

.edit-popup {
  padding: 24px 18px calc(26px + var(--safe-bottom));
}

.edit-popup h3 {
  margin: 0 0 18px;
  text-align: center;
  font-size: 18px;
  color: var(--text);
}

.edit-popup :deep(.van-cell) {
  background: var(--card-bg);
}

.macro-total {
  margin: 12px 4px 0;
  color: var(--primary);
  font-size: 13px;
  text-align: right;
}

.macro-total.invalid {
  color: var(--danger);
}

.edit-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
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

@media (max-width: 360px) {
  .settings-item {
    gap: 8px;
    padding-inline: 14px;
  }

  .item-label {
    min-width: 94px;
    gap: 8px;
    font-size: 14px;
  }

  .settings-item:last-of-type .item-value {
    font-size: 12px;
  }
}
</style>
