<template>
  <div class="page dashboard-page">
    <div class="page-header dashboard-header">
      <div class="header-left">
        <h1 class="page-title">今日摄入</h1>
        <div class="date-info">
          <van-icon name="calendar-o" />
          <span>{{ fullDate }}</span>
        </div>
      </div>
      <div class="avatar-circle">
        <van-icon name="user-o" />
      </div>
    </div>

    <!-- Calorie Ring Card -->
    <div class="card ring-card">
      <div class="ring-container">
        <CalorieRing :current="mealStore.dailyCalories" :goal="settings.dailyCalorieGoal" />
      </div>
      <div class="calorie-info">
        <div class="info-row">
          <span class="info-label">今日目标</span>
          <span class="info-value">{{ settings.dailyCalorieGoal }}<span class="unit">千卡</span></span>
        </div>
        <div class="info-row info-highlight">
          <span class="info-label highlight-label">
            <van-icon name="arrow" />
            <span v-if="remaining > 0">还可摄入</span>
            <span v-else>已超出</span>
          </span>
          <span class="info-value highlight-value">{{ Math.abs(remaining) }}<span class="unit">千卡</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">运动消耗</span>
          <span class="info-value">320<span class="unit">千卡</span></span>
        </div>
      </div>
    </div>

    <!-- Meals Distribution Section -->
    <div class="card meals-section">
      <div class="section-header">
        <h2 class="section-title">今日餐食</h2>
        <span class="section-hint">建议分配 {{ settings.dailyCalorieGoal }}千卡</span>
      </div>
      <div class="meals-grid">
        <div v-for="meal in mealDistribution" :key="meal.type" class="meal-box" @click="$router.push('/log?meal=' + meal.type)">
          <div class="meal-icon" :style="{ background: meal.bgColor }">
            <van-icon :name="meal.icon" :color="meal.color" />
          </div>
          <div class="meal-content">
            <div class="meal-label">{{ meal.label }}</div>
            <div class="meal-calories numeric">{{ meal.calories }}<span>千卡</span></div>
            <div class="meal-hint">{{ meal.hint }}</div>
          </div>
          <van-icon name="arrow" class="meal-arrow" />
        </div>
      </div>
    </div>

    <!-- Macronutrients Section -->
    <div class="card macro-section">
      <div class="section-title">三大营养素</div>
      <div class="macro-details">
        <div class="macro-row">
          <div class="macro-item">
            <div class="macro-icon protein-icon">💪</div>
            <div class="macro-info">
              <span class="macro-name">蛋白质</span>
              <div class="macro-values">
                <span class="numeric">{{ mealStore.dailyProtein }}</span>
                <span class="macro-goal">/ {{ macroGoals.protein }} g</span>
              </div>
            </div>
            <span class="macro-percent">{{ proteinPercent }}%</span>
          </div>
          <div class="macro-progress">
            <div class="progress-bar" :style="{ width: Math.min(proteinPercent, 100) + '%' }"></div>
          </div>
        </div>

        <div class="macro-row">
          <div class="macro-item">
            <div class="macro-icon carbs-icon">🌾</div>
            <div class="macro-info">
              <span class="macro-name">碳水化合物</span>
              <div class="macro-values">
                <span class="numeric">{{ mealStore.dailyCarbs }}</span>
                <span class="macro-goal">/ {{ macroGoals.carbs }} g</span>
              </div>
            </div>
            <span class="macro-percent">{{ carbsPercent }}%</span>
          </div>
          <div class="macro-progress">
            <div class="progress-bar carbs-bar" :style="{ width: Math.min(carbsPercent, 100) + '%' }"></div>
          </div>
        </div>

        <div class="macro-row">
          <div class="macro-item">
            <div class="macro-icon fat-icon">🧈</div>
            <div class="macro-info">
              <span class="macro-name">脂肪</span>
              <div class="macro-values">
                <span class="numeric">{{ mealStore.dailyFat }}</span>
                <span class="macro-goal">/ {{ macroGoals.fat }} g</span>
              </div>
            </div>
            <span class="macro-percent">{{ fatPercent }}%</span>
          </div>
          <div class="macro-progress">
            <div class="progress-bar fat-bar" :style="{ width: Math.min(fatPercent, 100) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tip Box -->
    <div class="tip-box">
      <van-icon name="bulb-o" class="tip-icon" />
      <div class="tip-content">
        <p>今天还可以摄入 {{ remaining }} 千卡。建议优先选择蛋白质，低脂肪物。</p>
      </div>
      <van-icon name="cross" class="tip-close" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from 'vant'
import { useMealStore } from '@/stores/mealStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useFoodStore } from '@/stores/foodStore'
import { MEAL_TYPE_LABELS, type MealType } from '@/types'
import CalorieRing from '@/components/CalorieRing.vue'
import MacroBar from '@/components/MacroBar.vue'

const mealStore = useMealStore()
const settingsStore = useSettingsStore()
const foodStore = useFoodStore()

const currentDate = ref(new Date())

const settings = computed(() => settingsStore.settings)

const fullDate = computed(() => {
  const date = currentDate.value
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${year}年${month}月${day}日 ${weekday}`
})

const remaining = computed(() => settings.value.dailyCalorieGoal - mealStore.dailyCalories)

const macroGoals = computed(() => {
  const s = settings.value
  const cal = s.dailyCalorieGoal
  return {
    protein: Math.round(cal * s.proteinRatio / 100 / 4),
    fat: Math.round(cal * s.fatRatio / 100 / 9),
    carbs: Math.round(cal * s.carbsRatio / 100 / 4)
  }
})

const proteinPercent = computed(() => Math.round((mealStore.dailyProtein / macroGoals.value.protein) * 100))
const carbsPercent = computed(() => Math.round((mealStore.dailyCarbs / macroGoals.value.carbs) * 100))
const fatPercent = computed(() => Math.round((mealStore.dailyFat / macroGoals.value.fat) * 100))

const mealTypes = computed(() =>
  (Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]).map(([value, label]) => ({ value, label }))
)

const mealDistribution = computed(() => [
  {
    type: 'breakfast',
    label: '早餐',
    icon: 'sun-o',
    color: '#FF9800',
    bgColor: '#FFF3E6',
    calories: mealStore.caloriesByType('breakfast'),
    hint: '建议 400-500 千卡'
  },
  {
    type: 'lunch',
    label: '午餐',
    icon: 'sunny-o',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    calories: mealStore.caloriesByType('lunch'),
    hint: '建议 600-700 千卡'
  },
  {
    type: 'dinner',
    label: '晚餐',
    icon: 'moon-o',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    calories: mealStore.caloriesByType('dinner'),
    hint: '建议 500-600 千卡'
  },
  {
    type: 'snack',
    label: '加餐',
    icon: 'bag-o',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    calories: mealStore.caloriesByType('snack'),
    hint: '建议 100-200 千卡'
  }
])

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

async function loadDay(d: Date) {
  await mealStore.loadMeals(dateStr(d))
}

function prevDay() {
  currentDate.value = new Date(currentDate.value.getTime() - 86400000)
  loadDay(currentDate.value)
}

function nextDay() {
  const next = new Date(currentDate.value.getTime() + 86400000)
  if (next <= new Date()) {
    currentDate.value = next
    loadDay(currentDate.value)
  }
}

onMounted(async () => {
  await Promise.all([
    settingsStore.loadSettings(),
    foodStore.loadCustomFoods(),
    mealStore.loadMeals()
  ])
})

</script>

<style scoped>
.dashboard-page {
  padding: 54px 16px calc(92px + var(--safe-bottom));
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding: 0;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(22, 185, 120, 0.2);
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(44, 70, 103, 0.08);
  border: 1px solid rgba(132, 149, 171, 0.08);
}

.ring-card {
  padding: 20px;
}

.ring-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.calorie-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(132, 149, 171, 0.08);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 4px;
}

.info-highlight {
  background: linear-gradient(135deg, rgba(22, 185, 120, 0.08) 0%, rgba(232, 248, 241, 0.5) 100%);
  border-radius: 8px;
  padding: 12px;
  border-bottom: none;
}

.highlight-label {
  color: var(--primary);
  font-weight: 600;
}

.highlight-value {
  color: var(--primary);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.section-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.meals-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.meal-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(247, 251, 255, 0.8) 0%, rgba(232, 248, 241, 0.5) 100%);
  border-radius: 12px;
  border: 1px solid rgba(132, 149, 171, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;
}

.meal-box:active {
  transform: scale(0.98);
}

.meal-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.meal-content {
  flex: 1;
  min-width: 0;
}

.meal-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.meal-calories {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 4px 0;
}

.meal-calories span {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 4px;
}

.meal-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.meal-arrow {
  color: var(--text-secondary);
  font-size: 16px;
  flex-shrink: 0;
}

.macro-section {
  background: white;
}

.macro-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.macro-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.macro-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.macro-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.protein-icon {
  background: linear-gradient(135deg, rgba(67, 136, 244, 0.15) 0%, rgba(67, 136, 244, 0.05) 100%);
}

.carbs-icon {
  background: linear-gradient(135deg, rgba(67, 136, 244, 0.15) 0%, rgba(67, 136, 244, 0.05) 100%);
}

.fat-icon {
  background: linear-gradient(135deg, rgba(255, 157, 53, 0.15) 0%, rgba(255, 157, 53, 0.05) 100%);
}

.macro-info {
  flex: 1;
}

.macro-name {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.macro-values {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.macro-values .numeric {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.macro-goal {
  font-size: 12px;
  color: var(--text-secondary);
}

.macro-percent {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
  min-width: 32px;
  text-align: right;
}

.macro-progress {
  height: 6px;
  background: rgba(132, 149, 171, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--blue) 0%, #4388f4 100%);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.carbs-bar {
  background: linear-gradient(90deg, var(--blue) 0%, #4388f4 100%);
}

.fat-bar {
  background: linear-gradient(90deg, var(--orange) 0%, #ff9d35 100%);
}

.tip-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(22, 185, 120, 0.08) 0%, rgba(232, 248, 241, 0.5) 100%);
  border-radius: 12px;
  border: 1px solid rgba(22, 185, 120, 0.15);
  margin: 0 0 20px 0;
}

.tip-icon {
  font-size: 20px;
  color: var(--primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.tip-content {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.tip-content p {
  margin: 0;
}

.tip-close {
  font-size: 16px;
  color: var(--text-secondary);
  flex-shrink: 0;
  cursor: pointer;
}
</style>
