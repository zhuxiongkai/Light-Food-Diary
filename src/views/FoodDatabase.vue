<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">食物库</h1>
      <van-button size="small" type="primary" round @click="showAdd = true">添加</van-button>
    </header>
    <FoodSearch :showDelete="true" @select="onSelect" @delete="onDelete" />

    <van-dialog v-model:show="showAdd" title="添加自定义食物" show-cancel-button @confirm="onAdd">
      <div class="add-form">
        <van-field v-model="form.name" label="名称" placeholder="食物名称" />
        <van-field v-model="form.caloriesPer100g" type="number" label="热量/100g" placeholder="kcal" />
        <van-field v-model="form.protein" type="number" label="蛋白质/100g" placeholder="g" />
        <van-field v-model="form.fat" type="number" label="脂肪/100g" placeholder="g" />
        <van-field v-model="form.carbs" type="number" label="碳水/100g" placeholder="g" />
      </div>
    </van-dialog>

    <van-dialog
      v-model:show="showDetail"
      :title="detailTitle"
      :show-cancel-button="isCustomFood"
      :confirm-button-text="isCustomFood ? '保存' : '关闭'"
      @confirm="onSaveDetail"
    >
      <div v-if="selectedFood" class="add-form">
        <template v-if="isCustomFood">
          <van-field v-model="detailForm.name" label="名称" placeholder="食物名称" />
          <van-field v-model="detailForm.caloriesPer100g" type="number" label="热量/100g" placeholder="kcal" />
          <van-field v-model="detailForm.protein" type="number" label="蛋白质/100g" placeholder="g" />
          <van-field v-model="detailForm.fat" type="number" label="脂肪/100g" placeholder="g" />
          <van-field v-model="detailForm.carbs" type="number" label="碳水/100g" placeholder="g" />
        </template>
        <template v-else>
          <div class="food-meta-row"><span>分类</span><strong>{{ categoryLabel(selectedFood.category) }}</strong></div>
          <div class="food-meta-row"><span>热量</span><strong>{{ selectedFood.caloriesPer100g }} kcal/100g</strong></div>
          <div class="food-meta-row"><span>蛋白质</span><strong>{{ selectedFood.protein }} g</strong></div>
          <div class="food-meta-row"><span>脂肪</span><strong>{{ selectedFood.fat }} g</strong></div>
          <div class="food-meta-row"><span>碳水</span><strong>{{ selectedFood.carbs }} g</strong></div>
          <p class="readonly-tip">内置食物仅可查看，不支持编辑。</p>
        </template>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Field, Button, Dialog, showToast } from 'vant'
import FoodSearch from '@/components/FoodSearch.vue'
import { useFoodStore } from '@/stores/foodStore'
import { FOOD_CATEGORY_LABELS, type FoodCategory, type FoodItem } from '@/types'

const foodStore = useFoodStore()
const showAdd = ref(false)
const showDetail = ref(false)
const selectedFood = ref<FoodItem | null>(null)
const form = ref({ name: '', caloriesPer100g: 0, protein: 0, fat: 0, carbs: 0 })
const detailForm = ref({ name: '', caloriesPer100g: 0, protein: 0, fat: 0, carbs: 0 })

const isCustomFood = computed(() => selectedFood.value?.category === 'custom')
const detailTitle = computed(() => {
  if (!selectedFood.value) return '食物详情'
  return isCustomFood.value ? `编辑 · ${selectedFood.value.name}` : `详情 · ${selectedFood.value.name}`
})

onMounted(() => foodStore.loadAllFoods())

function onSelect(food: FoodItem) {
  selectedFood.value = food
  detailForm.value = {
    name: food.name,
    caloriesPer100g: food.caloriesPer100g,
    protein: food.protein,
    fat: food.fat,
    carbs: food.carbs,
  }
  showDetail.value = true
}

async function onDelete(food: FoodItem) {
  await foodStore.deleteCustomFood(food.id)
  showToast('已删除')
}

async function onAdd() {
  if (!form.value.name || form.value.caloriesPer100g <= 0) {
    showToast('请填写名称和热量')
    return
  }
  await foodStore.addCustomFood({
    name: form.value.name,
    category: 'custom',
    caloriesPer100g: Number(form.value.caloriesPer100g),
    protein: Number(form.value.protein),
    fat: Number(form.value.fat),
    carbs: Number(form.value.carbs)
  })
  showToast('添加成功')
  form.value = { name: '', caloriesPer100g: 0, protein: 0, fat: 0, carbs: 0 }
}

async function onSaveDetail() {
  if (!selectedFood.value) return
  if (!isCustomFood.value) {
    return
  }

  if (!detailForm.value.name || detailForm.value.caloriesPer100g <= 0) {
    showToast('请填写名称和热量')
    return
  }

  await foodStore.updateCustomFood(selectedFood.value.id, {
    name: detailForm.value.name,
    caloriesPer100g: Number(detailForm.value.caloriesPer100g),
    protein: Number(detailForm.value.protein),
    fat: Number(detailForm.value.fat),
    carbs: Number(detailForm.value.carbs),
  })

  showToast('已保存')
}

function categoryLabel(category: FoodCategory) {
  return FOOD_CATEGORY_LABELS[category] || category
}
</script>

<style scoped>
.add-form {
  padding: 12px 0;
}

.food-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.food-meta-row:last-of-type {
  border-bottom: none;
}

.food-meta-row span {
  color: var(--text-secondary);
}

.food-meta-row strong {
  color: var(--text);
  font-weight: 700;
}

.readonly-tip {
  margin: 10px 4px 0;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
