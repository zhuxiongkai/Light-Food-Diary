import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api/client'
import type { UserSettings } from '@/types'

const DEFAULT_SETTINGS: UserSettings = {
  dailyCalorieGoal: 2000,
  proteinRatio: 20,
  fatRatio: 25,
  carbsRatio: 55,
  height: 170,
  weight: 65,
  age: 25,
  gender: 'male',
  weightGoal: 60,
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({ ...DEFAULT_SETTINGS })
  const loaded = ref(false)

  async function loadSettings() {
    const res = await api<UserSettings>('/settings')
    Object.assign(settings.value, {
      dailyCalorieGoal: res.data.dailyCalorieGoal ?? DEFAULT_SETTINGS.dailyCalorieGoal,
      proteinRatio: res.data.proteinRatio ?? DEFAULT_SETTINGS.proteinRatio,
      fatRatio: res.data.fatRatio ?? DEFAULT_SETTINGS.fatRatio,
      carbsRatio: res.data.carbsRatio ?? DEFAULT_SETTINGS.carbsRatio,
      height: res.data.height ?? DEFAULT_SETTINGS.height,
      weight: res.data.weight ?? DEFAULT_SETTINGS.weight,
      age: res.data.age ?? DEFAULT_SETTINGS.age,
      gender: res.data.gender ?? DEFAULT_SETTINGS.gender,
      weightGoal: res.data.weightGoal ?? DEFAULT_SETTINGS.weightGoal,
    })
    loaded.value = true
  }

  async function saveSettings(data: Partial<UserSettings>) {
    await api('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    Object.assign(settings.value, data)
  }

  return { settings, loaded, loadSettings, saveSettings }
})
