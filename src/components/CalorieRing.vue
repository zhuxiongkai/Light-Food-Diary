<template>
  <div class="calorie-ring">
    <svg :width="size" :height="size" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="60" fill="none" stroke="var(--divider)" :stroke-width="strokeWidth" />
      <circle
        cx="70" cy="70" r="60"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        :stroke-dasharray="dashArray"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        transform="rotate(-90 70 70)"
        style="transition: stroke-dashoffset 0.6s ease"
      />
    </svg>
    <div class="ring-center">
      <span class="ring-caption">{{ centerLabel }}</span>
      <span class="ring-value numeric">{{ current }}</span>
      <span class="ring-label" v-if="showGoal">/ {{ goal }} {{ unit }}</span>
      <span class="ring-unit" v-else>{{ unit }}</span>
      <span class="ring-pct" v-if="showPercent && percent > 0">{{ percent }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  current: number
  goal: number
  size?: number
  color?: string
  unit?: string
  centerLabel?: string
  showGoal?: boolean
  showPercent?: boolean
}>(), {
  size: 180,
  color: '#2d6a4f',
  unit: '千卡',
  centerLabel: '已摄入',
  showGoal: false,
  showPercent: false
})

const strokeWidth = 10
const circumference = 2 * Math.PI * 60

const safeGoal = computed(() => Math.max(props.goal, 1))
const percent = computed(() => Math.min(Math.round((props.current / safeGoal.value) * 100), 100))
const dashArray = computed(() => {
  const ratio = Math.min(props.current / safeGoal.value, 1) * circumference
  return `${ratio} ${circumference * 2}`
})
const dashOffset = 0
</script>

<style scoped>
.calorie-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ring-center {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.15;
}
.ring-caption {
  font-size: 15px;
  color: var(--text-soft);
  margin-bottom: 2px;
}
.ring-value {
  font-size: 30px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -1.2px;
}
.ring-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.ring-unit {
  font-size: 17px;
  margin-top: 4px;
  color: var(--text-secondary);
}
.ring-pct {
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
  margin-top: 2px;
}
</style>
