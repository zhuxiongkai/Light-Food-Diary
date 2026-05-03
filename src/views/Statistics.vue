<template>
  <div class="page stats-page">
    <header class="page-header stats-header">
      <div class="header-left">
        <h1 class="page-title">热量统计</h1>
        <div class="sub-date">
          <van-icon name="calendar-o" />
          <span>{{ todayLabel }}</span>
        </div>
      </div>
      <!-- <button class="avatar-circle" type="button" aria-label="进入设置" @click="router.push('/settings')">
        <van-icon name="user-o" />
      </button> -->
    </header>

    <div class="period-switch">
      <button
        v-for="item in periodItems"
        :key="item.value"
        type="button"
        :class="{ active: period === item.value }"
        @click="period = item.value"
      >
        {{ item.label }}
      </button>
    </div>

    <section class="trend-card glass-card">
      <div class="card-title">
        <h2>热量摄入趋势</h2>
        <button class="question-btn" type="button" aria-label="查看热量摄入趋势说明" @click="showHelp('trend')">
          <van-icon name="question-o" />
        </button>
      </div>
      <div class="trend-metrics">
        <div>
          <span>平均摄入</span>
          <strong class="numeric">{{ averageCaloriesText }} <small>千卡</small></strong>
        </div>
        <div>
          <span>平均目标</span>
          <strong class="numeric">{{ dailyGoal.toLocaleString() }} <small>千卡</small></strong>
        </div>
      </div>
      <v-chart v-if="hasCalorieData" :option="trendOption" class="trend-chart" autoresize />
      <div v-else class="empty-chart">暂无热量数据，请先记录饮食</div>
    </section>

    <div class="chart-grid">
      <section class="mini-card glass-card">
        <div class="card-title compact">
          <h2>摄入 vs 目标</h2>
          <button class="question-btn" type="button" aria-label="查看摄入和目标说明" @click="showHelp('target')">
            <van-icon name="question-o" />
          </button>
        </div>
        <v-chart v-if="hasCalorieData" :option="barOption" class="mini-chart" autoresize />
        <div v-else class="empty-chart">暂无可对比数据</div>
      </section>

      <section class="mini-card glass-card macro-card">
        <div class="card-title compact">
          <h2>三大营养素占比</h2>
          <button class="question-btn" type="button" aria-label="查看三大营养素说明" @click="showHelp('macro')">
            <van-icon name="question-o" />
          </button>
        </div>
        <div v-if="hasCalorieData" class="donut-layout">
          <v-chart :option="donutOption" class="donut-chart" autoresize />
          <div class="macro-legend">
            <div v-for="item in macroLegend" :key="item.name">
              <i :style="{ background: item.color }" />
              <span>{{ item.name }}</span>
              <strong>{{ item.percent }}%</strong>
              <small>{{ item.calories }} 千卡</small>
            </div>
          </div>
        </div>
        <div v-else class="empty-chart">暂无营养素数据</div>
      </section>
    </div>

    <div class="kpi-grid">
      <section class="kpi-card glass-card">
        <div class="kpi-icon trend"><van-icon name="chart-trending-o" /></div>
        <span>平均每日摄入</span>
        <strong class="numeric">{{ averageCaloriesText }} <small>千卡</small></strong>
        <em>{{ calorieChangeText }}</em>
      </section>

      <section class="kpi-card glass-card">
        <div class="kpi-icon target"><van-icon name="aim" /></div>
        <span>目标完成率</span>
        <strong class="numeric">{{ completionRateText }}<small>%</small></strong>
        <em v-if="hasCalorieData">{{ reachedDays }}/{{ calorieSeries.length }} 天达成目标</em>
        <em v-else>暂无饮食记录</em>
        <div class="completion-track"><i :style="{ width: completionRateBar + '%' }" /></div>
      </section>

      <section class="kpi-card glass-card">
        <div class="kpi-icon balance"><van-icon name="balance-o" /></div>
        <span>累计超额/缺口</span>
        <strong class="numeric" :class="{ deficit: (calorieBalance ?? 0) < 0 }">{{ calorieBalanceText }} <small>千卡</small></strong>
        <em>{{ calorieBalanceLabel }}</em>
      </section>
    </div>

    <section class="weight-card glass-card">
      <div class="weight-copy">
        <div class="card-title compact">
          <h2>体重趋势</h2>
          <button class="question-btn" type="button" aria-label="查看体重趋势说明" @click="showHelp('weight')">
            <van-icon name="question-o" />
          </button>
        </div>
        <strong class="numeric">{{ latestWeightText }} <small>公斤</small></strong>
        <span>{{ weightChangeText }}</span>
        <button class="weight-link" type="button" @click="router.push('/weight')">
          记录体重 <van-icon name="arrow" />
        </button>
      </div>
      <v-chart v-if="hasWeightData" :option="weightOption" class="weight-chart" autoresize />
      <div v-else class="empty-chart">暂无体重记录</div>
    </section>

    <section class="advice-card glass-card">
      <div class="card-title compact">
        <h2>AI 饮食建议</h2>
        <button class="question-btn" type="button" aria-label="查看 AI 饮食建议说明" @click="showHelp('advice')">
          <van-icon name="question-o" />
        </button>
      </div>
      <p class="advice-hint">基于近 7 天饮食记录与你在设置中的目标，由 DeepSeek 模型生成解读（仅供参考，不能替代专业医疗意见）。</p>
      <div v-if="adviceError" class="advice-error">{{ adviceError }}</div>
      <div v-else-if="adviceLoading" class="advice-loading">正在生成建议…</div>
      <div v-else-if="adviceText" class="advice-md" v-html="adviceHtml" />
      <div v-else class="advice-empty">点击下方按钮，根据近一周数据生成个性化建议。</div>
      <button class="advice-btn" type="button" :disabled="adviceLoading" @click="loadAdvice">
        {{ adviceText ? '重新生成' : '生成建议' }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Icon, showDialog, showToast } from 'vant'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useMealStore } from '@/stores/mealStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWeightStore } from '@/stores/weightStore'
import { fetchNutritionAdvice } from '@/utils/aiService'
import { renderMarkdownToHtml } from '@/utils/renderMarkdown'
import type { MealRecord } from '@/types'

use([LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

type Period = 'week' | 'month' | 'year'

type WeightPoint = number | null

const mealStore = useMealStore()
const settingsStore = useSettingsStore()
const weightStore = useWeightStore()
const router = useRouter()

const period = ref<Period>('week')
const meals = ref<MealRecord[]>([])
const prevMeals = ref<MealRecord[]>([])
const labels = ref<string[]>([])
const prevLabels = ref<string[]>([])
const weightSeries = ref<WeightPoint[]>([])
const prevWeightSeries = ref<WeightPoint[]>([])
const adviceText = ref('')
const adviceLoading = ref(false)
const adviceError = ref('')

const adviceHtml = computed(() =>
  adviceText.value ? renderMarkdownToHtml(adviceText.value) : ''
)

const periodItems = [
  { label: '周', value: 'week' as const },
  { label: '月', value: 'month' as const },
  { label: '年', value: 'year' as const }
]

type HelpKey = 'trend' | 'target' | 'macro' | 'weight' | 'advice'

const helpContent: Record<HelpKey, { title: string; message: string }> = {
  trend: {
    title: '热量摄入趋势',
    message: '展示当前周期每天或每月的热量摄入，并用虚线标出你的每日目标。'
  },
  target: {
    title: '摄入 vs 目标',
    message: '对比每个时间点的实际摄入和目标热量，帮助判断是否长期偏高或偏低。'
  },
  macro: {
    title: '三大营养素占比',
    message: '按热量来源统计碳水、蛋白质和脂肪占比，比例来自当前周期内已记录食物。'
  },
  weight: {
    title: '体重趋势',
    message: '展示当前周期体重记录变化；没有当天记录时，会沿用上一条体重记录形成连续趋势。'
  },
  advice: {
    title: 'AI 饮食建议',
    message:
      '此处分析与上方图表周期无关，固定使用「最近 7 天」的饮食汇总与你的热量及营养素目标，由服务端调用 DeepSeek 生成文本建议。需在后端配置 DEEPSEEK_API_KEY。'
  }
}

const todayLabel = computed(() => {
  const date = new Date()
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekday}`
})

const dailyGoal = computed(() => settingsStore.settings.dailyCalorieGoal || 2000)

const calorieSeries = computed(() => aggregateMacroSeries(meals.value, labels.value, 'calories'))
const proteinSeries = computed(() => aggregateMacroSeries(meals.value, labels.value, 'protein'))
const fatSeries = computed(() => aggregateMacroSeries(meals.value, labels.value, 'fat'))
const carbsSeries = computed(() => aggregateMacroSeries(meals.value, labels.value, 'carbs'))

const prevCalorieSeries = computed(() => aggregateMacroSeries(prevMeals.value, prevLabels.value, 'calories'))

const hasCalorieData = computed(() => calorieSeries.value.some((value) => value > 0))
const hasWeightData = computed(() => weightSeries.value.some((value) => typeof value === 'number'))

const chartLabels = computed(() => labels.value)

const averageCalories = computed(() => {
  if (!hasCalorieData.value || calorieSeries.value.length === 0) return null
  return Math.round(calorieSeries.value.reduce((sum, value) => sum + value, 0) / calorieSeries.value.length)
})

const previousAverageCalories = computed(() => {
  const valid = prevCalorieSeries.value.filter((value) => value > 0)
  if (valid.length === 0) return null
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length)
})

const averageCaloriesText = computed(() => averageCalories.value === null ? '--' : averageCalories.value.toLocaleString())

const calorieChangePercent = computed(() => {
  if (averageCalories.value === null || previousAverageCalories.value === null || previousAverageCalories.value <= 0) {
    return null
  }
  const delta = ((averageCalories.value - previousAverageCalories.value) / previousAverageCalories.value) * 100
  return Math.round(delta * 10) / 10
})

const calorieChangeText = computed(() => {
  if (!hasCalorieData.value) return '暂无历史数据'
  if (calorieChangePercent.value === null) return '缺少上周期对照'
  if (calorieChangePercent.value === 0) return '与上周期持平'
  return calorieChangePercent.value > 0
    ? `较上周期 +${calorieChangePercent.value}%`
    : `较上周期 ${calorieChangePercent.value}%`
})

const reachedDays = computed(() =>
  calorieSeries.value.filter((value) => value >= dailyGoal.value * 0.85 && value <= dailyGoal.value * 1.1).length
)

const completionRate = computed(() => {
  if (!hasCalorieData.value || calorieSeries.value.length === 0) return null
  return Math.round((reachedDays.value / calorieSeries.value.length) * 100)
})

const completionRateText = computed(() => completionRate.value === null ? '--' : String(completionRate.value))
const completionRateBar = computed(() => completionRate.value === null ? 0 : completionRate.value)

const calorieBalance = computed(() => {
  if (!hasCalorieData.value) return null
  return Math.round(calorieSeries.value.reduce((sum, value) => sum + (value - dailyGoal.value), 0))
})

const calorieBalanceText = computed(() => {
  if (calorieBalance.value === null) return '--'
  if (calorieBalance.value > 0) return `+${calorieBalance.value}`
  return String(calorieBalance.value)
})

const calorieBalanceLabel = computed(() => {
  if (calorieBalance.value === null) return '暂无周期数据'
  return calorieBalance.value >= 0 ? '本周期总计超额' : '本周期总计缺口'
})

const latestWeight = computed(() => {
  for (let i = weightSeries.value.length - 1; i >= 0; i -= 1) {
    const value = weightSeries.value[i]
    if (typeof value === 'number') return value
  }
  return null
})

const previousLatestWeight = computed(() => {
  for (let i = prevWeightSeries.value.length - 1; i >= 0; i -= 1) {
    const value = prevWeightSeries.value[i]
    if (typeof value === 'number') return value
  }
  return null
})

const latestWeightText = computed(() => latestWeight.value === null ? '--' : latestWeight.value.toFixed(1))

const weightChange = computed(() => {
  if (latestWeight.value === null || previousLatestWeight.value === null) return null
  return Math.round((latestWeight.value - previousLatestWeight.value) * 10) / 10
})

const weightChangeText = computed(() => {
  if (!hasWeightData.value) return '暂无体重变化数据'
  if (weightChange.value === null) return '缺少上周期体重对照'
  if (weightChange.value === 0) return '与上周期持平'
  const sign = weightChange.value > 0 ? '+' : ''
  return `较上周期 ${sign}${weightChange.value.toFixed(1)} 公斤`
})

const macroLegend = computed(() => {
  const proteinCalories = Math.round(proteinSeries.value.reduce((sum, value) => sum + value, 0) * 4)
  const fatCalories = Math.round(fatSeries.value.reduce((sum, value) => sum + value, 0) * 9)
  const carbsCalories = Math.round(carbsSeries.value.reduce((sum, value) => sum + value, 0) * 4)
  const total = proteinCalories + fatCalories + carbsCalories

  return [
    { name: '碳水化合物', calories: carbsCalories, color: '#b7844a' },
    { name: '蛋白质', calories: proteinCalories, color: '#5b8c85' },
    { name: '脂肪', calories: fatCalories, color: '#c97d60' }
  ].map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((item.calories / total) * 100) : 0
  }))
})

const trendOption = computed(() => ({
  color: ['#2d6a4f', '#b7844a'],
  tooltip: { trigger: 'axis' },
  legend: {
    top: 10,
    right: 0,
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { color: '#687283', fontSize: 11 },
    data: ['摄入热量', '目标热量']
  },
  grid: { left: 38, right: 8, top: 54, bottom: 24 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: chartLabels.value,
    axisLine: { lineStyle: { color: '#d7e0ea' } },
    axisTick: { show: false },
    axisLabel: { color: '#687283', fontSize: 11 }
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: Math.max(2500, dailyGoal.value + 500),
    splitLine: { lineStyle: { color: '#edf2f7' } },
    axisLabel: { color: '#687283', fontSize: 11 }
  },
  series: [
    {
      name: '摄入热量',
      type: 'line',
      smooth: true,
      symbolSize: 8,
      data: calorieSeries.value,
      lineStyle: { width: 3 },
      itemStyle: { borderWidth: 2, borderColor: '#ffffff' }
    },
    {
      name: '目标热量',
      type: 'line',
      symbol: 'none',
      data: calorieSeries.value.map(() => dailyGoal.value),
      lineStyle: { type: 'dashed', width: 2 },
      tooltip: { show: false }
    }
  ]
}))

const barOption = computed(() => ({
  color: ['#2d6a4f', '#b7844a'],
  tooltip: { trigger: 'axis' },
  legend: {
    top: 0,
    left: 0,
    itemWidth: 9,
    itemHeight: 9,
    textStyle: { color: '#687283', fontSize: 10 },
    data: ['摄入热量', '目标热量']
  },
  grid: { left: 32, right: 4, top: 38, bottom: 20 },
  xAxis: {
    type: 'category',
    data: chartLabels.value,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#d7e0ea' } },
    axisLabel: { color: '#687283', fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#edf2f7' } },
    axisLabel: { color: '#687283', fontSize: 10 }
  },
  series: [
    { name: '摄入热量', type: 'bar', barWidth: 8, data: calorieSeries.value, itemStyle: { borderRadius: [5, 5, 0, 0] } },
    { name: '目标热量', type: 'bar', barWidth: 8, data: calorieSeries.value.map(() => dailyGoal.value), itemStyle: { borderRadius: [5, 5, 0, 0] } }
  ]
}))

const donutOption = computed(() => {
  const seriesData = macroLegend.value
    .filter((item) => item.calories > 0)
    .map((item) => ({
      name: item.name,
      value: item.calories,
      itemStyle: { color: item.color, borderColor: '#fff', borderWidth: 2 }
    }))

  return {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['56%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'center',
          formatter: `${averageCaloriesText.value}\n千卡`,
          color: '#121721',
          fontSize: 18,
          lineHeight: 25,
          fontWeight: 800
        },
        labelLine: { show: false },
        data: seriesData
      }
    ]
  }
})

const weightOption = computed(() => {
  const points = weightSeries.value.filter((value): value is number => typeof value === 'number')
  const minWeight = points.length ? Math.min(...points) : 0
  const maxWeight = points.length ? Math.max(...points) : 0

  return {
    color: ['#2d6a4f'],
    grid: { left: 4, right: 8, top: 12, bottom: 22 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartLabels.value,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: '#8a95a7', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      min: Math.floor((minWeight - 1) * 10) / 10,
      max: Math.ceil((maxWeight + 1) * 10) / 10,
      splitLine: { lineStyle: { color: '#eef2f6' } },
      axisLabel: { color: '#8a95a7', fontSize: 10 }
    },
    series: [{
      type: 'line',
      smooth: true,
      symbolSize: 6,
      data: weightSeries.value,
      lineStyle: { width: 3 },
      areaStyle: { color: 'rgba(45, 106, 79, 0.08)' }
    }]
  }
})

watch(period, () => {
  void loadData()
})

onMounted(async () => {
  await Promise.all([settingsStore.loadSettings(), weightStore.loadRecords()])
  await loadData()
})

function showHelp(key: HelpKey) {
  const content = helpContent[key]
  showDialog({
    title: content.title,
    message: content.message,
    confirmButtonText: '知道了'
  })
}

async function loadAdvice() {
  adviceError.value = ''
  adviceLoading.value = true
  try {
    adviceText.value = await fetchNutritionAdvice()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '生成失败，请稍后重试'
    adviceError.value = msg
    showToast(msg)
  } finally {
    adviceLoading.value = false
  }
}

async function loadData() {
  const { start, end, prevStart, prevEnd } = resolveRange(period.value)

  const [mealList, weightList, prevMealList, prevWeightList] = await Promise.all([
    mealStore.getMealsByDateRange(toDateStr(start), toDateStr(end)),
    weightStore.getRecordsByDateRange(toDateStr(start), toDateStr(end)),
    mealStore.getMealsByDateRange(toDateStr(prevStart), toDateStr(prevEnd)),
    weightStore.getRecordsByDateRange(toDateStr(prevStart), toDateStr(prevEnd)),
  ])

  meals.value = mealList
  prevMeals.value = prevMealList

  labels.value = period.value === 'year' ? monthLabels(start, end) : dayLabels(start, end)
  prevLabels.value = period.value === 'year' ? monthLabels(prevStart, prevEnd) : dayLabels(prevStart, prevEnd)

  weightSeries.value = aggregateWeightSeries(weightList, labels.value)
  prevWeightSeries.value = aggregateWeightSeries(prevWeightList, prevLabels.value)
}

function resolveRange(targetPeriod: Period) {
  const end = new Date()
  const start = new Date(end)

  if (targetPeriod === 'year') {
    start.setDate(1)
    start.setMonth(start.getMonth() - 11)
  } else {
    const dayCount = targetPeriod === 'week' ? 7 : 30
    start.setDate(start.getDate() - dayCount + 1)
  }

  let prevStart: Date
  let prevEnd: Date

  if (targetPeriod === 'year') {
    prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)
    prevStart = new Date(prevEnd)
    prevStart.setDate(1)
    prevStart.setMonth(prevStart.getMonth() - 11)
  } else {
    const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
    prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)
    prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - days + 1)
  }

  return { start, end, prevStart, prevEnd }
}

function aggregateMacroSeries(sourceMeals: MealRecord[], labelList: string[], key: 'calories' | 'protein' | 'fat' | 'carbs') {
  const map = new Map<string, { calories: number; protein: number; fat: number; carbs: number }>()

  for (const label of labelList) {
    map.set(label, { calories: 0, protein: 0, fat: 0, carbs: 0 })
  }

  for (const meal of sourceMeals) {
    const label = dateLabelForPeriod(meal.date)
    const bucket = map.get(label)
    if (!bucket) continue
    bucket.calories += meal.calories
    bucket.protein += meal.protein
    bucket.fat += meal.fat
    bucket.carbs += meal.carbs
  }

  return labelList.map((label) => Math.round(map.get(label)?.[key] || 0))
}

function aggregateWeightSeries(records: { date: string; weight: number }[], labelList: string[]) {
  if (labelList.length === 0) return []

  const map = new Map<string, number>()
  for (const item of records) {
    const label = dateLabelForPeriod(item.date)
    map.set(label, item.weight)
  }

  const result: WeightPoint[] = []
  let last: WeightPoint = null

  for (const label of labelList) {
    const current = map.get(label)
    if (typeof current === 'number') {
      last = Number(current.toFixed(2))
    }
    result.push(last)
  }

  return result
}

function dateLabelForPeriod(date: string) {
  const match = String(date).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) {
    const [, year, month, day] = match
    return period.value === 'year' ? `${year}-${month.padStart(2, '0')}` : `${Number(month)}/${Number(day)}`
  }

  if (period.value === 'year') {
    return String(date).slice(0, 7)
  }

  const [, month, day] = String(date).split('-')
  if (!month || !day) {
    return String(date).slice(5).replace('-', '/')
  }

  return `${Number(month)}/${Number(day)}`
}

function toDateStr(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dayLabels(start: Date, end: Date) {
  const result: string[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    result.push(`${cursor.getMonth() + 1}/${cursor.getDate()}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

function monthLabels(start: Date, end: Date) {
  const result: string[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cursor <= last) {
    result.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return result
}
</script>

<style scoped>
.stats-page {
  padding: 54px 16px calc(92px + var(--safe-bottom));
}

.stats-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding: 0;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: var(--text);
}

.sub-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.avatar-circle {
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(45, 106, 79, 0.22);
  cursor: pointer;
}

.period-switch {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin-bottom: 20px;
  padding: 2px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
}

.period-switch button {
  height: 40px;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.period-switch button.active {
  color: var(--primary);
  background: var(--primary-soft);
}

.trend-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

.card-title h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  flex: 1;
}

.card-title .van-icon {
  color: var(--text-secondary);
  font-size: 16px;
}

.question-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.card-title.compact h2 {
  font-size: 14px;
}

.trend-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.trend-metrics div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trend-metrics span {
  color: var(--text-secondary);
  font-size: 12px;
}

.trend-metrics strong {
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
}

small {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 400;
  margin-left: 4px;
}

.trend-chart {
  width: 100%;
  height: 220px;
}

.empty-chart {
  height: 120px;
  border-radius: 12px;
  background: rgba(132, 149, 171, 0.08);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  text-align: center;
  padding: 0 12px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.mini-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.mini-chart {
  width: 100%;
  height: 180px;
}

.donut-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.donut-chart {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.macro-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  width: 100%;
}

.macro-legend div {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.macro-legend i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.macro-legend span {
  font-size: 12px;
  color: var(--text-secondary);
  flex: 1;
  min-width: 0;
  text-align: left;
}

.macro-legend strong {
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
  margin: 0;
  flex-shrink: 0;
  min-width: 32px;
  text-align: right;
}

.macro-legend small {
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  position: relative;
}

.kpi-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-bottom: 12px;
}

.kpi-icon.trend {
  color: var(--primary);
  background: var(--primary-soft);
}

.kpi-icon.target {
  color: var(--primary);
  background: var(--primary-soft);
}

.kpi-icon.balance {
  color: var(--text-soft);
  background: rgba(156, 142, 132, 0.12);
}

.kpi-card span {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.kpi-card strong {
  display: block;
  color: var(--text);
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 8px;
}

.kpi-card strong.deficit {
  color: var(--primary);
}

.kpi-card em {
  display: block;
  color: var(--text-secondary);
  font-size: 11px;
  font-style: normal;
  margin-bottom: 8px;
}

.completion-track {
  height: 4px;
  background: rgba(156, 142, 132, 0.12);
  border-radius: 2px;
  overflow: hidden;
}

.completion-track i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-strong) 100%);
  border-radius: 2px;
}

.weight-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: center;
}

.weight-copy {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.weight-copy .card-title {
  margin-bottom: 12px;
  display: block;
}

.weight-copy .card-title h2 {
  display: inline-block;
  margin: 0 0 12px 0;
}

.weight-copy strong {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 8px;
}

.weight-copy > span {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
}

.weight-link {
  width: fit-content;
  margin-top: 12px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.weight-chart {
  width: 100%;
  height: 140px;
}

.advice-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.advice-card .card-title {
  margin-bottom: 12px;
}

.advice-hint {
  margin: 0 0 14px 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-secondary);
}

.advice-md {
  margin: 0 0 16px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
  word-break: break-word;
}

.advice-md :deep(h2) {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 14px 0 8px 0;
  padding-left: 8px;
  border-left: 3px solid var(--primary);
}

.advice-md :deep(h2:first-child) {
  margin-top: 0;
}

.advice-md :deep(ul) {
  margin: 0 0 10px 0;
  padding-left: 1.15em;
}

.advice-md :deep(li) {
  margin: 5px 0;
}

.advice-md :deep(p) {
  margin: 0 0 8px 0;
}

.advice-md :deep(strong) {
  color: var(--text);
  font-weight: 700;
}

.advice-empty,
.advice-loading {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: var(--text-secondary);
  min-height: 2.5em;
}

.advice-error {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: #c45c4a;
  line-height: 1.5;
}

.advice-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  box-shadow: 0 4px 14px rgba(45, 106, 79, 0.22);
}

.advice-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 390px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .weight-card {
    grid-template-columns: 1fr;
  }
}
</style>
