<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    round
    :close-on-click-overlay="false"
    :style="{ maxHeight: '88%' }"
  >
    <div class="onboarding-guide">
      <div class="guide-head">
        <div>
          <p class="guide-kicker">新手引导</p>
          <h2>{{ currentStep.title }}</h2>
        </div>
        <button class="skip-button" type="button" @click="skipGuide">跳过</button>
      </div>

      <div class="step-track" aria-label="引导步骤">
        <span
          v-for="(step, index) in steps"
          :key="step.id"
          :class="{ active: index <= currentStepIndex }"
        />
      </div>

      <section v-if="currentStep.id === 'calorie'" class="guide-panel">
        <div class="panel-icon calorie-icon">
          <van-icon name="fire-o" />
        </div>
        <p class="panel-copy">先定一个今天看得见的热量范围，首页会用它计算剩余可摄入。</p>

        <div class="preset-row">
          <button
            v-for="preset in caloriePresets"
            :key="preset"
            type="button"
            class="preset-chip numeric"
            :class="{ active: Number(form.dailyCalorieGoal) === preset }"
            @click="form.dailyCalorieGoal = preset"
          >
            {{ preset }}
          </button>
        </div>

        <van-field
          v-model="form.dailyCalorieGoal"
          type="number"
          label="每日目标"
          input-align="right"
          placeholder="例如 1800"
        >
          <template #extra>千卡</template>
        </van-field>
      </section>

      <section v-else-if="currentStep.id === 'weight'" class="guide-panel">
        <div class="panel-icon weight-icon">
          <van-icon name="balance-o" />
        </div>
        <p class="panel-copy">告诉轻卡记你的当前位置和目标，设置页会展示体重目标进度。</p>

        <div class="weight-fields">
          <van-field
            v-model="form.weight"
            type="number"
            label="当前体重"
            input-align="right"
            placeholder="例如 65"
          >
            <template #extra>公斤</template>
          </van-field>
          <van-field
            v-model="form.weightGoal"
            type="number"
            label="目标体重"
            input-align="right"
            placeholder="例如 60"
          >
            <template #extra>公斤</template>
          </van-field>
        </div>
      </section>

      <section v-else class="guide-panel">
        <div class="panel-icon meal-icon">
          <van-icon name="records-o" />
        </div>
        <p class="panel-copy">选一个现在最想记录的餐别，下一步直接进入添加食物流程。</p>

        <div class="meal-choice-grid">
          <button
            v-for="meal in mealOptions"
            :key="meal.value"
            type="button"
            class="meal-choice"
            :class="{ active: form.mealType === meal.value }"
            @click="form.mealType = meal.value"
          >
            <InlineSvgIcon :name="meal.icon" />
            <span>{{ meal.label }}</span>
            <small>{{ meal.note }}</small>
          </button>
        </div>
      </section>

      <div class="guide-actions">
        <van-button v-if="currentStepIndex > 0" block plain @click="goBack">上一步</van-button>
        <van-button
          v-if="currentStep.id === 'calorie'"
          block
          type="primary"
          :loading="saving"
          @click="saveCalorieAndContinue"
        >
          保存并继续
        </van-button>
        <van-button
          v-else-if="currentStep.id === 'weight'"
          block
          type="primary"
          :loading="saving"
          @click="saveWeightAndContinue"
        >
          保存并继续
        </van-button>
        <van-button v-else block type="primary" @click="goAddFirstMeal">
          去添加第一餐
        </van-button>
      </div>

      <button v-if="currentStep.id === 'meal'" class="finish-link" type="button" @click="finishGuide">
        暂时不添加，完成引导
      </button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { MealType, UserSettings } from '@/types'
import InlineSvgIcon from '@/components/InlineSvgIcon.vue'
import type { InlineSvgIconName } from '@/utils/inlineSvgIcons'
import {
  markOnboardingCompleted,
  ONBOARDING_REOPEN_EVENT,
  resetOnboarding,
  shouldShowOnboarding,
} from '@/utils/onboarding'

type StepId = 'calorie' | 'weight' | 'meal'

const steps: { id: StepId; title: string }[] = [
  { id: 'calorie', title: '设置热量目标' },
  { id: 'weight', title: '选择体重目标' },
  { id: 'meal', title: '添加第一餐' },
]

const caloriePresets = [1600, 1800, 2000, 2200]
const mealOptions: { value: MealType; label: string; icon: InlineSvgIconName; note: string }[] = [
  { value: 'breakfast', label: '早餐', icon: 'meal-breakfast', note: '开启一天' },
  { value: 'lunch', label: '午餐', icon: 'meal-lunch', note: '补足能量' },
  { value: 'dinner', label: '晚餐', icon: 'meal-dinner', note: '收住节奏' },
  { value: 'snack', label: '加餐', icon: 'meal-snack', note: '少量记录' },
]

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const router = useRouter()

const visible = ref(false)
const saving = ref(false)
const currentStepIndex = ref(0)
const form = reactive({
  dailyCalorieGoal: 2000,
  weight: 65,
  weightGoal: 60,
  mealType: 'breakfast' as MealType,
})

const userId = computed(() => authStore.user?.id)
const currentStep = computed(() => steps[currentStepIndex.value])
const canOfferGuide = computed(() => Boolean(route.meta.requiresAuth))

let openRequestId = 0

watch(
  [userId, () => route.fullPath],
  () => {
    void openIfNeeded()
  },
  { immediate: true }
)

if (typeof window !== 'undefined') {
  window.addEventListener(ONBOARDING_REOPEN_EVENT, reopenGuide)
}

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener(ONBOARDING_REOPEN_EVENT, reopenGuide)
  }
})

async function openIfNeeded(force = false) {
  const requestId = ++openRequestId

  if (!canOfferGuide.value || !userId.value) {
    visible.value = false
    return
  }

  if (!settingsStore.loaded) {
    await settingsStore.loadSettings().catch(() => undefined)
  }

  if (requestId !== openRequestId) {
    return
  }

  syncForm(settingsStore.settings)

  if (force || shouldShowOnboarding(userId.value)) {
    currentStepIndex.value = 0
    visible.value = true
  }
}

function syncForm(settings: UserSettings) {
  form.dailyCalorieGoal = Number(settings.dailyCalorieGoal || 2000)
  form.weight = Number(settings.weight || 65)
  form.weightGoal = Number(settings.weightGoal || 60)
}

function reopenGuide() {
  if (!userId.value) {
    return
  }

  resetOnboarding(userId.value)
  void openIfNeeded(true)
}

function completeGuide() {
  if (userId.value) {
    markOnboardingCompleted(userId.value)
  }
  visible.value = false
}

function skipGuide() {
  completeGuide()
  showToast('已跳过，可在设置页重新打开')
}

function finishGuide() {
  completeGuide()
  showToast('引导已完成')
}

function goBack() {
  currentStepIndex.value = Math.max(0, currentStepIndex.value - 1)
}

async function saveCalorieAndContinue() {
  const dailyCalorieGoal = Math.round(Number(form.dailyCalorieGoal))

  if (!Number.isFinite(dailyCalorieGoal) || dailyCalorieGoal < 800 || dailyCalorieGoal > 6000) {
    showToast('请输入 800-6000 千卡之间的目标')
    return
  }

  await saveSettings({ dailyCalorieGoal })
  currentStepIndex.value = 1
}

async function saveWeightAndContinue() {
  const weight = Math.round(Number(form.weight) * 10) / 10
  const weightGoal = Math.round(Number(form.weightGoal) * 10) / 10

  if (!isValidWeight(weight) || !isValidWeight(weightGoal)) {
    showToast('请输入 25-300 公斤之间的体重')
    return
  }

  await saveSettings({ weight, weightGoal })
  currentStepIndex.value = 2
}

async function saveSettings(payload: Partial<UserSettings>) {
  try {
    saving.value = true
    await settingsStore.saveSettings(payload)
  } catch (e: any) {
    showToast(e.message || '保存失败')
    throw e
  } finally {
    saving.value = false
  }
}

function isValidWeight(value: number) {
  return Number.isFinite(value) && value >= 25 && value <= 300
}

function goAddFirstMeal() {
  const meal = form.mealType
  completeGuide()
  router.push({
    path: '/log',
    query: {
      meal,
      guide: 'first-meal',
    },
  })
}
</script>

<style scoped>
.onboarding-guide {
  padding: 22px 18px calc(24px + var(--safe-bottom));
  color: var(--text);
}

.guide-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}

.guide-kicker {
  margin: 0 0 4px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
}

.guide-head h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 22px;
  line-height: 1.2;
}

.skip-button,
.finish-link {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}

.skip-button {
  padding: 4px 0;
  font-size: 13px;
}

.step-track {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 18px;
}

.step-track span {
  height: 5px;
  border-radius: 99px;
  background: var(--divider);
}

.step-track span.active {
  background: linear-gradient(90deg, var(--primary), var(--primary-strong));
}

.guide-panel {
  min-height: 284px;
}

.panel-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  margin-bottom: 12px;
  font-size: 24px;
}

.calorie-icon {
  color: var(--primary);
  background: var(--primary-soft);
}

.weight-icon {
  color: var(--blue);
  background: var(--blue-soft);
}

.meal-icon {
  color: var(--orange);
  background: var(--orange-soft);
}

.panel-copy {
  margin: 0 0 18px;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.6;
}

.preset-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.preset-chip {
  min-height: 42px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card-bg);
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.preset-chip.active {
  color: var(--primary);
  border-color: var(--primary);
  background: var(--primary-soft);
}

.guide-panel :deep(.van-cell) {
  border-radius: var(--radius);
  background: var(--bg-warm);
}

.weight-fields {
  display: grid;
  gap: 10px;
}

.meal-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.meal-choice {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 2px 8px;
  min-height: 72px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card-bg);
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.meal-choice .inline-svg-icon {
  grid-row: 1 / 3;
  color: var(--primary);
  font-size: 22px;
}

.meal-choice span {
  font-size: 15px;
  font-weight: 700;
}

.meal-choice small {
  color: var(--text-secondary);
  font-size: 12px;
}

.meal-choice.active {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.guide-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.guide-actions .van-button:only-child {
  grid-column: 1 / -1;
}

.finish-link {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 4px;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 360px) {
  .preset-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .meal-choice-grid {
    grid-template-columns: 1fr;
  }
}
</style>
