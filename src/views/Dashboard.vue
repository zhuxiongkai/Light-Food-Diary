<template>
  <div class="page">
    <div class="page-header flex-between">
      <span>热量助手</span>
      <span class="date-nav">
        <van-icon name="arrow-left" @click="prevDay" />
        <span class="date-label">{{ dateLabel }}</span>
        <van-icon name="arrow" v-if="isToday" style="opacity:0.3" />
        <van-icon v-else name="arrow" @click="nextDay" />
      </span>
    </div>

    <div class="card text-center">
      <CalorieRing :current="mealStore.dailyCalories" :goal="settings.dailyCalorieGoal" />
      <div class="mt-8">
        <span v-if="remaining > 0" class="remaining-text">还可以吃 {{ remaining }} kcal</span>
        <span v-else class="exceed-text">已超出 {{ -remaining }} kcal</span>
      </div>
    </div>

    <div class="card">
      <MacroBar
        :protein="mealStore.dailyProtein"
        :fat="mealStore.dailyFat"
        :carbs="mealStore.dailyCarbs"
        :proteinGoal="macroGoals.protein"
        :fatGoal="macroGoals.fat"
        :carbsGoal="macroGoals.carbs"
      />
    </div>

    <div class="card">
      <div class="section-title mb-12">各餐分布</div>
      <div class="meal-bars">
        <div v-for="t in mealTypes" :key="t.value" class="meal-bar-row">
          <span class="meal-bar-label">{{ t.label }}</span>
          <div class="meal-bar-track">
            <div class="meal-bar-fill" :style="{ width: barPct(t.value) + '%', background: barColor(t.value) }" />
          </div>
          <span class="meal-bar-val numeric">{{ mealStore.caloriesByType(t.value) }}</span>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <div class="action-card" @click="$router.push('/log')">
        <van-icon name="add-o" size="24" color="#4CAF50" />
        <span>记录饮食</span>
      </div>
      <div class="action-card" @click="$router.push('/ai-photo')">
        <van-icon name="photograph" size="24" color="#2196F3" />
        <span>AI拍照</span>
      </div>
      <div class="action-card" @click="$router.push('/weight')">
        <van-icon name="balance-o" size="24" color="#FF9800" />
        <span>记体重</span>
      </div>
      <div class="action-card" @click="$router.push('/statistics')">
        <van-icon name="chart-trending-o" size="24" color="#9C27B0" />
        <span>看统计</span>
      </div>
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
const isToday = computed(() => dateStr(currentDate.value) === mealStore.todayStr())
const dateLabel = computed(() => isToday.value ? '今天' : dateStr(currentDate.value))

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

const mealTypes = computed(() =>
  (Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]).map(([value, label]) => ({ value, label }))
)

const barColors: Record<string, string> = { breakfast: '#FF9800', lunch: '#4CAF50', dinner: '#2196F3', snack: '#9C27B0' }
function barColor(type: string) { return barColors[type] || '#999' }

const maxMealCal = computed(() => {
  const vals = mealTypes.value.map(t => mealStore.caloriesByType(t.value))
  return Math.max(...vals, 1)
})

function barPct(type: MealType) {
  return Math.round((mealStore.caloriesByType(type) / maxMealCal.value) * 100)
}

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
.date-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.remaining-text { color: var(--primary); font-weight: 500; }
.exceed-text { color: var(--danger); font-weight: 500; }
.section-title { font-size: 14px; font-weight: 600; }
.meal-bars { display: flex; flex-direction: column; gap: 10px; }
.meal-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.meal-bar-label { width: 36px; font-size: 13px; flex-shrink: 0; }
.meal-bar-track {
  flex: 1;
  height: 16px;
  background: #eee;
  border-radius: 8px;
  overflow: hidden;
}
.meal-bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.4s ease;
  min-width: 4px;
}
.meal-bar-val {
  width: 48px;
  font-size: 13px;
  text-align: right;
  font-weight: 600;
}
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 8px 16px 24px;
}
.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  cursor: pointer;
  font-size: 12px;
  transition: transform 0.15s;
}
.action-card:active { transform: scale(0.95); }
</style>
