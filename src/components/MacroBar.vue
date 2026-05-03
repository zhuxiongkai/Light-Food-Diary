<template>
  <div class="macro-bar">
    <div class="macro-header flex-between mb-8">
      <span class="macro-title">营养素</span>
    </div>
    <div class="macro-item" v-for="item in items" :key="item.label">
      <div class="macro-label flex-between mb-8">
        <span>{{ item.label }}</span>
        <span class="numeric">{{ item.current }}g / {{ item.goal }}g</span>
      </div>
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: item.pct + '%', background: item.color }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  protein: number
  fat: number
  carbs: number
  proteinGoal: number
  fatGoal: number
  carbsGoal: number
}>()

const items = computed(() => [
  {
    label: '蛋白质',
    current: Math.round(props.protein),
    goal: Math.round(props.proteinGoal),
    pct: Math.min(Math.round((props.protein / props.proteinGoal) * 100) || 0, 100),
    color: 'var(--protein)'
  },
  {
    label: '脂肪',
    current: Math.round(props.fat),
    goal: Math.round(props.fatGoal),
    pct: Math.min(Math.round((props.fat / props.fatGoal) * 100) || 0, 100),
    color: 'var(--fat)'
  },
  {
    label: '碳水',
    current: Math.round(props.carbs),
    goal: Math.round(props.carbsGoal),
    pct: Math.min(Math.round((props.carbs / props.carbsGoal) * 100) || 0, 100),
    color: 'var(--carbs)'
  }
])
</script>

<style scoped>
.macro-title {
  font-size: 14px;
  font-weight: 600;
}
.macro-item {
  margin-bottom: 14px;
}
.macro-label span {
  font-size: 13px;
}
.macro-label span:first-child {
  font-weight: 500;
}
.progress-track {
  height: 8px;
  background: var(--divider);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}
</style>
