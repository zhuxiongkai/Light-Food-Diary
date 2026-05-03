<template>
  <div class="page ai-photo-page">
    <header class="ai-header">
      <h1>拍照估算</h1>
      <p>拍下食物，确认份量后记录</p>
    </header>

    <section class="ai-card meal-type-card">
      <h2>这餐记到</h2>
      <div class="meal-type-switch" role="tablist" aria-label="餐别">
        <button
          v-for="tab in mealTabs"
          :key="tab.value"
          type="button"
          class="meal-type-btn"
          :class="{ active: selectedMealType === tab.value }"
          @click="selectedMealType = tab.value"
        >
          <van-icon :name="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
      <p class="target-date">
        <van-icon name="calendar-o" />
        <span>记录日期</span>
        <strong>{{ displaySelectedDate }}</strong>
      </p>
    </section>

    <section class="ai-card image-card">
      <div class="image-area" v-if="imageSrc">
        <img :src="imageSrc" class="preview-img" />
        <div class="image-actions">
          <button class="ghost-action" type="button" @click="clearImage">
            <van-icon name="replay" />
            <span>重新选择</span>
          </button>
          <button
            v-if="results.length === 0"
            class="ghost-action primary-action"
            type="button"
            :disabled="analyzing"
            @click="onAnalyze"
          >
            <van-loading v-if="analyzing" size="15" />
            <van-icon v-else name="search" />
            <span>{{ analyzing ? '识别中' : '开始识别' }}</span>
          </button>
        </div>
      </div>
      <div v-else class="image-placeholder">
        <div class="placeholder-icon">
          <van-icon name="photograph" />
        </div>
        <p>选择一张清晰的食物照片</p>
        <div class="img-actions">
          <button type="button" class="capture-btn" @click="onTakePhoto">
            <van-icon name="photograph" />
            <span>拍照</span>
          </button>
          <button type="button" class="capture-btn outline" @click="onPickFile">
            <van-icon name="photo-o" />
            <span>相册</span>
          </button>
        </div>
      </div>
    </section>

    <section class="ai-card result-card" v-if="results.length > 0">
      <h2>确认食物</h2>
      <article v-for="(item, i) in results" :key="`${item.foodName}-${i}`" class="result-item">
        <div class="result-top">
          <div class="result-copy">
            <h3>{{ item.foodName }}</h3>
            <p class="result-calorie">
              <span>{{ item.estimatedWeight }}g</span>
              <i></i>
              <strong>{{ getItemCalories(item) }} kcal</strong>
            </p>
            <p class="result-meta">标准份量：1{{ item.servingUnit }}约 {{ item.defaultServingWeight }}g</p>
            <p class="result-meta">
              蛋白质 {{ getItemProtein(item) }}g · 脂肪 {{ getItemFat(item) }}g · 碳水 {{ getItemCarbs(item) }}g
            </p>
            <p v-if="item.matchedFoodName" class="match-tip">
              <van-icon name="checked" />
              <span>{{ getMatchTip(item) }}</span>
            </p>
            <div v-else class="estimate-edit">
              <p class="estimate-tip">未匹配食物库（可手动填写每100g 营养）</p>
              <div class="manual-nutrition">
                <van-field v-model.number="item.macroPer100g.protein" type="number" label="蛋白质 (g/100g)" placeholder="例如 10" />
                <van-field v-model.number="item.macroPer100g.fat" type="number" label="脂肪 (g/100g)" placeholder="例如 5" />
                <van-field v-model.number="item.macroPer100g.carbs" type="number" label="碳水 (g/100g)" placeholder="例如 20" />
              </div>
            </div>
          </div>
          <div class="result-controls">
            <van-stepper v-model="results[i].estimatedWeight" :min="10" :max="2000" :step="10" input-width="64px" />
            <button class="delete-btn" type="button" aria-label="删除识别项" @click="results.splice(i, 1)">
              <van-icon name="delete-o" />
            </button>
          </div>
        </div>

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
      </article>

      <div class="result-total">
        <span class="total-icon"><van-icon name="fire-o" /></span>
        <span>合计：</span>
        <strong>{{ totalResultCal }} kcal</strong>
      </div>

      <button class="add-all-btn" type="button" @click="onAddAll">
        添加到{{ selectedMealLabel }}
      </button>
    </section>

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
import { Button, Checkbox, CheckboxGroup, Dialog, Field, Icon, Loading, Stepper, showToast } from 'vant'
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

const mealTabs: Array<{ value: MealType; label: string; icon: string }> = [
  { value: 'breakfast', label: '早餐', icon: 'underway-o' },
  { value: 'lunch', label: '午餐', icon: 'hot-o' },
  { value: 'dinner', label: '晚餐', icon: 'notes-o' },
  { value: 'snack', label: '加餐', icon: 'bag-o' }
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
const selectedMealLabel = computed(() => mealLabelMap[selectedMealType.value])
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

function getItemCalories(item: EnrichedRecognition) {
  const protein = Number(item.macroPer100g?.protein ?? 0)
  const fat = Number(item.macroPer100g?.fat ?? 0)
  const carbs = Number(item.macroPer100g?.carbs ?? 0)
  const caloriesFromMacrosPer100 = Math.round((protein + carbs) * 4 + fat * 9)
  const per100 = caloriesFromMacrosPer100 > 0 ? caloriesFromMacrosPer100 : (item.estimatedCalories ?? 0)
  return Math.round(per100 * item.estimatedWeight / 100)
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

function getMatchTip(item: EnrichedRecognition) {
  const prefix = item.nutritionSource === 'alias' ? '已通过别名匹配食物库' : '已匹配食物库'
  return `${prefix}：${item.matchedFoodName}`
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
  if (hasServerNutrition(item)) {
    const matched = findFoodById(item.matchedFoodId) || findFoodMatch(item.matchedFoodName || item.foodName)
    const servingProfile = getServingProfile(
      matched || { name: item.matchedFoodName || item.foodName, category: 'custom' }
    )

    return {
      ...item,
      estimatedWeight: servingProfile.defaultServingWeight,
      matchedFoodId: Number(item.matchedFoodId) || 0,
      matchedFoodName: item.matchedFoodName || matched?.name || item.foodName,
      estimated: false,
      ...servingProfile,
      macroPer100g: {
        protein: item.protein || 0,
        fat: item.fat || 0,
        carbs: item.carbs || 0,
      },
    }
  }

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

function hasServerNutrition(item: AiRecognitionResult) {
  return (
    Number(item.matchedFoodId) > 0 &&
    !!item.matchedFoodName &&
    Number.isFinite(item.protein) &&
    Number.isFinite(item.fat) &&
    Number.isFinite(item.carbs)
  )
}

function findFoodById(foodId: number | string | undefined) {
  if (foodId === undefined) return null
  return foodStore.allFoods.find((food) => String(food.id) === String(foodId)) || null
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
.ai-photo-page {
  padding: 54px 16px calc(92px + var(--safe-bottom));
}

.ai-header {
  margin-bottom: 14px;
  padding: 0 4px;
}

.ai-header h1 {
  margin: 0;
  color: var(--text-strong);
  font-size: 32px;
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.6px;
}

.ai-header p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.ai-card {
  margin-bottom: 10px;
  padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow);
}

.ai-card h2 {
  margin: 0 0 10px;
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 740;
  line-height: 1.2;
  letter-spacing: -0.2px;
}

.meal-type-switch {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.meal-type-btn {
  display: flex;
  min-width: 0;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 6px;
  color: var(--text-secondary);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  font-size: 13px;
  font-weight: 650;
}

.meal-type-btn .van-icon {
  flex: 0 0 auto;
  font-size: 18px;
}

.meal-type-btn span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meal-type-btn.active {
  color: var(--primary);
  background: var(--primary-soft);
  border-color: rgba(45, 106, 79, 0.18);
  box-shadow: inset 0 0 0 1px rgba(45, 106, 79, 0.06);
}

.target-date {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.target-date strong {
  color: var(--text-secondary);
  font-weight: 600;
}

.image-card {
  padding: 10px;
}

.image-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-img {
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 240px;
  border-radius: 12px;
  object-fit: cover;
}

.image-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.ghost-action {
  display: inline-flex;
  min-width: 104px;
  height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 14px;
  color: var(--text-secondary);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 9px;
  font-size: 13px;
}

.ghost-action.primary-action {
  color: var(--primary);
  border-color: rgba(45, 106, 79, 0.22);
  background: var(--primary-soft);
}

.ghost-action:disabled {
  opacity: 0.72;
}

.image-placeholder {
  display: flex;
  min-height: 224px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
  text-align: center;
}

.placeholder-icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 14px;
  font-size: 28px;
}

.image-placeholder p {
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.img-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 14px;
}

.capture-btn {
  display: inline-flex;
  height: 38px;
  min-width: 92px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  background: var(--primary);
  border: 0;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 650;
  box-shadow: 0 6px 14px rgba(45, 106, 79, 0.18);
}

.capture-btn.outline {
  color: var(--primary);
  background: var(--card-bg);
  border: 1px solid rgba(45, 106, 79, 0.22);
  box-shadow: none;
}

.result-card {
  padding: 14px 12px 16px;
}

.result-item {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--divider);
}

.result-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.result-copy {
  min-width: 0;
}

.result-copy h3 {
  margin: 0 0 3px;
  overflow: hidden;
  color: var(--text);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-calorie {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 5px;
  color: var(--text);
  font-size: 18px;
  line-height: 1.25;
}

.result-calorie i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-secondary);
}

.result-calorie strong {
  color: var(--primary);
  font-size: 22px;
  font-weight: 800;
  white-space: nowrap;
}

.result-meta {
  margin: 3px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.match-tip,
.estimate-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 650;
}

.match-tip {
  color: var(--primary);
}

.estimate-tip {
  color: var(--orange);
}

.result-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-controls :deep(.van-stepper) {
  display: grid;
  grid-template-columns: 38px 64px 38px;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
}

.result-controls :deep(.van-stepper__minus),
.result-controls :deep(.van-stepper__plus),
.result-controls :deep(.van-stepper__input) {
  height: 38px;
  background: var(--card-bg);
  border-radius: 0;
}

.result-controls :deep(.van-stepper__input) {
  color: var(--text);
  font-size: 15px;
  font-weight: 650;
}

.delete-btn {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  color: var(--danger);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 19px;
}

.portion-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.portion-btn {
  min-width: 0;
  min-height: 52px;
  color: var(--text-secondary);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.25;
}

.portion-btn span,
.portion-btn small {
  display: block;
}

.portion-btn span::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 7px;
  border: 2px solid currentColor;
  border-radius: 50%;
  opacity: 0.55;
  vertical-align: -1px;
}

.portion-btn small {
  margin-top: 3px;
  color: inherit;
  font-size: 13px;
}

.portion-btn.active {
  color: var(--primary);
  background: var(--primary-soft);
  border-color: rgba(45, 106, 79, 0.16);
  font-weight: 700;
}

.portion-btn.active span::before {
  background: var(--primary);
  box-shadow: inset 0 0 0 3px var(--primary-soft);
  opacity: 1;
}

.result-total {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  color: var(--text);
  font-size: 19px;
  font-weight: 760;
}

.total-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 50%;
}

.result-total strong {
  color: var(--primary);
  font-size: 22px;
  font-weight: 800;
}

.add-all-btn {
  width: 100%;
  height: 48px;
  margin-top: 14px;
  color: #fff;
  background: var(--primary);
  border: 0;
  border-radius: 16px;
  box-shadow: 0 8px 18px rgba(45, 106, 79, 0.2);
  font-size: 17px;
  font-weight: 760;
}

.hidden-input {
  display: none;
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

@media (max-width: 390px) {
  .ai-photo-page {
    padding-inline: 14px;
  }

  .meal-type-switch {
    gap: 8px;
  }

  .meal-type-btn {
    height: 46px;
    gap: 4px;
    padding-inline: 6px;
    font-size: 13px;
  }

  .result-top {
    grid-template-columns: 1fr;
  }

  .result-controls {
    justify-content: space-between;
  }
}
</style>
