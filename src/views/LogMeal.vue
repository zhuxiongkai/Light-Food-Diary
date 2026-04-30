<template>
  <div class="page">
    <div class="page-header flex-between">
      <span>记录饮食</span>
      <span class="date-display" @click="showDatePicker = true">{{ displayDate }}</span>
    </div>

    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab v-for="t in mealTabs" :key="t.value" :title="t.label" />
    </van-tabs>

    <MealCard
      v-for="t in mealTabs"
      :key="t.value"
      v-show="activeTab === mealTabs.indexOf(t)"
      :type="t.value"
      :items="mealStore.getMealsByType(t.value)"
      :editable="true"
      @delete="onDeleteMeal"
    />

    <div class="add-section mt-16">
      <van-button type="primary" block round @click="showSearch = true">
        + 添加食物
      </van-button>
    </div>

    <van-popup v-model:show="showSearch" position="bottom" :style="{ height: '75%' }" round>
      <FoodSearch @select="onFoodSelect" />
    </van-popup>

    <van-popup v-model:show="showWeight" position="bottom" round>
      <div class="weight-popup">
        <h3 class="weight-title">输入重量</h3>
        <div class="selected-food" v-if="selectedFood">
          <span>{{ selectedFood.name }}</span>
          <span class="text-secondary">{{ selectedFood.caloriesPer100g }} kcal/100g</span>
        </div>
        <van-stepper v-model="weight" :min="1" :max="2000" :step="10" input-width="80px" />
        <div class="calc-result" v-if="weight > 0 && selectedFood">
          热量: {{ calcCalories }} kcal | 蛋白质: {{ calcProtein }}g | 脂肪: {{ calcFat }}g | 碳水: {{ calcCarbs }}g
        </div>
        <van-button type="primary" block round class="mt-16" @click="onConfirmAdd" :disabled="!selectedFood || weight <= 0">
          确认添加
        </van-button>
      </div>
    </van-popup>

    <!-- Day total -->
    <div class="day-total card">
      <div class="flex-between mb-8">
        <span class="total-label">当日总计</span>
        <span class="total-cal numeric">{{ mealStore.dailyCalories }} kcal</span>
      </div>
      <div class="total-macros flex-between">
        <span>蛋白质 {{ mealStore.dailyProtein }}g</span>
        <span>脂肪 {{ mealStore.dailyFat }}g</span>
        <span>碳水 {{ mealStore.dailyCarbs }}g</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Tabs, Tab, Button, Popup, Stepper, showToast, showConfirmDialog } from 'vant'
import { useMealStore } from '@/stores/mealStore'
import { useFoodStore } from '@/stores/foodStore'
import { MEAL_TYPE_LABELS, type MealType, type MealRecord, type FoodItem } from '@/types'
import FoodSearch from '@/components/FoodSearch.vue'
import MealCard from '@/components/MealCard.vue'

const mealStore = useMealStore()
const foodStore = useFoodStore()

const activeTab = ref(0)
const showSearch = ref(false)
const showWeight = ref(false)
const showDatePicker = ref(false)
const selectedFood = ref<FoodItem | null>(null)
const weight = ref(100)
const currentDate = ref(mealStore.todayStr())

const mealTabs = computed(() =>
  (Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]).map(([value, label]) => ({ value, label }))
)

const displayDate = computed(() => {
  if (currentDate.value === mealStore.todayStr()) return '今天'
  return currentDate.value
})

const calcCalories = computed(() =>
  selectedFood.value ? Math.round(selectedFood.value.caloriesPer100g * weight.value / 100) : 0
)
const calcProtein = computed(() =>
  selectedFood.value ? Math.round(selectedFood.value.protein * weight.value / 100 * 10) / 10 : 0
)
const calcFat = computed(() =>
  selectedFood.value ? Math.round(selectedFood.value.fat * weight.value / 100 * 10) / 10 : 0
)
const calcCarbs = computed(() =>
  selectedFood.value ? Math.round(selectedFood.value.carbs * weight.value / 100 * 10) / 10 : 0
)

onMounted(async () => {
  await Promise.all([mealStore.loadMeals(), foodStore.loadCustomFoods()])
})

function onTabChange() {}

function onFoodSelect(food: FoodItem) {
  selectedFood.value = food
  weight.value = 100
  showSearch.value = false
  showWeight.value = true
}

async function onConfirmAdd() {
  if (!selectedFood.value) return
  const currentType = mealTabs.value[activeTab.value].value
  await mealStore.addMeal({
    date: currentDate.value,
    mealType: currentType,
    foodId: selectedFood.value.id,
    foodName: selectedFood.value.name,
    weight: weight.value,
    calories: calcCalories.value,
    protein: calcProtein.value,
    fat: calcFat.value,
    carbs: calcCarbs.value
  })
  showWeight.value = false
  selectedFood.value = null
  weight.value = 100
  showToast('已添加')
}

async function onDeleteMeal(item: MealRecord) {
  try {
    await showConfirmDialog({ title: '确认删除', message: `删除 ${item.foodName} 的记录？` })
    if (item.id) await mealStore.deleteMeal(item.id)
    showToast('已删除')
  } catch { /* cancelled */ }
}
</script>

<style scoped>
.date-display {
  font-size: 14px;
  color: var(--primary);
  cursor: pointer;
}
.add-section {
  padding: 0 16px;
}
.weight-popup {
  padding: 24px 20px;
  min-height: 200px;
}
.weight-title {
  font-size: 18px;
  margin-bottom: 16px;
  text-align: center;
}
.selected-food {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}
.calc-result {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9eb;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  color: var(--text);
}
.day-total {
  margin-bottom: 24px;
}
.total-label {
  font-size: 16px;
  font-weight: 600;
}
.total-cal {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary);
}
.total-macros {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
