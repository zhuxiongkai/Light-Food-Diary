import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import type { MealRecord, MealType } from '@/types'

export const useMealStore = defineStore('meal', () => {
  const meals = ref<MealRecord[]>([])
  const loading = ref(false)

  function todayStr() {
    const date = new Date()
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  async function loadMeals(date?: string) {
    loading.value = true
    try {
      const d = date || todayStr()
      const res = await api<MealRecord[]>(`/meals?date=${d}`)
      meals.value = res.data
    } finally {
      loading.value = false
    }
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
    const res = await api<MealRecord>('/meals', {
      method: 'POST',
      body: JSON.stringify(meal),
    })
    meals.value.push(res.data)
    return res.data.id!
  }

  async function deleteMeal(id: number) {
    await api(`/meals/${id}`, { method: 'DELETE' })
    meals.value = meals.value.filter(m => m.id !== id)
  }

  async function updateMeal(id: number, data: Partial<MealRecord>) {
    await api(`/meals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    const idx = meals.value.findIndex(m => m.id === id)
    if (idx > -1) {
      meals.value[idx] = { ...meals.value[idx], ...data }
    }
  }

  async function getMealsByDateRange(start: string, end: string): Promise<MealRecord[]> {
    const res = await api<MealRecord[]>(`/meals/range?start=${start}&end=${end}`)
    return res.data
  }

  return {
    meals, loading, dailyCalories, dailyProtein, dailyFat, dailyCarbs,
    loadMeals, getMealsByType, caloriesByType, addMeal, deleteMeal, updateMeal,
    getMealsByDateRange, todayStr
  }
})
