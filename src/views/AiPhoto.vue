<template>
  <div class="page">
    <div class="page-header">AI拍照估算</div>

    <div class="meal-type-card card">
      <div class="section-title mb-12">添加餐别</div>
      <div class="meal-type-switch">
        <button
          v-for="tab in mealTabs"
          :key="tab.value"
          type="button"
          class="meal-type-btn"
          :class="{ active: selectedMealType === tab.value }"
          @click="selectedMealType = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
      <p class="target-date">记录日期：{{ displaySelectedDate }}</p>
    </div>

    <!-- Image area -->
    <div class="card text-center">
      <div class="image-area" v-if="imageSrc">
        <img :src="imageSrc" class="preview-img" />
        <van-button style="margin-top: 10px;" size="small" plain class="mt-8" @click="clearImage">重新选择</van-button>
      </div>
      <div v-else class="image-placeholder">
        <van-icon name="photograph" size="48" color="#ccc" />
        <p class="text-secondary mt-8">拍照或选择食物照片进行AI识别</p>
        <div class="img-actions mt-12">
          <van-button type="primary" @click="onTakePhoto">拍照</van-button>
          <van-button plain type="primary" @click="onPickFile">相册</van-button>
        </div>
      </div>
    </div>

    <!-- Analyze button -->
    <div class="card text-center" v-if="imageSrc && !analyzing && results.length === 0">
      <van-button type="primary" size="large" round block :loading="analyzing" @click="onAnalyze">
        开始识别
      </van-button>
    </div>

    <!-- Analyzing indicator -->
    <div class="card text-center" v-if="analyzing">
      <van-loading type="spinner" size="32" />
      <p class="mt-8">AI正在识别食物...</p>
    </div>

    <!-- Results -->
    <div class="card" v-if="results.length > 0">
      <div class="section-title mb-12">识别结果</div>
      <div v-for="(item, i) in results" :key="i" class="result-item">
        <div class="result-row">
          <div>
            <span class="result-name">{{ item.foodName }}</span>
            <span class="result-meta text-secondary">{{ item.estimatedWeight }}g · {{ getItemCalories(item) }} kcal</span>
            <span class="result-meta text-secondary">标准份量：1{{ item.servingUnit }}约 {{ item.defaultServingWeight }}g</span>
            <span class="result-meta text-secondary">
              蛋白质 {{ getItemProtein(item) }}g · 脂肪 {{ getItemFat(item) }}g · 碳水 {{ getItemCarbs(item) }}g
            </span>
            <span v-if="item.matchedFoodName" class="match-tip">已匹配食物库：{{ item.matchedFoodName }}</span>
            <span v-else class="estimate-tip">未匹配食物库，三大营养素按估算值记录</span>
            <div class="portion-controls" aria-label="份量快捷选择">
              <button
                v-for="option in item.servingOptions"
                :key="`${item.foodName}-${option.label}`"
                type="button"
                class="portion-btn"
                :class="{ active: isServingOptionActive(item, option.weight) }"
                @click="applyServingOption(i, option.weight)"
              >
                <span>{{ option.label }}</span>
                <small>{{ option.weight }}g</small>
              </button>
            </div>
          </div>
          <div class="flex-row">
            <van-stepper v-model="results[i].estimatedWeight" :min="10" :max="2000" :step="10" input-width="60px" />
            <van-icon name="delete-o" class="del-btn" @click="results.splice(i, 1)" />
          </div>
        </div>
      </div>

      <div class="result-total mt-16">
        <span>合计: {{ totalResultCal }} kcal</span>
      </div>

      <van-button type="primary" block round class="mt-12" @click="onAddAll">
        添加到{{ mealLabelMap[selectedMealType] }}
      </van-button>
    </div>

    <van-dialog
      v-model:show="showPickDialog"
      title="请选择要记录的菜品"
      show-cancel-button
      confirm-button-text="确认"
      cancel-button-text="取消"
      @confirm="onConfirmPick"
    >
      <div class="pick-dialog">
        <van-checkbox-group v-model="pickedIndexes">
          <div v-for="(item, i) in candidateResults" :key="`${item.foodName}-${i}`" class="pick-option">
            <van-checkbox :name="i">
              {{ item.foodName }}（{{ item.estimatedCalories }} kcal/100g）
            </van-checkbox>
          </div>
        </van-checkbox-group>
      </div>
    </van-dialog>

    <!-- Hidden file inputs (web fallback) -->
    <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden-input" @change="onFilePicked" />
    <input ref="galleryInput" type="file" accept="image/*" class="hidden-input" @change="onFilePicked" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Button, Checkbox, CheckboxGroup, Dialog, Icon, Loading, Stepper, showToast } from 'vant'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { useMealStore } from '@/stores/mealStore'
import { useFoodStore } from '@/stores/foodStore'
import { analyzeFoodImage } from '@/utils/aiService'
import { getServingProfile, type ServingOption, type ServingUnit } from '@/utils/servingSize'
import type { AiRecognitionResult, MealType } from '@/types'

interface EnrichedRecognition extends AiRecognitionResult {
  matchedFoodId: number
  matchedFoodName: string
  estimated: boolean
  defaultServingWeight: number
  servingUnit: ServingUnit
  servingOptions: ServingOption[]
  macroPer100g: {
    protein: number
    fat: number
    carbs: number
  }
}

const mealStore = useMealStore()
const foodStore = useFoodStore()
const route = useRoute()

const imageSrc = ref('')
const imageBase64 = ref('')
const imageType = ref('image/jpeg')
const analyzing = ref(false)
const results = ref<EnrichedRecognition[]>([])
const cameraInput = ref<HTMLInputElement>()
const galleryInput = ref<HTMLInputElement>()
const showPickDialog = ref(false)
const candidateResults = ref<AiRecognitionResult[]>([])
const pickedIndexes = ref<number[]>([])
const selectedMealType = ref<MealType>(resolveRouteMeal(route.query.meal) || 'lunch')
const selectedDate = ref(resolveRouteDate(route.query.date) || mealStore.todayStr())

const mealTabs: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '加餐' },
]

const mealLabelMap: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

const totalResultCal = computed(() =>
  results.value.reduce((sum, item) => sum + getItemCalories(item), 0)
)
const displaySelectedDate = computed(() => {
  const date = new Date(`${selectedDate.value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return selectedDate.value
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
})

onMounted(async () => {
  if (foodStore.allFoods.length === 0) {
    await foodStore.loadAllFoods().catch(() => undefined)
  }
})

function getItemCalories(item: AiRecognitionResult) {
  return Math.round(item.estimatedCalories * item.estimatedWeight / 100)
}

function getItemProtein(item: EnrichedRecognition) {
  return Math.round(item.macroPer100g.protein * item.estimatedWeight) / 100
}

function getItemFat(item: EnrichedRecognition) {
  return Math.round(item.macroPer100g.fat * item.estimatedWeight) / 100
}

function getItemCarbs(item: EnrichedRecognition) {
  return Math.round(item.macroPer100g.carbs * item.estimatedWeight) / 100
}

function isServingOptionActive(item: EnrichedRecognition, weight: number) {
  return Math.round(item.estimatedWeight) === weight
}

function applyServingOption(index: number, weight: number) {
  if (!results.value[index]) return
  results.value[index].estimatedWeight = weight
}

function resolveRouteMeal(value: unknown): MealType | null {
  if (typeof value !== 'string') return null
  return ['breakfast', 'lunch', 'dinner', 'snack'].includes(value) ? (value as MealType) : null
}

function resolveRouteDate(value: unknown) {
  if (typeof value !== 'string') return null
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function clearRecognitionState() {
  results.value = []
  candidateResults.value = []
  pickedIndexes.value = []
  showPickDialog.value = false
}

function clearImage() {
  imageSrc.value = ''
  imageBase64.value = ''
  imageType.value = 'image/jpeg'
  clearRecognitionState()
}

async function onTakePhoto() {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        quality: 80,
      })
      applyCapacitorPhoto(photo)
    } catch (e: any) {
      if (!isCancelledError(e)) {
        showToast('无法访问摄像头，请检查权限')
      }
    }
  } else {
    cameraInput.value?.click()
  }
}

function onPickFile() {
  if (Capacitor.isNativePlatform()) {
    Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      quality: 80,
    }).then((photo) => {
      applyCapacitorPhoto(photo)
    }).catch((e: any) => {
      if (!isCancelledError(e)) {
        showToast('无法访问相册，请检查权限')
      }
    })
  } else {
    galleryInput.value?.click()
  }
}

function applyCapacitorPhoto(photo: Awaited<ReturnType<typeof Camera.getPhoto>>) {
  clearRecognitionState()
  const base64 = photo.base64String ?? ''
  const format = photo.format ?? 'jpeg'
  const mimeType = `image/${format}`
  imageBase64.value = base64
  imageType.value = mimeType
  imageSrc.value = `data:${mimeType};base64,${base64}`
}

function isCancelledError(e: unknown): boolean {
  if (typeof e === 'string') return e.toLowerCase().includes('cancel')
  if (e instanceof Error) return e.message.toLowerCase().includes('cancel')
  return false
}

function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片过大，请选择 5MB 以内图片')
    input.value = ''
    return
  }
  clearRecognitionState()
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    imageSrc.value = dataUrl
    imageBase64.value = dataUrl.split(',')[1]
    imageType.value = file.type || 'image/jpeg'
  }
  reader.readAsDataURL(file)
  input.value = ''
}

async function onAnalyze() {
  if (!imageBase64.value) return
  analyzing.value = true
  try {
    const res = await analyzeFoodImage(imageBase64.value, imageType.value)
    const filtered = res.filter((item) => item.confidence >= 0.1)
    results.value = []
    candidateResults.value = filtered
    pickedIndexes.value = filtered.map((_, i) => i)
    showPickDialog.value = true
  } catch (e: any) {
    showToast(e.message || '识别失败，请重试')
  } finally {
    analyzing.value = false
  }
}

function onConfirmPick() {
  if (pickedIndexes.value.length === 0) {
    showToast('请至少选择一个菜品')
    showPickDialog.value = true
    return
  }

  results.value = pickedIndexes.value
    .map((i) => candidateResults.value[i])
    .filter((item): item is AiRecognitionResult => !!item)
    .map(enrichRecognition)

  if (results.value.length === 0) {
    showToast('未选中有效菜品，请重试')
    return
  }

  const estimatedCount = results.value.filter((item) => item.estimated).length
  if (estimatedCount > 0) {
    showToast(`已选择 ${results.value.length} 项，其中 ${estimatedCount} 项为估算营养`) 
    return
  }

  showToast(`已选择 ${results.value.length} 项`)
}

function enrichRecognition(item: AiRecognitionResult): EnrichedRecognition {
  const matched = findFoodMatch(item.foodName)
  if (matched) {
    const servingProfile = getServingProfile(matched)
    return {
      ...item,
      estimatedWeight: servingProfile.defaultServingWeight,
      matchedFoodId: Number(matched.id) || 0,
      matchedFoodName: matched.name,
      estimated: false,
      ...servingProfile,
      macroPer100g: {
        protein: matched.protein,
        fat: matched.fat,
        carbs: matched.carbs,
      },
      estimatedCalories: matched.caloriesPer100g,
    }
  }

  const servingProfile = getServingProfile({ name: item.foodName, category: 'custom' })
  return {
    ...item,
    estimatedWeight: servingProfile.defaultServingWeight,
    matchedFoodId: 0,
    matchedFoodName: '',
    estimated: true,
    ...servingProfile,
    macroPer100g: {
      protein: 0,
      fat: 0,
      carbs: 0,
    }
  }
}

function findFoodMatch(foodName: string) {
  const normalized = normalizeName(foodName)
  if (!normalized) return null

  const exact = foodStore.allFoods.find((food) => normalizeName(food.name) === normalized)
  if (exact) return exact

  const fuzzy = foodStore.allFoods.find((food) => {
    const name = normalizeName(food.name)
    return name.includes(normalized) || normalized.includes(name)
  })

  return fuzzy || null
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s·,，。！!？?()（）\-_/]/g, '')
    .trim()
}

async function onAddAll() {
  for (const item of results.value) {
    await mealStore.addMeal({
      date: selectedDate.value,
      mealType: selectedMealType.value,
      foodId: item.matchedFoodId,
      foodName: item.estimated ? `${item.foodName}（估算）` : item.foodName,
      weight: item.estimatedWeight,
      calories: getItemCalories(item),
      protein: getItemProtein(item),
      fat: getItemFat(item),
      carbs: getItemCarbs(item)
    })
  }
  showToast(`已添加 ${results.value.length} 项到${mealLabelMap[selectedMealType.value]}`)
  clearImage()
}
</script>

<style scoped>
.meal-type-card {
  margin-top: 0;
}

.meal-type-switch {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.meal-type-btn {
  border: 1px solid var(--border);
  border-radius: 10px;
  height: 36px;
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 13px;
}

.meal-type-btn.active {
  background: var(--primary-soft);
  color: var(--primary);
  border-color: transparent;
  font-weight: 600;
}

.target-date {
  margin: 10px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: center;
}

.image-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.preview-img {
  max-width: 100%;
  max-height: 260px;
  border-radius: 8px;
  object-fit: contain;
}
.image-placeholder {
  padding: 40px 16px;
}
.img-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.result-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.result-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.result-name {
  font-size: 15px;
  font-weight: 500;
  display: block;
}
.result-meta {
  font-size: 12px;
  display: block;
}

.portion-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-top: 10px;
  max-width: 260px;
}

.portion-btn {
  min-width: 0;
  min-height: 44px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.2;
}

.portion-btn span,
.portion-btn small {
  display: block;
}

.portion-btn small {
  margin-top: 3px;
  font-size: 10px;
  color: inherit;
}

.portion-btn.active {
  border-color: transparent;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}

.match-tip,
.estimate-tip {
  display: inline-block;
  margin-top: 6px;
  font-size: 11px;
}

.match-tip {
  color: var(--primary);
}

.estimate-tip {
  color: var(--orange);
}

.result-total {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
}
.del-btn { color: var(--danger); font-size: 18px; margin-left: 12px; }
.hidden-input { display: none; }
.camera-video {
  width: 100%;
  max-height: 60vh;
  object-fit: cover;
  background: #000;
}
.camera-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px;
}

.pick-dialog {
  max-height: 48vh;
  overflow-y: auto;
  padding: 10px 16px 2px;
}

.pick-option {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.pick-option:last-child {
  border-bottom: none;
}
</style>
