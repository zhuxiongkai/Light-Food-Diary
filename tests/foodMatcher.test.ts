import test from 'node:test'
import assert from 'node:assert/strict'
import {
  enrichRecognitionWithNutrition,
  findFoodNutritionMatch,
  type NutritionFood,
} from '../server/src/services/foodMatcher.ts'

const foods: NutritionFood[] = [
  {
    id: 1,
    name: '米饭',
    category: 'staple',
    caloriesPer100g: 116,
    protein: 2.6,
    fat: 0.3,
    carbs: 25.9,
    isBuiltin: true,
  },
  {
    id: 2,
    name: '西红柿炒鸡蛋',
    category: 'meat',
    caloriesPer100g: 83,
    protein: 4.2,
    fat: 5.8,
    carbs: 3.8,
    isBuiltin: true,
  },
  {
    id: 3,
    name: '猪排骨',
    category: 'meat',
    caloriesPer100g: 264,
    protein: 18.3,
    fat: 20.4,
    carbs: 1.7,
    isBuiltin: true,
  },
  {
    id: 4,
    name: '基围虾',
    category: 'meat',
    caloriesPer100g: 99,
    protein: 18.6,
    fat: 1.4,
    carbs: 2.8,
    isBuiltin: true,
  },
  {
    id: 5,
    name: '西红柿',
    category: 'vegetable',
    caloriesPer100g: 18,
    protein: 0.9,
    fat: 0.2,
    carbs: 3.9,
    isBuiltin: true,
  },
  {
    id: 6,
    name: '白粥',
    category: 'staple',
    caloriesPer100g: 46,
    protein: 1.1,
    fat: 0.2,
    carbs: 9.7,
    isBuiltin: true,
  },
  {
    id: 7,
    name: '包子(猪肉)',
    category: 'staple',
    caloriesPer100g: 227,
    protein: 7.3,
    fat: 10.0,
    carbs: 28.6,
    isBuiltin: true,
  },
  {
    id: 8,
    name: '煎蛋',
    category: 'meat',
    caloriesPer100g: 175,
    protein: 11.8,
    fat: 13.5,
    carbs: 1.5,
    isBuiltin: true,
  },
  {
    id: 9,
    name: '牛肉面',
    category: 'staple',
    caloriesPer100g: 98,
    protein: 4.8,
    fat: 2.6,
    carbs: 14.5,
    isBuiltin: true,
  },
  {
    id: 10,
    name: '卷心菜',
    category: 'vegetable',
    caloriesPer100g: 20,
    protein: 1.3,
    fat: 0.2,
    carbs: 3.4,
    isBuiltin: true,
  },
]

test('matches common aliases to food database nutrition', () => {
  assert.equal(findFoodNutritionMatch('白米饭', foods)?.food.name, '米饭')
  assert.equal(findFoodNutritionMatch('番茄炒蛋', foods)?.food.name, '西红柿炒鸡蛋')
})

test('enriches recognition with matched macros per 100g', () => {
  const result = enrichRecognitionWithNutrition(
    { foodName: '番茄炒蛋', estimatedWeight: 100, estimatedCalories: 0, confidence: 0.9 },
    foods
  )

  assert.equal(result.matchedFoodId, 2)
  assert.equal(result.estimatedCalories, 83)
  assert.equal(result.protein, 4.2)
  assert.equal(result.fat, 5.8)
  assert.equal(result.carbs, 3.8)
  assert.equal(result.nutritionSource, 'alias')
})

test('keeps unknown foods explicit without inventing macros', () => {
  const result = enrichRecognitionWithNutrition(
    { foodName: '神秘料理', estimatedWeight: 100, estimatedCalories: 123, confidence: 0.8 },
    foods
  )

  assert.equal(result.matchedFoodId, 0)
  assert.equal(result.protein, 0)
  assert.equal(result.fat, 0)
  assert.equal(result.carbs, 0)
  assert.equal(result.nutritionSource, 'unknown')
})

test('matches expanded meat and protein aliases', () => {
  assert.equal(findFoodNutritionMatch('排骨', foods)?.food.name, '猪排骨')
  assert.equal(findFoodNutritionMatch('小排', foods)?.food.name, '猪排骨')
  assert.equal(findFoodNutritionMatch('虾', foods)?.food.name, '基围虾')
  assert.equal(findFoodNutritionMatch('对虾', foods)?.food.name, '基围虾')
  assert.equal(findFoodNutritionMatch('大虾', foods)?.food.name, '基围虾')
})

test('matches tomato alias to 西红柿', () => {
  assert.equal(findFoodNutritionMatch('番茄', foods)?.food.name, '西红柿')
  assert.equal(findFoodNutritionMatch('圣女果', foods)?.food.name, '西红柿')
})

test('matches porridge aliases to 白粥', () => {
  assert.equal(findFoodNutritionMatch('粥', foods)?.food.name, '白粥')
  assert.equal(findFoodNutritionMatch('稀饭', foods)?.food.name, '白粥')
  assert.equal(findFoodNutritionMatch('白米粥', foods)?.food.name, '白粥')
})

test('matches bun aliases to 包子(猪肉)', () => {
  assert.equal(findFoodNutritionMatch('包子', foods)?.food.name, '包子(猪肉)')
  assert.equal(findFoodNutritionMatch('小笼包', foods)?.food.name, '包子(猪肉)')
  assert.equal(findFoodNutritionMatch('肉包子', foods)?.food.name, '包子(猪肉)')
})

test('matches egg dish aliases to 煎蛋', () => {
  assert.equal(findFoodNutritionMatch('荷包蛋', foods)?.food.name, '煎蛋')
  assert.equal(findFoodNutritionMatch('太阳蛋', foods)?.food.name, '煎蛋')
})

test('matches noodle dish aliases to 牛肉面', () => {
  assert.equal(findFoodNutritionMatch('兰州拉面', foods)?.food.name, '牛肉面')
  assert.equal(findFoodNutritionMatch('汤面', foods)?.food.name, '牛肉面')
})

test('matches cabbage aliases to 卷心菜', () => {
  assert.equal(findFoodNutritionMatch('包菜', foods)?.food.name, '卷心菜')
  assert.equal(findFoodNutritionMatch('圆白菜', foods)?.food.name, '卷心菜')
  assert.equal(findFoodNutritionMatch('洋白菜', foods)?.food.name, '卷心菜')
})
