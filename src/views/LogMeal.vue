<template>
  <div class="page log-page">
    <header class="page-header log-header">
      <h1 class="page-title">饮食记录</h1>
      <button class="date-button" type="button" @click="showDatePicker = true">
        <van-icon name="calendar-o" />
        <span>{{ displayDate }}</span>
        <van-icon name="arrow-down" />
      </button>
    </header>

    <div class="search-wrapper">
      <button class="search-shell" type="button" @click="showSearch = true">
        <van-icon name="search" />
        <span>搜索食物、品牌或菜品</span>
      </button>
    </div>

    <div class="meal-switch" role="tablist" aria-label="餐别">
      <button
        v-for="tab in mealTabs"
        :key="tab.value"
        class="meal-tab"
        :class="{ active: activeMeal === tab.value }"
        type="button"
        @click="activeMeal = tab.value"
      >
        <van-icon :name="tab.icon" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <section class="summary-card">
      <div class="summary-main">
        <span class="summary-label">{{ activeMealLabel }}摄入</span>
        <div class="calorie-line">
          <strong class="numeric">{{ summaryCalories }}</strong>
          <span>千卡</span>
        </div>
        <span class="range-text">建议 {{ calorieRange }}</span>
        <span class="good-text" v-if="displayMeals.length > 0"><van-icon name="success" /> 已记录 {{ displayMeals.length }} 项</span>
      </div>
      <div class="macro-stack">
        <div v-for="row in macroRows" :key="row.name" class="macro-row">
          <div class="macro-meta">
            <span>{{ row.name }}</span>
            <span><b class="numeric">{{ row.value }}</b> / {{ row.goal }} g</span>
          </div>
          <div class="macro-track">
            <i :style="{ width: row.percent + '%', background: row.color }" />
          </div>
        </div>
      </div>
    </section>

    <div class="section-divider">
      <h2 class="section-label">快速添加</h2>
    </div>

    <div class="quick-grid">
      <button class="quick-card" type="button" @click="goToAiPhoto">
        <span class="soft-icon camera-icon"><van-icon name="photograph" /></span>
        <span class="quick-title">拍照识别</span>
        <span class="quick-sub">智能识别食物</span>
      </button>
      <button class="quick-card disabled" type="button" disabled>
        <span class="soft-icon scan-icon"><van-icon name="scan" /></span>
        <span class="quick-title">扫码录入</span>
        <span class="quick-sub">条码识别（规划中）</span>
      </button>
      <button class="quick-card" type="button" @click="showSearch = true">
        <span class="soft-icon edit-icon"><van-icon name="edit" /></span>
        <span class="quick-title">手动添加</span>
        <span class="quick-sub">选择食物录入</span>
      </button>
    </div>

    <div class="section-divider food-heading">
      <h2 class="section-label">已记录食物</h2>
      <span class="section-tip">点击可编辑 · 长按可删除</span>
    </div>

    <div v-if="displayMeals.length === 0" class="empty-state">
      <van-empty description="当前餐别还没有记录" image="search" />
      <van-button type="primary" round size="small" @click="showSearch = true">添加食物</van-button>
    </div>

    <div v-else class="food-list">
      <article
        v-for="item in displayMeals"
        :key="item.key"
        class="food-card"
        @click="openMealDetail(item)"
        @contextmenu.prevent="onDeleteMeal(item)"
        @touchstart.passive="startPress(item)"
        @touchend="cancelPress"
        @touchmove="cancelPress"
      >
        <div class="food-thumb" :class="`thumb-${item.thumb}`">
          <span>{{ item.foodName.slice(0, 1) }}</span>
        </div>
        <div class="food-info">
          <strong>{{ item.foodName }}</strong>
          <span>{{ item.subtitle }}</span>
          <em :class="`tag-${item.tone}`">{{ item.tag }}</em>
        </div>
        <div class="food-calorie">
          <div>
            <strong class="numeric">{{ item.calories }}</strong>
            <span>千卡</span>
          </div>
          <small>{{ item.time }}</small>
        </div>
        <button class="more-button" type="button" @click.stop="openMealDetail(item)">
          <van-icon name="arrow" />
        </button>
      </article>
    </div>

    <button class="fab" type="button" aria-label="添加食物" @click="showSearch = true">
      <van-icon name="plus" />
    </button>

    <van-popup v-model:show="showSearch" position="bottom" :style="{ height: '78%' }" round>
      <div class="search-popup">
        <FoodSearch @select="onFoodSelect" />
        <div class="custom-food-section">
          <div class="custom-food-divider"><span>找不到想要的？</span></div>
          <button v-if="!showCustomForm" class="add-custom-btn" type="button" @click="showCustomForm = true">
            <van-icon name="add-o" /> 添加自定义食物
          </button>
          <div v-else class="custom-form">
            <van-field v-model="customForm.name" label="名称" placeholder="食物名称" />
            <van-field v-model="customForm.caloriesPer100g" type="number" label="热量/100g" placeholder="kcal" />
            <van-field v-model="customForm.protein" type="number" label="蛋白质/100g" placeholder="g" />
            <van-field v-model="customForm.fat" type="number" label="脂肪/100g" placeholder="g" />
            <van-field v-model="customForm.carbs" type="number" label="碳水/100g" placeholder="g" />
            <div class="custom-form-actions">
              <van-button size="small" plain @click="showCustomForm = false">取消</van-button>
              <van-button size="small" type="primary" @click="onAddCustomFood">确认添加</van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="showWeight" position="bottom" round>
      <div class="weight-popup">
        <h3>输入重量</h3>
        <div class="selected-food" v-if="selectedFood">
          <span>{{ selectedFood.name }}</span>
          <span>{{ selectedFood.caloriesPer100g }} kcal/100g</span>
        </div>
        <van-stepper v-model="weight" :min="1" :max="2000" :step="10" input-width="86px" />
        <div class="calc-result" v-if="selectedFood">
          预计 {{ calcCalories }} 千卡 · 蛋白质 {{ calcProtein }}g · 脂肪 {{ calcFat }}g · 碳水 {{ calcCarbs }}g
        </div>
        <van-button type="primary" block round class="mt-16" @click="onConfirmAdd">
          添加到{{ activeMealLabel }}
        </van-button>
      </div>
    </van-popup>

    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        title="选择日期"
        :model-value="dateColumns"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showDetail" position="bottom" round>
      <div v-if="detailMeal" class="detail-popup">
        <h3>{{ detailMeal.foodName }}</h3>
        <div class="detail-time">记录时间：{{ detailMeal.time }}</div>
        <van-stepper v-model="detailWeight" :min="1" :max="2000" :step="10" input-width="86px" />
        <div class="detail-grid">
          <div><span>热量</span><strong>{{ detailCalories }} kcal</strong></div>
          <div><span>蛋白质</span><strong>{{ detailProtein }} g</strong></div>
          <div><span>脂肪</span><strong>{{ detailFat }} g</strong></div>
          <div><span>碳水</span><strong>{{ detailCarbs }} g</strong></div>
        </div>
        <div class="detail-actions">
          <van-button plain type="danger" round block @click="deleteDetailMeal">删除记录</van-button>
          <van-button type="primary" round block @click="saveMealDetail">保存修改</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, DatePicker, Empty, Icon, Popup, Stepper, showConfirmDialog, showToast } from 'vant'
import { useMealStore } from '@/stores/mealStore'
import { useFoodStore } from '@/stores/foodStore'
import type { FoodItem, MealRecord, MealType } from '@/types'
import FoodSearch from '@/components/FoodSearch.vue'

type Tone = 'green' | 'blue' | 'purple'
type DisplayMeal = MealRecord & {
  key: string
  subtitle: string
  tag: string
  tone: Tone
  thumb: string
  time: string
}

const mealStore = useMealStore()
const foodStore = useFoodStore()
const route = useRoute()
const router = useRouter()

const activeMeal = ref<MealType>('breakfast')
const showSearch = ref(false)
const showWeight = ref(false)
const showDatePicker = ref(false)
const showDetail = ref(false)
const selectedFood = ref<FoodItem | null>(null)
const weight = ref(100)
const currentDate = ref(resolveRouteDate() || mealStore.todayStr())
const pressTimer = ref<number | null>(null)
const pressTriggered = ref(false)
const detailMeal = ref<DisplayMeal | null>(null)
const detailWeight = ref(100)
const detailBase = ref({ weight: 100, calories: 0, protein: 0, fat: 0, carbs: 0 })
const showCustomForm = ref(false)
const customForm = ref({ name: '', caloriesPer100g: 0, protein: 0, fat: 0, carbs: 0 })

const mealTabs: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: '早餐', icon: 'underway-o' },
  { value: 'lunch', label: '午餐', icon: 'hot-o' },
  { value: 'dinner', label: '晚餐', icon: 'notes-o' },
  { value: 'snack', label: '加餐', icon: 'bag-o' }
]

const targetByMeal: Record<MealType, { min: number; max: number; protein: number; carbs: number; fat: number }> = {
  breakfast: { min: 400, max: 500, protein: 78, carbs: 152, fat: 42 },
  lunch: { min: 600, max: 760, protein: 92, carbs: 188, fat: 54 },
  dinner: { min: 520, max: 680, protein: 82, carbs: 132, fat: 46 },
  snack: { min: 120, max: 260, protein: 28, carbs: 46, fat: 18 }
}

const activeMealLabel = computed(() => mealTabs.find((tab) => tab.value === activeMeal.value)?.label || '早餐')

const displayDate = computed(() => {
  const date = new Date(`${currentDate.value}T00:00:00`)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
})

const dateColumns = computed(() => {
  const [y, m, d] = currentDate.value.split('-')
  return [y, m, d]
})

const realMeals = computed<DisplayMeal[]>(() =>
  mealStore.getMealsByType(activeMeal.value).map((meal) => ({
    ...meal,
    key: `real-${meal.id || meal.createdAt || meal.foodId}`,
    subtitle: `${meal.weight} 克`,
    tag: tagForMeal(meal),
    tone: toneForMeal(meal),
    thumb: 'custom',
    time: timeForMeal(meal)
  }))
)

const displayMeals = computed(() => realMeals.value)

const summaryCalories = computed(() => Math.round(displayMeals.value.reduce((sum, meal) => sum + meal.calories, 0)))
const summaryProtein = computed(() => Math.round(displayMeals.value.reduce((sum, meal) => sum + meal.protein, 0)))
const summaryFat = computed(() => Math.round(displayMeals.value.reduce((sum, meal) => sum + meal.fat, 0)))
const summaryCarbs = computed(() => Math.round(displayMeals.value.reduce((sum, meal) => sum + meal.carbs, 0)))

const calorieRange = computed(() => {
  const target = targetByMeal[activeMeal.value]
  return `${target.min}-${target.max} 千卡`
})

const macroRows = computed(() => {
  const target = targetByMeal[activeMeal.value]
  return [
    { name: '蛋白质', value: summaryProtein.value, goal: target.protein, color: 'var(--primary)' },
    { name: '碳水化合物', value: summaryCarbs.value, goal: target.carbs, color: 'var(--blue)' },
    { name: '脂肪', value: summaryFat.value, goal: target.fat, color: 'var(--orange)' }
  ].map((row) => ({
    ...row,
    percent: Math.min(100, Math.round((row.value / row.goal) * 100))
  }))
})

const calcCalories = computed(() =>
  selectedFood.value ? Math.round((selectedFood.value.caloriesPer100g * weight.value) / 100) : 0
)
const calcProtein = computed(() =>
  selectedFood.value ? Math.round(selectedFood.value.protein * weight.value) / 100 : 0
)
const calcFat = computed(() =>
  selectedFood.value ? Math.round(selectedFood.value.fat * weight.value) / 100 : 0
)
const calcCarbs = computed(() =>
  selectedFood.value ? Math.round(selectedFood.value.carbs * weight.value) / 100 : 0
)

const detailScale = computed(() => {
  const baseWeight = Math.max(detailBase.value.weight, 1)
  return detailWeight.value / baseWeight
})

const detailCalories = computed(() => Math.round(detailBase.value.calories * detailScale.value))
const detailProtein = computed(() => Math.round(detailBase.value.protein * detailScale.value * 10) / 10)
const detailFat = computed(() => Math.round(detailBase.value.fat * detailScale.value * 10) / 10)
const detailCarbs = computed(() => Math.round(detailBase.value.carbs * detailScale.value * 10) / 10)

watch(activeMeal, (mealType) => {
  setRouteQuery({ meal: mealType })
})

watch(currentDate, async (date) => {
  setRouteQuery({ date })
  await mealStore.loadMeals(date)
})

onMounted(async () => {
  const routeMeal = resolveRouteMeal(route.query.meal)
  if (routeMeal) {
    activeMeal.value = routeMeal
  }
  const routeDate = resolveRouteDate()
  if (routeDate) {
    currentDate.value = routeDate
  }

  await Promise.all([mealStore.loadMeals(currentDate.value), foodStore.loadAllFoods()])
})

function resolveRouteMeal(value: unknown): MealType | null {
  if (typeof value !== 'string') return null
  return ['breakfast', 'lunch', 'dinner', 'snack'].includes(value) ? (value as MealType) : null
}

function resolveRouteDate() {
  const value = route.query.date
  if (typeof value !== 'string') return null
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function setRouteQuery(patch: Record<string, string>) {
  const query = {
    ...route.query,
    ...patch,
  }
  router.replace({ query })
}

function tagForMeal(meal: MealRecord) {
  if (meal.protein >= 18) return '高蛋白'
  if (meal.carbs >= 30) return '补能量'
  if (meal.fat >= 10) return '好脂肪'
  return '轻食'
}

function toneForMeal(meal: MealRecord): Tone {
  if (meal.protein >= meal.carbs && meal.protein >= meal.fat) return 'green'
  if (meal.carbs >= meal.fat) return 'blue'
  return 'purple'
}

function timeForMeal(meal: MealRecord) {
  if (!meal.createdAt) return '--:--'
  return new Date(meal.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function onFoodSelect(food: FoodItem) {
  selectedFood.value = food
  weight.value = 100
  showSearch.value = false
  showWeight.value = true
}

function goToAiPhoto() {
  router.push({
    path: '/ai-photo',
    query: {
      meal: activeMeal.value,
      date: currentDate.value
    }
  })
}

async function onAddCustomFood() {
  if (!customForm.value.name || customForm.value.caloriesPer100g <= 0) {
    showToast('请填写名称和热量')
    return
  }
  const newFood = await foodStore.addCustomFood({
    name: customForm.value.name,
    category: 'custom',
    caloriesPer100g: Number(customForm.value.caloriesPer100g),
    protein: Number(customForm.value.protein),
    fat: Number(customForm.value.fat),
    carbs: Number(customForm.value.carbs),
  })
  showToast('添加成功')
  customForm.value = { name: '', caloriesPer100g: 0, protein: 0, fat: 0, carbs: 0 }
  showCustomForm.value = false
  // 直接进入重量选择流程
  onFoodSelect(newFood)
}

async function onConfirmAdd() {
  if (!selectedFood.value) return
  await mealStore.addMeal({
    date: currentDate.value,
    mealType: activeMeal.value,
    foodId: Number(selectedFood.value.id) || 0,
    foodName: selectedFood.value.name,
    weight: weight.value,
    calories: calcCalories.value,
    protein: calcProtein.value,
    fat: calcFat.value,
    carbs: calcCarbs.value
  })
  showWeight.value = false
  selectedFood.value = null
  showToast('已添加')
}

function startPress(item: DisplayMeal) {
  cancelPress()
  pressTimer.value = window.setTimeout(() => {
    pressTriggered.value = true
    void onDeleteMeal(item)
  }, 560)
}

function cancelPress() {
  if (pressTimer.value) {
    window.clearTimeout(pressTimer.value)
    pressTimer.value = null
  }
}

async function onDeleteMeal(item: DisplayMeal): Promise<boolean> {
  cancelPress()
  if (!item.id) {
    showToast('记录缺少ID，无法删除')
    return false
  }
  try {
    await showConfirmDialog({ title: '删除记录', message: `删除 ${item.foodName}？` })
    await mealStore.deleteMeal(item.id)
    showToast('已删除')
    return true
  } catch {
    // cancelled
    return false
  }
}

function onDateConfirm(event: { selectedValues: string[] }) {
  const [y, m, d] = event.selectedValues
  currentDate.value = `${y}-${m}-${d}`
  showDatePicker.value = false
}

function openMealDetail(item: DisplayMeal) {
  if (pressTriggered.value) {
    pressTriggered.value = false
    return
  }
  detailMeal.value = item
  detailWeight.value = item.weight
  detailBase.value = {
    weight: Math.max(item.weight, 1),
    calories: item.calories,
    protein: item.protein,
    fat: item.fat,
    carbs: item.carbs,
  }
  showDetail.value = true
}

async function deleteDetailMeal() {
  if (!detailMeal.value) return
  const deleted = await onDeleteMeal(detailMeal.value)
  if (deleted) {
    showDetail.value = false
    detailMeal.value = null
  }
}

async function saveMealDetail() {
  if (!detailMeal.value?.id) {
    showToast('记录缺少ID，无法更新')
    return
  }

  await mealStore.updateMeal(detailMeal.value.id, {
    weight: detailWeight.value,
    calories: detailCalories.value,
    protein: detailProtein.value,
    fat: detailFat.value,
    carbs: detailCarbs.value,
  })

  showDetail.value = false
  showToast('已更新')
}
</script>

<style scoped>
.log-page {
  position: relative;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding: 0;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
}

.date-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
}

.search-wrapper {
  margin-bottom: 16px;
}

.search-shell {
  display: flex;
  width: 100%;
  height: 48px;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  color: var(--text-secondary);
  background: rgba(180, 160, 140, 0.12);
  border: none;
  border-radius: 24px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-shell:active {
  background: rgba(180, 160, 140, 0.2);
}

.search-shell .van-icon {
  color: var(--text-secondary);
  font-size: 18px;
}

.meal-switch {
  display: flex;
  gap: 0;
  margin: 20px 0;
  padding: 2px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
}

.meal-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: transparent;
  border: none;
  border-radius: 18px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.meal-tab .van-icon {
  font-size: 18px;
}

.meal-tab.active {
  color: var(--primary);
  background: var(--primary-soft);
}

.meal-tab.active .van-icon {
  color: var(--primary);
}

.summary-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  margin-bottom: 20px;
}

.summary-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.calorie-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}

.calorie-line strong {
  font-size: 32px;
  font-weight: 800;
  color: var(--text);
}

.calorie-line span {
  font-size: 14px;
  color: var(--text-secondary);
}

.range-text {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  display: block;
}

.good-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
}

.macro-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-left: 16px;
  border-left: 1px solid rgba(132, 149, 171, 0.08);
}

.macro-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.macro-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.macro-meta b {
  color: var(--text);
  font-weight: 700;
}

.macro-track {
  height: 5px;
  background: rgba(156, 142, 132, 0.12);
  border-radius: 3px;
  overflow: hidden;
}

.macro-track i {
  display: block;
  height: 100%;
  border-radius: 3px;
}

.section-divider {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 24px 0 16px 0;
}

.section-label {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.section-tip {
  font-size: 12px;
  color: var(--text-secondary);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.quick-card:active {
  transform: scale(0.95);
}

.quick-card.disabled {
  opacity: 0.58;
  cursor: not-allowed;
  box-shadow: none;
}

.soft-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.camera-icon {
  color: var(--primary);
  background: var(--primary-soft);
}

.scan-icon {
  color: var(--protein);
  background: var(--protein-soft);
}

.edit-icon {
  color: var(--fat);
  background: var(--fat-soft);
}

.quick-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.quick-sub {
  font-size: 12px;
  color: var(--text-secondary);
}

.food-heading {
  margin-top: 24px;
}

.empty-state {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.food-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.food-card {
  display: grid;
  grid-template-columns: 60px 1fr auto 30px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  min-height: 80px;
  cursor: pointer;
}

.food-thumb {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  color: white;
  overflow: hidden;
  background: #ddd;
}

.food-thumb.thumb-custom {
  background: linear-gradient(135deg, var(--primary), var(--protein));
}

.food-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.food-info strong {
  font-size: 15px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.food-info span {
  font-size: 12px;
  color: var(--text-secondary);
}

.food-info em {
  display: inline-block;
  width: fit-content;
  padding: 2px 8px;
  margin-top: 4px;
  border-radius: 6px;
  font-style: normal;
  font-size: 11px;
  font-weight: 600;
}

.tag-green {
  color: var(--primary);
  background: var(--primary-soft);
}

.tag-blue {
  color: var(--blue);
  background: var(--blue-soft);
}

.tag-purple {
  color: var(--purple);
  background: var(--purple-soft);
}

.food-calorie {
  text-align: right;
  min-width: 60px;
}

.food-calorie div {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 4px;
}

.food-calorie strong {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
}

.food-calorie span {
  font-size: 12px;
  color: var(--text-secondary);
}

.food-calorie small {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.more-button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
}

.fab {
  position: fixed;
  right: max(24px, calc((100vw - 460px) / 2 + 24px));
  bottom: calc(74px + var(--safe-bottom));
  z-index: 22;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-strong) 100%);
  border: none;
  color: white;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(45, 106, 79, 0.28);
  transition: all 0.2s ease;
}

.fab:active {
  transform: scale(0.92);
}

.weight-popup,
.detail-popup {
  padding: 24px 20px 28px;
}

.weight-popup h3,
.detail-popup h3 {
  margin-bottom: 18px;
  font-size: 18px;
  text-align: center;
  color: var(--text);
}

.selected-food {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  padding: 12px 0;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.selected-food span:first-child {
  color: var(--text);
  font-weight: 700;
}

.calc-result {
  margin-top: 18px;
  padding: 12px;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 12px;
  font-size: 13px;
  text-align: center;
}

.detail-time {
  text-align: center;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.detail-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-grid div {
  background: var(--primary-soft);
  border-radius: 10px;
  padding: 10px;
}

.detail-grid span {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
}

.detail-grid strong {
  display: block;
  margin-top: 4px;
  font-size: 14px;
  color: var(--text);
}

.detail-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

.search-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.custom-food-section {
  padding: 0 16px 24px;
  border-top: 1px solid var(--border);
  margin-top: 12px;
}

.custom-food-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.custom-food-divider::before,
.custom-food-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
  margin: 0 12px;
}

.add-custom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px;
  background: var(--primary-soft);
  border: 1px dashed var(--primary);
  border-radius: var(--radius);
  color: var(--primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-custom-btn:active {
  background: var(--primary);
  color: #fff;
}

.custom-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.custom-form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

@media (max-width: 390px) {
  .quick-grid {
    gap: 8px;
  }

  .food-card {
    grid-template-columns: 50px 1fr auto;
  }

  .food-thumb {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .more-button {
    display: none;
  }
}
</style>
