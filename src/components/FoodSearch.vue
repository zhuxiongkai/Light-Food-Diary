<template>
  <div class="food-search">
    <van-search v-model="keyword" shape="round" placeholder="搜索食物..." @input="onSearch" />
    <van-tabs v-model:active="activeCategory" animated swipeable @change="onCategoryChange">
      <van-tab v-for="cat in categories" :key="cat.value" :title="cat.label" />
    </van-tabs>
    <div class="food-list">
      <div v-if="foodStore.loading" class="empty-tip">正在加载食物...</div>
      <div v-else-if="filtered.length === 0" class="empty-tip">暂无匹配的食物</div>
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
          <span class="macro">蛋{{ food.protein }}g</span>
          <span class="macro">脂{{ food.fat }}g</span>
          <span class="macro">碳{{ food.carbs }}g</span>
        </div>
        <van-icon v-if="showDelete && food.category === 'custom'" name="delete-o" class="delete-icon" @click.stop="$emit('delete', food)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
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
const debouncedKeyword = ref('')
const activeCategory = ref(0)
let keywordTimer: number | null = null

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
  return foodStore.searchFoods(debouncedKeyword.value, cat as FoodCategory | undefined)
})

onMounted(async () => {
  if (foodStore.allFoods.length === 0) {
    await foodStore.loadAllFoods()
  }
})

watch(keyword, (value) => {
  if (keywordTimer) {
    window.clearTimeout(keywordTimer)
  }
  keywordTimer = window.setTimeout(() => {
    debouncedKeyword.value = value
  }, 250)
})

onBeforeUnmount(() => {
  if (keywordTimer) {
    window.clearTimeout(keywordTimer)
    keywordTimer = null
  }
})

function onSearch() {
  // handled by debounced watcher
}
function onCategoryChange() {}
</script>

<style scoped>
.food-list {
  padding: 0 12px;
}
.food-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  column-gap: 12px;
  padding: 14px 12px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.food-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.food-name {
  font-size: 15px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.food-meta {
  font-size: 12px;
  color: var(--text-secondary);
}
.food-macros {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 0;
  max-width: 150px;
  line-height: 1.35;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.macro {
  flex: 0 0 auto;
  white-space: nowrap;
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
