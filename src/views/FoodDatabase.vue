<template>
  <div class="page">
    <div class="page-header flex-between">
      <span>食物库</span>
      <van-button size="small" type="primary" @click="showAdd = true">添加</van-button>
    </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Field, Button, Dialog, showToast } from 'vant'
import FoodSearch from '@/components/FoodSearch.vue'
import { useFoodStore } from '@/stores/foodStore'
import type { FoodItem } from '@/types'

const foodStore = useFoodStore()
const showAdd = ref(false)
const form = ref({ name: '', caloriesPer100g: 0, protein: 0, fat: 0, carbs: 0 })

onMounted(() => foodStore.loadAllFoods())

function onSelect(food: FoodItem) {
  // View food detail — could navigate or show detail
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
    caloriesPer100g: form.value.caloriesPer100g,
    protein: form.value.protein,
    fat: form.value.fat,
    carbs: form.value.carbs
  })
  showToast('添加成功')
  form.value = { name: '', caloriesPer100g: 0, protein: 0, fat: 0, carbs: 0 }
}
</script>

<style scoped>
.add-form {
  padding: 12px 0;
}
</style>
