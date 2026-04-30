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
      <div class="avatar-circle">
        <van-icon name="user-o" />
      </div>
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
        <van-icon name="question-o" />
      </div>
      <div class="trend-metrics">
        <div>
          <span>平均摄入</span>
          <strong class="numeric">{{ averageCalories.toLocaleString() }} <small>千卡</small></strong>
        </div>
        <div>
          <span>平均目标</span>
          <strong class="numeric">{{ dailyGoal.toLocaleString() }} <small>千卡</small></strong>
        </div>
      </div>
      <v-chart :option="trendOption" class="trend-chart" autoresize />
    </section>

    <div class="chart-grid">
      <section class="mini-card glass-card">
        <div class="card-title compact">
          <h2>摄入 vs 目标</h2>
          <van-icon name="question-o" />
        </div>
        <v-chart :option="barOption" class="mini-chart" autoresize />
      </section>

      <section class="mini-card glass-card macro-card">
        <div class="card-title compact">
          <h2>三大营养素占比</h2>
          <van-icon name="question-o" />
        </div>
        <div class="donut-layout">
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
      </section>
    </div>

    <div class="kpi-grid">
      <section class="kpi-card glass-card">
        <div class="kpi-icon trend"><van-icon name="chart-trending-o" /></div>
        <span>平均每日摄入</span>
        <strong class="numeric">{{ averageCalories.toLocaleString() }} <small>千卡</small></strong>
        <em class="up">较上周 <van-icon name="down" /> 3.5%</em>
      </section>

      <section class="kpi-card glass-card">
        <div class="kpi-icon target"><van-icon name="aim" /></div>
        <span>目标完成率</span>
        <strong class="numeric">{{ completionRate }}<small>%</small></strong>
        <em>{{ reachedDays }}/{{ activeCalories.length }} 天达成目标</em>
        <div class="completion-track"><i :style="{ width: completionRate + '%' }" /></div>
      </section>

      <section class="kpi-card glass-card">
        <div class="kpi-icon balance"><van-icon name="balance-o" /></div>
        <span>累计超额/缺口</span>
        <strong class="numeric" :class="{ deficit: calorieBalance < 0 }">{{ calorieBalance }} <small>千卡</small></strong>
        <em>本周期总计缺口</em>
      </section>
    </div>

    <section class="weight-card glass-card">
      <div class="weight-copy">
        <div class="card-title compact">
          <h2>体重趋势</h2>
          <van-icon name="question-o" />
        </div>
        <strong class="numeric">{{ latestWeight }} <small>公斤</small></strong>
        <span>较上周 <van-icon name="down" /> 0.5 公斤</span>
      </div>
      <v-chart :option="weightOption" class="weight-chart" autoresize />
    </section>

    <section class="exercise-card glass-card">
      <div class="exercise-total">
        <span><van-icon name="fire-o" /> 运动消耗</span>
        <strong class="numeric">1,320 <small>千卡</small></strong>
        <em>本周累计消耗</em>
      </div>
      <div class="exercise-list">
        <div v-for="item in exercises" :key="item.name">
          <span class="exercise-icon"><van-icon :name="item.icon" /></span>
          <strong>{{ item.count }}次</strong>
          <small>{{ item.calories }} 千卡</small>
        </div>
      </div>
      <button type="button" class="next-button" @click="showToast('运动详情即将开放')">
        <van-icon name="arrow" />
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Icon, showToast } from 'vant'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useMealStore } from '@/stores/mealStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWeightStore } from '@/stores/weightStore'
import type { MealRecord } from '@/types'

use([LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

type Period = 'week' | 'month' | 'year'

const mealStore = useMealStore()
const settingsStore = useSettingsStore()
const weightStore = useWeightStore()

const period = ref<Period>('week')
const meals = ref<MealRecord[]>([])
const labels = ref<string[]>([])

const demoCalories = [1450, 1680, 1920, 2140, 1720, 1380, 1280]
const demoProtein = [88, 102, 116, 125, 98, 82, 64]
const demoFat = [48, 54, 62, 68, 55, 44, 40]
const demoCarbs = [182, 212, 246, 272, 218, 170, 196]

const periodItems = [
  { label: '周', value: 'week' as const },
  { label: '月', value: 'month' as const },
  { label: '年', value: 'year' as const }
]

const exercises = [
  { name: '跑步', icon: 'guide-o', count: 4, calories: 560 },
  { name: '骑行', icon: 'logistics', count: 2, calories: 320 },
  { name: '游泳', icon: 'like-o', count: 1, calories: 220 },
  { name: '冥想', icon: 'smile-o', count: 2, calories: 220 }
]

const todayLabel = computed(() => {
  const date = new Date()
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekday}`
})

const dailyGoal = computed(() => settingsStore.settings.dailyCalorieGoal || 2000)

const activeCalories = computed(() => {
  const values = aggregateCalories()
  return values.some((value) => value > 0) ? values : demoCalories
})

const activeProtein = computed(() => {
  const values = aggregateMacro('protein')
  return values.some((value) => value > 0) ? values : demoProtein
})

const activeFat = computed(() => {
  const values = aggregateMacro('fat')
  return values.some((value) => value > 0) ? values : demoFat
})

const activeCarbs = computed(() => {
  const values = aggregateMacro('carbs')
  return values.some((value) => value > 0) ? values : demoCarbs
})

const chartLabels = computed(() => labels.value.length ? labels.value : ['5/14', '5/15', '5/16', '5/17', '5/18', '5/19', '5/20'])

const averageCalories = computed(() =>
  Math.round(activeCalories.value.reduce((sum, value) => sum + value, 0) / activeCalories.value.length)
)

const latestCalories = computed(() => activeCalories.value[activeCalories.value.length - 1] || 0)

const reachedDays = computed(() => activeCalories.value.filter((value) => value >= dailyGoal.value * 0.85 && value <= dailyGoal.value * 1.1).length)
const completionRate = computed(() => Math.round((reachedDays.value / activeCalories.value.length) * 100))
const calorieBalance = computed(() => Math.round(averageCalories.value - dailyGoal.value))

const latestWeight = computed(() => {
  const first = weightStore.records[0]
  return first ? first.weight.toFixed(1) : '63.2'
})

const trendOption = computed(() => ({
  color: ['#18b978', '#6b9cff'],
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
      data: activeCalories.value,
      label: {
        show: true,
        position: 'bottom',
        color: '#687283',
        fontSize: 10,
        formatter: ({ value }: { value: number }) => value.toLocaleString()
      },
      lineStyle: { width: 3 },
      itemStyle: { borderWidth: 2, borderColor: '#ffffff' }
    },
    {
      name: '目标热量',
      type: 'line',
      symbol: 'none',
      data: activeCalories.value.map(() => dailyGoal.value),
      lineStyle: { type: 'dashed', width: 2 },
      tooltip: { show: false }
    }
  ]
}))

const barOption = computed(() => ({
  color: ['#1fc483', '#5b97f4'],
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
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
    { name: '摄入热量', type: 'bar', barWidth: 8, data: activeCalories.value, itemStyle: { borderRadius: [5, 5, 0, 0] } },
    { name: '目标热量', type: 'bar', barWidth: 8, data: activeCalories.value.map(() => dailyGoal.value), itemStyle: { borderRadius: [5, 5, 0, 0] } }
  ]
}))

const macroLegend = computed(() => {
  const carbsCalories = Math.round(activeCarbs.value.at(-1)! * 4)
  const proteinCalories = Math.round(activeProtein.value.at(-1)! * 4)
  const fatCalories = Math.round(activeFat.value.at(-1)! * 9)
  const total = Math.max(1, carbsCalories + proteinCalories + fatCalories)
  return [
    { name: '碳水化合物', calories: carbsCalories, color: '#5b97f4' },
    { name: '蛋白质', calories: proteinCalories, color: '#42c987' },
    { name: '脂肪', calories: fatCalories, color: '#ff9d4c' }
  ].map((item) => ({ ...item, percent: Math.round((item.calories / total) * 100) }))
})

const donutOption = computed(() => ({
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
        formatter: `${latestCalories.value.toLocaleString()}\n千卡`,
        color: '#121721',
        fontSize: 18,
        lineHeight: 25,
        fontWeight: 800
      },
      labelLine: { show: false },
      data: macroLegend.value.map((item) => ({
        name: item.name,
        value: item.calories,
        itemStyle: { color: item.color, borderColor: '#fff', borderWidth: 2 }
      }))
    }
  ]
}))

const weightOption = computed(() => ({
  color: ['#18b978'],
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
    min: 62,
    max: 65,
    splitLine: { lineStyle: { color: '#eef2f6' } },
    axisLabel: { color: '#8a95a7', fontSize: 10 }
  },
  series: [{
    type: 'line',
    smooth: true,
    symbolSize: 6,
    data: [63.8, 63.5, 63.6, 63.4, 63.35, 63.1, 62.95],
    lineStyle: { width: 3 },
    areaStyle: { color: 'rgba(24, 185, 120, 0.08)' }
  }]
}))

watch(period, loadData)

onMounted(async () => {
  await Promise.all([settingsStore.loadSettings(), weightStore.loadRecords()])
  await loadData()
})

async function loadData() {
  const dayCount = period.value === 'week' ? 7 : period.value === 'month' ? 30 : 12
  const end = new Date()
  const start = new Date(end)
  if (period.value === 'year') {
    start.setMonth(start.getMonth() - 11)
  } else {
    start.setDate(start.getDate() - dayCount + 1)
  }

  const startStr = toDateStr(start)
  const endStr = toDateStr(end)
  meals.value = await mealStore.getMealsByDateRange(startStr, endStr)
  labels.value = period.value === 'year' ? monthLabels(start, end) : dayLabels(start, end)
}

function aggregateCalories() {
  const map = aggregateByLabel()
  return labels.value.map((label) => Math.round((map.get(label)?.calories || 0)))
}

function aggregateMacro(key: 'protein' | 'fat' | 'carbs') {
  const map = aggregateByLabel()
  return labels.value.map((label) => Math.round(map.get(label)?.[key] || 0))
}

function aggregateByLabel() {
  const map = new Map<string, { calories: number; protein: number; fat: number; carbs: number }>()
  for (const label of labels.value) {
    map.set(label, { calories: 0, protein: 0, fat: 0, carbs: 0 })
  }
  for (const meal of meals.value) {
    const label = period.value === 'year' ? meal.date.slice(0, 7) : meal.date.slice(5).replace('-', '/')
    const bucket = map.get(label)
    if (!bucket) continue
    bucket.calories += meal.calories
    bucket.protein += meal.protein
    bucket.fat += meal.fat
    bucket.carbs += meal.carbs
  }
  return map
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
  box-shadow: 0 4px 12px rgba(22, 185, 120, 0.2);
}

.period-switch {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin-bottom: 20px;
  padding: 2px;
  background: white;
  border: 1px solid rgba(132, 149, 171, 0.12);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(44, 70, 103, 0.08);
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
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(44, 70, 103, 0.08);
  border: 1px solid rgba(132, 149, 171, 0.08);
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

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.mini-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(44, 70, 103, 0.08);
  border: 1px solid rgba(132, 149, 171, 0.08);
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
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(44, 70, 103, 0.08);
  border: 1px solid rgba(132, 149, 171, 0.08);
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
  color: var(--text-secondary);
  background: rgba(132, 149, 171, 0.1);
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

.kpi-card em.up {
  color: var(--primary);
  font-weight: 600;
}

.completion-track {
  height: 4px;
  background: rgba(132, 149, 171, 0.1);
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
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(44, 70, 103, 0.08);
  border: 1px solid rgba(132, 149, 171, 0.08);
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

.weight-chart {
  width: 100%;
  height: 140px;
}

.exercise-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(44, 70, 103, 0.08);
  border: 1px solid rgba(132, 149, 171, 0.08);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: flex-start;
}

.exercise-total {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exercise-total span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.exercise-total span .van-icon {
  color: var(--orange);
  font-size: 16px;
}

.exercise-total strong {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: var(--text);
}

.exercise-total em {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
  font-style: normal;
}

.exercise-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 100%;
}

.exercise-list div {
  text-align: center;
}

.exercise-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(132, 149, 171, 0.1);
  color: var(--text-secondary);
  font-size: 18px;
}

.exercise-list strong {
  display: block;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.exercise-list small {
  display: block;
  color: var(--text-secondary);
  font-size: 11px;
  margin-top: 4px;
}

.next-button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(132, 149, 171, 0.1);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
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

  .exercise-card {
    grid-template-columns: 1fr;
  }

  .exercise-list {
    grid-template-columns: repeat(2, 1fr);
  }

  .next-button {
    display: none;
  }
}
</style>
