<template>
  <div class="page weight-page">
    <header class="page-header">
      <h1 class="page-title">体重记录</h1>
      <van-button size="small" type="primary" round @click="showAdd = true">记录</van-button>
    </header>

    <section class="card bmi-card">
      <div class="bmi-grid">
        <div class="bmi-item">
          <span class="bmi-label">当前体重</span>
          <strong class="bmi-value numeric">{{ latestWeight }} <small>kg</small></strong>
        </div>
        <div class="bmi-item">
          <span class="bmi-label">BMI</span>
          <strong class="bmi-value numeric">{{ bmi }} <small>kg/m²</small></strong>
        </div>
        <div class="bmi-item">
          <span class="bmi-label">目标体重</span>
          <strong class="bmi-value numeric">{{ settings.weightGoal }} <small>kg</small></strong>
        </div>
      </div>
    </section>

    <section class="card chart-card" v-if="chartOption">
      <h2 class="section-heading">体重趋势</h2>
      <v-chart :option="chartOption" style="height:220px" autoresize />
    </section>

    <section class="card history-card" v-if="weightStore.records.length > 0">
      <h2 class="section-heading">历史记录</h2>
      <div v-for="r in weightStore.records" :key="r.id" class="record-row">
        <span>{{ r.date }}</span>
        <div class="record-right">
          <span class="weight-val numeric">{{ r.weight }} kg</span>
          <van-icon name="delete-o" class="del-btn" @click="onDelete(r.id!)" />
        </div>
      </div>
    </section>

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
      axisLabel: { fontSize: 11, color: 'var(--chart-label)' }
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 11, color: 'var(--chart-label)' },
      name: 'kg',
      splitLine: { lineStyle: { color: 'var(--chart-split)' } }
    },
    series: [{
      type: 'line' as const,
      data: reversed.map(r => r.weight),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#b7844a' },
      markLine: {
        silent: true,
        data: [{ yAxis: settings.value.weightGoal, label: { formatter: '目标' }, lineStyle: { color: '#2d6a4f', type: 'dashed' } }]
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
.weight-page {
  padding: 54px 16px calc(92px + var(--safe-bottom));
}

.bmi-card {
  margin-bottom: 16px;
}

.bmi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  text-align: center;
}

.bmi-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bmi-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.bmi-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
}

.bmi-value small {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 2px;
}

.chart-card {
  margin-bottom: 16px;
}

.chart-card .section-heading {
  margin-bottom: 8px;
}

.history-card .section-heading {
  margin-bottom: 12px;
}

.record-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--divider);
  font-size: 14px;
  color: var(--text);
}

.record-row:last-child {
  border-bottom: none;
}

.record-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.weight-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.del-btn {
  color: var(--danger);
  font-size: 18px;
}

.add-form {
  padding: 12px 0;
}
</style>
