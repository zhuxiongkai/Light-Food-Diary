import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type { UserSettings } from '@/types'
import {
  calculateAbsorptionCoefficient,
  calculateBmi,
  calculateDailyCalorieTarget,
  calculateTdee,
  type CalorieTargetProfile,
} from '@/utils/personalizedCalories'

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
  activityLevel: 'sedentary',
  calorieGoalMode: 'maintain',
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({ ...DEFAULT_SETTINGS })
  const loaded = ref(false)

  const calorieProfile = computed<CalorieTargetProfile>(() => ({
    gender: settings.value.gender,
    weight: settings.value.weight,
    height: settings.value.height,
    age: settings.value.age,
    activityLevel: settings.value.activityLevel,
    calorieGoalMode: settings.value.calorieGoalMode,
  }))

  const recommendedDailyCalorieGoal = computed(() => calculateDailyCalorieTarget(calorieProfile.value))
  const tdee = computed(() => calculateTdee(calorieProfile.value))
  const bmi = computed(() => calculateBmi(settings.value))
  const absorptionCoefficient = computed(() => calculateAbsorptionCoefficient(settings.value))

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
      activityLevel: res.data.activityLevel ?? DEFAULT_SETTINGS.activityLevel,
      calorieGoalMode: res.data.calorieGoalMode ?? DEFAULT_SETTINGS.calorieGoalMode,
    })
    loaded.value = true
  }

  async function saveSettings(data: Partial<UserSettings>) {
    const nextSettings = { ...settings.value, ...data }
    const shouldRecalculateGoal = [
      'height',
      'weight',
      'age',
      'gender',
      'activityLevel',
      'calorieGoalMode',
    ].some((key) => key in data)
    const payload = {
      ...data,
      ...(shouldRecalculateGoal ? { dailyCalorieGoal: calculateDailyCalorieTarget(nextSettings) } : {}),
    }

    await api('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    Object.assign(settings.value, payload)
  }

  return {
    settings,
    loaded,
    recommendedDailyCalorieGoal,
    tdee,
    bmi,
    absorptionCoefficient,
    loadSettings,
    saveSettings,
  }
})
