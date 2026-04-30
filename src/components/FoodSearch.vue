<template>
  <div class="food-search">
    <van-search v-model="keyword" shape="round" placeholder="搜索食物..." @input="onSearch" />
    <van-tabs v-model:active="activeCategory" animated swipeable @change="onCategoryChange">
      <van-tab v-for="cat in categories" :key="cat.value" :title="cat.label" />
    </van-tabs>
    <div class="food-list">
      <div v-if="filtered.length === 0" class="empty-tip">暂无匹配的食物</div>
      <div
        v-for="food in filtered"
        :key="food.id"
        class="food-item"
        @click="$emit('select', food)"
      >
        <div class="food-info">
          <span class="food-name">{{ food.name }}</span>
          <span class="food-meta">{{ food.caloriesPer100g }} kcal/100g</span>
        </div>
        <div class="food-macros">
          <span class="macro">蛋白{{ food.protein }}g</span>
          <span class="macro">脂肪{{ food.fat }}g</span>
          <span class="macro">碳水{{ food.carbs }}g</span>
        </div>
        <van-icon v-if="showDelete && food.category === 'custom'" name="delete-o" class="delete-icon" @click.stop="$emit('delete', food)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, Tabs, Tab, Icon } from 'vant'
import { FOOD_CATEGORY_LABELS, type FoodCategory, type FoodItem } from '@/types'
import { useFoodStore } from '@/stores/foodStore'

const props = defineProps<{
  showDelete?: boolean
}>()

defineEmits<{
  select: [food: FoodItem]
  delete: [food: FoodItem]
}>()

const foodStore = useFoodStore()
const keyword = ref('')
const activeCategory = ref(0)

const categories = computed(() => [
  { label: '全部', value: '' },
  ...Object.entries(FOOD_CATEGORY_LABELS).map(([value, label]) => ({ label, value }))
])

const currentCategory = computed(() => {
  const cat = categories.value[activeCategory.value]
  return cat ? (cat.value as FoodCategory | '') : ''
})

const filtered = computed(() => {
  const cat = currentCategory.value || undefined
  return foodStore.searchFoods(keyword.value, cat as FoodCategory | undefined)
})

function onSearch() {}
function onCategoryChange() {}
</script>

<style scoped>
.food-list {
  padding: 0 12px;
}
.food-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.food-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.food-name {
  font-size: 15px;
  font-weight: 500;
}
.food-meta {
  font-size: 12px;
  color: var(--text-secondary);
}
.food-macros {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary);
}
.delete-icon {
  color: var(--danger);
  font-size: 18px;
  margin-left: 8px;
}
.empty-tip {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 0;
}
</style>
