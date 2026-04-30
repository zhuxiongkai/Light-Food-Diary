<template>
  <div class="page">
    <div class="page-header">统计图表</div>

    <van-tabs v-model:active="mode" @change="onModeChange">
      <van-tab title="日" />
      <van-tab title="周" />
      <van-tab title="月" />
    </van-tabs>

    <div class="card">
      <div class="chart-title">热量摄入趋势 (kcal)</div>
      <v-chart v-if="calorieChartOption" :option="calorieChartOption" style="height:220px" autoresize />
      <div v-else class="no-data">暂无数据</div>
    </div>

    <div class="card">
      <div class="chart-title">营养素趋势 (g)</div>
      <v-chart v-if="macroChartOption" :option="macroChartOption" style="height:220px" autoresize />
      <div v-else class="no-data">暂无数据</div>
    </div>

    <div class="card" v-if="foodRank.length > 0">
      <div class="chart-title">食物频次 TOP 10</div>
      <div class="rank-list">
        <div v-for="(f, i) in foodRank" :key="f.name" class="rank-item flex-between">
          <span><span class="rank-num">{{ i + 1 }}</span> {{ f.name }}</span>
          <span class="text-secondary">{{ f.count }}次</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Tabs, Tab } from 'vant'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useMealStore } from '@/stores/mealStore'
import type { MealRecord } from '@/types'

use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const mealStore = useMealStore()
const mode = ref(0)
const chartData = ref<{ dates: string[]; calories: number[]; protein: number[]; fat: number[]; carbs: number[] } | null>(null)
const foodRank = ref<{ name: string; count: number }[]>([])

const calorieChartOption = computed(() => {
  if (!chartData.value) return null
  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 16, right: 16, top: 8, bottom: 16 },
    xAxis: {
      type: 'category' as const,
      data: chartData.value.dates,
      axisLabel: { fontSize: 11 }
    },
    yAxis: { type: 'value' as const, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar' as const,
      data: chartData.value.calories,
      itemStyle: { color: '#4CAF50', borderRadius: [4, 4, 0, 0] }
    }]
  }
})

const macroChartOption = computed(() => {
  if (!chartData.value) return null
  return {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['蛋白质', '脂肪', '碳水'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 16, right: 16, top: 32, bottom: 16 },
    xAxis: {
      type: 'category' as const,
      data: chartData.value.dates,
      axisLabel: { fontSize: 11 }
    },
    yAxis: { type: 'value' as const, axisLabel: { fontSize: 11 } },
    series: [
      { name: '蛋白质', type: 'line' as const, data: chartData.value.protein, smooth: true, itemStyle: { color: '#FF5722' } },
      { name: '脂肪',   type: 'line' as const, data: chartData.value.fat,     smooth: true, itemStyle: { color: '#FF9800' } },
      { name: '碳水',   type: 'line' as const, data: chartData.value.carbs,   smooth: true, itemStyle: { color: '#4CAF50' } }
    ]
  }
})

const dayCount = computed(() => [7, 7, 30][mode.value])

async function loadData() {
  const end = new Date()
  const start = new Date(end.getTime() - (dayCount.value - 1) * 86400000)
  const dateRange = getDateRange(start, end)

  const meals = await mealStore.getMealsByDateRange(
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10)
  )

  const dateMap = new Map<string, MealRecord[]>()
  for (const m of meals) {
    const arr = dateMap.get(m.date) || []
    arr.push(m)
    dateMap.set(m.date, arr)
  }

  const dates: string[] = []
  const calories: number[] = []
  const protein: number[] = []
  const fat: number[] = []
  const carbs: number[] = []

  for (const d of dateRange) {
    const short = mode.value === 2 ? d.slice(5) : d.slice(5) // MM-DD
    dates.push(short)
    const items = dateMap.get(d) || []
    calories.push(items.reduce((s, m) => s + m.calories, 0))
    protein.push(items.reduce((s, m) => s + m.protein, 0))
    fat.push(items.reduce((s, m) => s + m.fat, 0))
    carbs.push(items.reduce((s, m) => s + m.carbs, 0))
  }

  chartData.value = { dates, calories, protein, fat, carbs }

  // Food frequency
  const foodCount = new Map<string, number>()
  for (const m of meals) {
    foodCount.set(m.foodName, (foodCount.get(m.foodName) || 0) + 1)
  }
  foodRank.value = [...foodCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))
}

function getDateRange(start: Date, end: Date): string[] {
  const dates: string[] = []
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function onModeChange() { loadData() }

onMounted(loadData)
</script>

<style scoped>
.chart-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}
.no-data {
  text-align: center;
  color: var(--text-secondary);
  padding: 60px 0;
}
.rank-list {
  padding-top: 4px;
}
.rank-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.rank-num {
  display: inline-block;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  background: var(--primary);
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
}
.rank-item:nth-child(n+4) .rank-num { background: #ccc; }
</style>
