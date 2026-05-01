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
    </div>

    <!-- Image area -->
    <div class="card text-center">
      <div class="image-area" v-if="imageSrc">
        <img :src="imageSrc" class="preview-img" />
        <van-button size="small" plain class="mt-8" @click="imageSrc = ''">重新选择</van-button>
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
            <span class="result-meta text-secondary">
              蛋白质 {{ getItemProtein(item) }}g · 脂肪 {{ getItemFat(item) }}g · 碳水 {{ getItemCarbs(item) }}g
            </span>
            <span v-if="item.matchedFoodName" class="match-tip">已匹配食物库：{{ item.matchedFoodName }}</span>
            <span v-else class="estimate-tip">未匹配食物库，三大营养素按估算值记录</span>
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

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden-input" @change="onFilePicked" />

    <!-- Hidden camera stream -->
    <van-dialog v-model:show="showCamera" title="拍照" @closed="stopCamera">
      <video ref="videoEl" autoplay playsinline class="camera-video" />
      <div class="camera-actions">
        <van-button type="primary" @click="capturePhoto">拍摄</van-button>
        <van-button plain @click="showCamera = false">取消</van-button>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button, Checkbox, CheckboxGroup, Dialog, Icon, Loading, Stepper, showToast } from 'vant'
import { useMealStore } from '@/stores/mealStore'
import { useFoodStore } from '@/stores/foodStore'
import { analyzeFoodImage } from '@/utils/aiService'
import type { AiRecognitionResult, MealType } from '@/types'

interface EnrichedRecognition extends AiRecognitionResult {
  matchedFoodId: number
  matchedFoodName: string
  estimated: boolean
  macroPer100g: {
    protein: number
    fat: number
    carbs: number
  }
}

const mealStore = useMealStore()
const foodStore = useFoodStore()

const imageSrc = ref('')
const imageBase64 = ref('')
const imageType = ref('image/jpeg')
const analyzing = ref(false)
const results = ref<EnrichedRecognition[]>([])
const fileInput = ref<HTMLInputElement>()
const videoEl = ref<HTMLVideoElement>()
const showCamera = ref(false)
const showPickDialog = ref(false)
const candidateResults = ref<AiRecognitionResult[]>([])
const pickedIndexes = ref<number[]>([])
const selectedMealType = ref<MealType>('lunch')
let mediaStream: MediaStream | null = null

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

async function onTakePhoto() {
  showCamera.value = true
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    if (videoEl.value) {
      videoEl.value.srcObject = mediaStream
    }
  } catch {
    showToast('无法访问摄像头，请使用相册')
    showCamera.value = false
  }
}

function capturePhoto() {
  if (!videoEl.value) return
  const canvas = document.createElement('canvas')
  canvas.width = videoEl.value.videoWidth
  canvas.height = videoEl.value.videoHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(videoEl.value, 0, 0)
  imageSrc.value = canvas.toDataURL('image/jpeg')
  imageBase64.value = canvas.toDataURL('image/jpeg').split(',')[1]
  imageType.value = 'image/jpeg'
  showCamera.value = false
  stopCamera()
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
}

function onPickFile() {
  fileInput.value?.click()
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
    results.value = []
    candidateResults.value = res
    pickedIndexes.value = res.map((_, i) => i)
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
    return {
      ...item,
      matchedFoodId: Number(matched.id) || 0,
      matchedFoodName: matched.name,
      estimated: false,
      macroPer100g: {
        protein: matched.protein,
        fat: matched.fat,
        carbs: matched.carbs,
      },
      estimatedCalories: matched.caloriesPer100g,
    }
  }

  return {
    ...item,
    matchedFoodId: 0,
    matchedFoodName: '',
    estimated: true,
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
  const today = mealStore.todayStr()
  for (const item of results.value) {
    await mealStore.addMeal({
      date: today,
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
  results.value = []
  imageSrc.value = ''
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
  color: #b66a2e;
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
