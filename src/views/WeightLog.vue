<template>
  <div class="page">
    <div class="page-header flex-between">
      <span>体重记录</span>
      <van-button size="small" type="primary" @click="showAdd = true">记录</van-button>
    </div>

    <!-- BMI Card -->
    <div class="card">
      <div class="flex-between">
        <div>
          <div class="bmi-label">当前体重</div>
          <div class="bmi-value">{{ latestWeight }} <span class="unit">kg</span></div>
        </div>
        <div>
          <div class="bmi-label">BMI</div>
          <div class="bmi-value">{{ bmi }} <span class="unit">kg/m²</span></div>
        </div>
        <div>
          <div class="bmi-label">目标体重</div>
          <div class="bmi-value">{{ settings.weightGoal }} <span class="unit">kg</span></div>
        </div>
      </div>
    </div>

    <!-- Trend Chart -->
    <div class="card" v-if="chartOption">
      <div class="chart-title">体重趋势</div>
      <v-chart :option="chartOption" style="height:220px" autoresize />
    </div>

    <!-- Records list -->
    <div class="card" v-if="weightStore.records.length > 0">
      <div class="section-title mb-12">历史记录</div>
      <div v-for="r in weightStore.records" :key="r.id" class="record-row flex-between">
        <span>{{ r.date }}</span>
        <div class="flex-row">
          <span class="weight-val numeric">{{ r.weight }} kg</span>
          <van-icon name="delete-o" class="del-btn" @click="onDelete(r.id!)" />
        </div>
      </div>
    </div>

    <van-dialog v-model:show="showAdd" title="记录体重" show-cancel-button @confirm="onAdd">
      <div class="add-form">
        <van-field v-model="newWeight" type="number" label="体重(kg)" placeholder="输入体重" />
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Field, Button, Icon, Dialog, showToast } from 'vant'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useWeightStore } from '@/stores/weightStore'
import { useSettingsStore } from '@/stores/settingsStore'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const weightStore = useWeightStore()
const settingsStore = useSettingsStore()

const showAdd = ref(false)
const newWeight = ref('')

const settings = computed(() => settingsStore.settings)

const latestWeight = computed(() => {
  if (weightStore.records.length === 0) return '-'
  return weightStore.records[0].weight
})

const bmi = computed(() => {
  const h = settings.value.height / 100
  const w = typeof latestWeight.value === 'number' ? latestWeight.value : settings.value.weight
  if (h <= 0) return '-'
  return (w / (h * h)).toFixed(1)
})

const chartOption = computed(() => {
  if (weightStore.records.length < 2) return null
  const reversed = [...weightStore.records].reverse()
  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 16, right: 16, top: 8, bottom: 16 },
    xAxis: {
      type: 'category' as const,
      data: reversed.map(r => r.date.slice(5)),
      axisLabel: { fontSize: 11 }
    },
    yAxis: { type: 'value' as const, axisLabel: { fontSize: 11 }, name: 'kg' },
    series: [{
      type: 'line' as const,
      data: reversed.map(r => r.weight),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#FF9800' },
      markLine: {
        silent: true,
        data: [{ yAxis: settings.value.weightGoal, label: { formatter: '目标' }, lineStyle: { color: '#4CAF50', type: 'dashed' } }]
      }
    }]
  }
})

async function onAdd() {
  const w = parseFloat(newWeight.value)
  if (isNaN(w) || w <= 0) { showToast('请输入有效体重'); return }
  await weightStore.addRecord(w)
  showToast('已记录')
  newWeight.value = ''
}

async function onDelete(id: number) {
  await weightStore.deleteRecord(id)
  showToast('已删除')
}

onMounted(async () => {
  await Promise.all([weightStore.loadRecords(), settingsStore.loadSettings()])
})
</script>

<style scoped>
.bmi-label { font-size: 12px; color: var(--text-secondary); }
.bmi-value { font-size: 24px; font-weight: 700; margin-top: 2px; }
.unit { font-size: 13px; font-weight: 400; color: var(--text-secondary); }
.chart-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.section-title { font-size: 14px; font-weight: 600; }
.record-row {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.record-row:last-child { border-bottom: none; }
.weight-val { font-size: 15px; font-weight: 600; margin-right: 12px; }
.del-btn { color: var(--danger); font-size: 16px; }
.add-form { padding: 12px 0; }
</style>
