import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import type { FoodItem, FoodCategory } from '@/types'

export interface ApiFood {
  id: number
  name: string
  category: string
  caloriesPer100g: number
  protein: number
  fat: number
  carbs: number
  isBuiltin: boolean
}

function toFoodItem(f: ApiFood): FoodItem {
  return {
    id: f.id,
    name: f.name,
    category: f.category as FoodCategory,
    caloriesPer100g: f.caloriesPer100g,
    protein: f.protein,
    fat: f.fat,
    carbs: f.carbs,
  }
}

export const useFoodStore = defineStore('food', () => {
  const customFoods = ref<FoodItem[]>([])
  const loading = ref(false)

  // Cache all foods (built-in + custom)
  const foodCache = ref<FoodItem[]>([])

  const allFoods = computed(() => foodCache.value)

  async function loadAllFoods() {
    loading.value = true
    try {
      const res = await api<ApiFood[]>('/foods')
      foodCache.value = res.data.map(toFoodItem)
      customFoods.value = res.data
        .filter(f => !f.isBuiltin)
        .map(toFoodItem)
    } finally {
      loading.value = false
    }
  }

  function searchFoods(keyword: string, category?: FoodCategory): FoodItem[] {
    let list = allFoods.value
    if (category) {
      list = list.filter(f => f.category === category)
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(f => f.name.toLowerCase().includes(kw))
    }
    return list
  }

  async function addCustomFood(food: Omit<FoodItem, 'id'>) {
    const res = await api<ApiFood>('/foods/custom', {
      method: 'POST',
      body: JSON.stringify(food),
    })
    const newFood = toFoodItem(res.data)
    customFoods.value.push(newFood)
    foodCache.value.push(newFood)
    return newFood
  }

  async function deleteCustomFood(id: number | string) {
    await api(`/foods/custom/${id}`, { method: 'DELETE' })
    customFoods.value = customFoods.value.filter(f => f.id !== id)
    foodCache.value = foodCache.value.filter(f => f.id !== id)
  }

  async function updateCustomFood(id: number | string, data: Partial<FoodItem>) {
    const apiData: Record<string, any> = {}
    if (data.name !== undefined) apiData.name = data.name
    if (data.caloriesPer100g !== undefined) apiData.caloriesPer100g = data.caloriesPer100g
    if (data.protein !== undefined) apiData.protein = data.protein
    if (data.fat !== undefined) apiData.fat = data.fat
    if (data.carbs !== undefined) apiData.carbs = data.carbs

    await api(`/foods/custom/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiData),
    })
    const idx = customFoods.value.findIndex(f => f.id === id)
    if (idx > -1) {
      customFoods.value[idx] = { ...customFoods.value[idx], ...data }
    }
    const cacheIdx = foodCache.value.findIndex(f => f.id === id)
    if (cacheIdx > -1) {
      foodCache.value[cacheIdx] = { ...foodCache.value[cacheIdx], ...data }
    }
  }

  return {
    customFoods, allFoods, loading, loadAllFoods, searchFoods,
    addCustomFood, deleteCustomFood, updateCustomFood
  }
})
