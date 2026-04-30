import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import type { FoodItem, FoodCategory } from '@/types'
import { builtInFoods } from '@/data/foodDatabase'

export const useFoodStore = defineStore('food', () => {
  const builtIn = ref<FoodItem[]>([...builtInFoods])
  const customFoods = ref<FoodItem[]>([])
  const loading = ref(false)

  const allFoods = computed(() => [...builtIn.value, ...customFoods.value])

  async function loadCustomFoods() {
    customFoods.value = await db.customFoods.toArray()
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
    const id = crypto.randomUUID()
    const newFood: FoodItem = { ...food, id, category: 'custom' }
    await db.customFoods.add(newFood)
    customFoods.value.push(newFood)
    return newFood
  }

  async function deleteCustomFood(id: string) {
    await db.customFoods.where('id').equals(id).delete()
    customFoods.value = customFoods.value.filter(f => f.id !== id)
  }

  async function updateCustomFood(id: string, data: Partial<FoodItem>) {
    await db.customFoods.where('id').equals(id).modify(data)
    const idx = customFoods.value.findIndex(f => f.id === id)
    if (idx > -1) {
      customFoods.value[idx] = { ...customFoods.value[idx], ...data }
    }
  }

  return { builtIn, customFoods, allFoods, loading, loadCustomFoods, searchFoods, addCustomFood, deleteCustomFood, updateCustomFood }
})
