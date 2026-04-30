import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import type { MealRecord, MealType } from '@/types'

export const useMealStore = defineStore('meal', () => {
  const meals = ref<MealRecord[]>([])
  const loading = ref(false)

  // Get today's date as YYYY-MM-DD
  function todayStr() {
    return new Date().toISOString().slice(0, 10)
  }

  async function loadMeals(date?: string) {
    loading.value = true
    const d = date || todayStr()
    meals.value = await db.meals.where('date').equals(d).toArray()
    loading.value = false
  }

  const dailyCalories = computed(() => meals.value.reduce((sum, m) => sum + m.calories, 0))
  const dailyProtein = computed(() => meals.value.reduce((sum, m) => sum + m.protein, 0))
  const dailyFat = computed(() => meals.value.reduce((sum, m) => sum + m.fat, 0))
  const dailyCarbs = computed(() => meals.value.reduce((sum, m) => sum + m.carbs, 0))

  function getMealsByType(type: MealType): MealRecord[] {
    return meals.value.filter(m => m.mealType === type)
  }

  function caloriesByType(type: MealType): number {
    return getMealsByType(type).reduce((sum, m) => sum + m.calories, 0)
  }

  async function addMeal(meal: Omit<MealRecord, 'id' | 'createdAt'>) {
    const record: MealRecord = { ...meal, createdAt: Date.now() }
    const id = await db.meals.add(record)
    meals.value.push({ ...record, id })
    return id
  }

  async function deleteMeal(id: number) {
    await db.meals.delete(id)
    meals.value = meals.value.filter(m => m.id !== id)
  }

  async function updateMeal(id: number, data: Partial<MealRecord>) {
    await db.meals.update(id, data)
    const idx = meals.value.findIndex(m => m.id === id)
    if (idx > -1) {
      meals.value[idx] = { ...meals.value[idx], ...data }
    }
  }

  async function getMealsByDateRange(start: string, end: string): Promise<MealRecord[]> {
    return db.meals.where('date').between(start, end, true, true).toArray()
  }

  return {
    meals, loading, dailyCalories, dailyProtein, dailyFat, dailyCarbs,
    loadMeals, getMealsByType, caloriesByType, addMeal, deleteMeal, updateMeal,
    getMealsByDateRange, todayStr
  }
})
