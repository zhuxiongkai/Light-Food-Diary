<template>
  <div class="page">
    <div class="page-header">AI拍照估算</div>

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
      <div v-for="(item, i) in results" :key="i" class="result-item flex-between">
        <div>
          <span class="result-name">{{ item.foodName }}</span>
          <span class="result-meta text-secondary">{{ item.estimatedWeight }}g · {{ getItemCalories(item) }} kcal</span>
        </div>
        <div class="flex-row">
          <van-stepper v-model="results[i].estimatedWeight" :min="10" :max="2000" :step="10" input-width="60px" />
          <van-icon name="delete-o" class="del-btn" @click="results.splice(i, 1)" />
        </div>
      </div>

      <div class="result-total mt-16">
        <span>合计: {{ totalResultCal }} kcal</span>
      </div>

      <van-button type="primary" block round class="mt-12" @click="onAddAll">
        一键添加到今日记录
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
import { ref, computed } from 'vue'
import { Button, Icon, Loading, Stepper, Dialog, showToast } from 'vant'
import { useMealStore } from '@/stores/mealStore'
import { analyzeFoodImage } from '@/utils/aiService'
import type { AiRecognitionResult } from '@/types'

const mealStore = useMealStore()

const imageSrc = ref('')
const imageBase64 = ref('')
const imageType = ref('image/jpeg')
const analyzing = ref(false)
const results = ref<AiRecognitionResult[]>([])
const fileInput = ref<HTMLInputElement>()
const videoEl = ref<HTMLVideoElement>()
const showCamera = ref(false)
const showPickDialog = ref(false)
const candidateResults = ref<AiRecognitionResult[]>([])
const pickedIndexes = ref<number[]>([])
let mediaStream: MediaStream | null = null

function getItemCalories(item: AiRecognitionResult) {
  return Math.round(item.estimatedCalories * item.estimatedWeight / 100)
}

const totalResultCal = computed(() =>
  results.value.reduce((sum, item) => sum + getItemCalories(item), 0)
)

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

  if (results.value.length === 0) {
    showToast('未选中有效菜品，请重试')
    return
  }

  showToast(`已选择 ${results.value.length} 项`)
}

async function onAddAll() {
  const today = mealStore.todayStr()
  for (const item of results.value) {
    await mealStore.addMeal({
      date: today,
      mealType: 'lunch',
      foodId: 0,
      foodName: item.foodName,
      weight: item.estimatedWeight,
      calories: getItemCalories(item),
      protein: 0,
      fat: 0,
      carbs: 0
    })
  }
  showToast(`已添加 ${results.value.length} 项`)
  results.value = []
  imageSrc.value = ''
}
</script>

<style scoped>
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
.result-name {
  font-size: 15px;
  font-weight: 500;
  display: block;
}
.result-meta {
  font-size: 12px;
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
