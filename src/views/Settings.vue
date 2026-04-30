<template>
  <div class="page">
    <div class="page-header">设置</div>

    <div class="card">
      <div class="section-title">热量与营养素目标</div>
      <van-field v-model="form.dailyCalorieGoal" type="number" label="每日热量(kcal)" />
      <van-field v-model="form.proteinRatio" type="digit" label="蛋白质比例(%)" />
      <van-field v-model="form.fatRatio" type="digit" label="脂肪比例(%)" />
      <van-field v-model="form.carbsRatio" type="digit" label="碳水比例(%)" />
      <div class="mt-8">
        <van-button type="primary" block round @click="saveGoals">保存目标</van-button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">个人信息</div>
      <van-field v-model="form.height" type="number" label="身高(cm)" />
      <van-field v-model="form.weight" type="number" label="当前体重(kg)" />
      <van-field v-model="form.age" type="number" label="年龄" />
      <van-field v-model="form.gender" label="性别" is-link readonly @click="showGenderPicker = true" />
      <van-field v-model="form.weightGoal" type="number" label="目标体重(kg)" />
      <div class="mt-8">
        <van-button type="primary" block round @click="saveProfile">保存信息</van-button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">AI API 配置</div>
      <van-field v-model="apiKeyInput" type="password" label="API Key" placeholder="输入 Claude API Key" />
      <div class="field-hint">API Key 仅存储在本地，用于 AI 拍照识别食物热量</div>
      <div class="mt-8">
        <van-button type="primary" block round @click="saveApiKey">保存 API Key</van-button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">数据管理</div>
      <van-button block round plain type="primary" class="mb-12" @click="onExportJSON">导出 JSON</van-button>
      <van-button block round plain type="primary" @click="onExportCSV">导出 CSV</van-button>
      <div class="mt-16">
        <van-button block round plain type="danger" @click="onClearData">清除所有数据</van-button>
      </div>
    </div>

    <div class="card section-title">
      <router-link to="/food-db">管理食物库 →</router-link>
    </div>

    <van-popup v-model:show="showGenderPicker" position="bottom" round>
      <van-picker :columns="genderOptions" @confirm="onGenderConfirm" @cancel="showGenderPicker = false" />
    </van-popup>

    <div style="height: 30px" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Field, Button, Popup, Picker, showToast, showConfirmDialog } from 'vant'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMealStore } from '@/stores/mealStore'
import { useWeightStore } from '@/stores/weightStore'
import { exportToJSON, exportToCSV } from '@/utils/exportService'
import { db } from '@/db'

const settingsStore = useSettingsStore()
const mealStore = useMealStore()
const weightStore = useWeightStore()

const showGenderPicker = ref(false)
const genderOptions = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' }
]
const apiKeyInput = ref('')

const form = reactive({
  dailyCalorieGoal: 2000,
  proteinRatio: 20,
  fatRatio: 25,
  carbsRatio: 55,
  height: 170,
  weight: 65,
  age: 25,
  gender: 'male' as string,
  weightGoal: 60
})

onMounted(async () => {
  await settingsStore.loadSettings()
  const s = settingsStore.settings
  Object.assign(form, s)
  apiKeyInput.value = settingsStore.apiKey
})

async function saveGoals() {
  await settingsStore.saveSettings({
    dailyCalorieGoal: +form.dailyCalorieGoal,
    proteinRatio: +form.proteinRatio,
    fatRatio: +form.fatRatio,
    carbsRatio: +form.carbsRatio
  })
  showToast('已保存')
}

async function saveProfile() {
  await settingsStore.saveSettings({
    height: +form.height,
    weight: +form.weight,
    age: +form.age,
    gender: form.gender as 'male' | 'female',
    weightGoal: +form.weightGoal
  })
  showToast('已保存')
}

function saveApiKey() {
  settingsStore.setApiKey(apiKeyInput.value)
  showToast('API Key 已保存')
}

function onGenderConfirm({ selectedOptions }: any) {
  form.gender = selectedOptions[0].value
  showGenderPicker.value = false
}

async function onExportJSON() {
  const meals = await db.meals.toArray()
  const weights = await db.weightRecords.toArray()
  exportToJSON(meals, weights)
  showToast('导出成功')
}

async function onExportCSV() {
  const meals = await db.meals.toArray()
  exportToCSV(meals)
  showToast('导出成功')
}

async function onClearData() {
  try {
    await showConfirmDialog({ title: '确认', message: '这将删除所有记录数据，不可恢复！' })
    await db.meals.clear()
    await db.weightRecords.clear()
    await db.customFoods.clear()
    showToast('已清除')
  } catch { /* cancelled */ }
}
</script>

<style scoped>
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.field-hint { font-size: 12px; color: var(--text-secondary); padding: 4px 16px 0; }
a { color: var(--primary); text-decoration: none; }
</style>
