<template>
  <div class="meal-card">
    <div class="meal-header flex-between">
      <span class="meal-type">{{ label }}</span>
      <span class="meal-calories numeric">{{ totalCalories }} kcal</span>
    </div>
    <div class="meal-macros" v-if="totalCalories > 0">
      <span>蛋白质 {{ totalProtein }}g</span>
      <span>脂肪 {{ totalFat }}g</span>
      <span>碳水 {{ totalCarbs }}g</span>
    </div>
    <div v-if="items.length > 0" class="meal-items">
      <div v-for="item in items" :key="item.id" class="meal-item flex-between">
        <div>
          <span class="food-title">{{ item.foodName }}</span>
          <span class="food-weight">{{ item.weight }}g</span>
        </div>
        <div class="flex-row">
          <span class="item-cal numeric">{{ item.calories }} kcal</span>
          <van-icon v-if="editable" name="delete-o" class="del-btn" @click="$emit('delete', item)" />
        </div>
      </div>
    </div>
    <div v-else class="meal-empty">暂无记录</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from 'vant'
import type { MealRecord, MealType } from '@/types'
import { MEAL_TYPE_LABELS } from '@/types'

const props = defineProps<{
  type: MealType
  items: MealRecord[]
  editable?: boolean
}>()

defineEmits<{
  delete: [item: MealRecord]
}>()

const label = computed(() => MEAL_TYPE_LABELS[props.type])
const totalCalories = computed(() => props.items.reduce((s, i) => s + i.calories, 0))
const totalProtein = computed(() => props.items.reduce((s, i) => s + i.protein, 0))
const totalFat = computed(() => props.items.reduce((s, i) => s + i.fat, 0))
const totalCarbs = computed(() => props.items.reduce((s, i) => s + i.carbs, 0))
</script>

<style scoped>
.meal-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 14px 16px;
  margin: 10px 16px;
  box-shadow: var(--shadow);
}
.meal-header {
  margin-bottom: 6px;
}
.meal-type {
  font-size: 16px;
  font-weight: 600;
}
.meal-calories {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
}
.meal-macros {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.meal-items {
  border-top: 1px solid var(--border);
  padding-top: 8px;
}
.meal-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.meal-item:last-child { border-bottom: none; }
.food-title { font-size: 14px; margin-right: 8px; }
.food-weight { font-size: 12px; color: var(--text-secondary); }
.item-cal { font-size: 14px; font-weight: 500; margin-right: 8px; }
.del-btn { color: var(--danger); font-size: 16px; }
.meal-empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 20px 0 8px;
  font-size: 13px;
}
</style>
