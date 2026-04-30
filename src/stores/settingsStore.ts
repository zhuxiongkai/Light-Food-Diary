import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
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
  weightGoal: 60
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({ ...DEFAULT_SETTINGS })
  const apiKey = ref<string>(localStorage.getItem('ai_api_key') || '')
  const loaded = ref(false)

  async function loadSettings() {
    const rows = await db.userSettings.toArray()
    if (rows.length > 0) {
      settings.value = { ...DEFAULT_SETTINGS, ...rows[0] }
    } else {
      await db.userSettings.add({ ...DEFAULT_SETTINGS })
    }
    loaded.value = true
  }

  async function saveSettings(data: Partial<UserSettings>) {
    Object.assign(settings.value, data)
    await db.userSettings.update(1, data)
  }

  function setApiKey(key: string) {
    apiKey.value = key
    localStorage.setItem('ai_api_key', key)
  }

  return { settings, apiKey, loaded, loadSettings, saveSettings, setApiKey }
})
