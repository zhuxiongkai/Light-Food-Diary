import test from 'node:test'
import assert from 'node:assert/strict'
import {
  enrichRecognitionWithNutrition,
  findFoodNutritionMatch,
  type NutritionFood,
} from '../server/src/services/foodMatcher.ts'
import { seedFoods } from '../server/src/data/seedFoods.ts'

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
]

const seededFoods: NutritionFood[] = seedFoods.map((food, index) => ({
  id: index + 1,
  name: food.name,
  category: food.category,
  caloriesPer100g: food.caloriesPer100g,
  protein: food.protein,
  fat: food.fat,
  carbs: food.carbs,
  isBuiltin: true,
}))

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

test('matches Baidu-style common food names through aliases', () => {
  const cases = [
    ['青菜', '油菜'],
    ['番茄鸡蛋', '西红柿炒鸡蛋'],
    ['米线', '米线'],
    ['云吞', '馄饨'],
    ['鸡排', '鸡排'],
    ['肉夹馍', '肉夹馍'],
    ['凉面', '凉面'],
    ['炒青菜', '清炒青菜'],
  ] as const

  for (const [input, expected] of cases) {
    assert.equal(findFoodNutritionMatch(input, seededFoods)?.food.name, expected, input)
  }
})

test('seed food database covers high-frequency recognition results', () => {
  const requiredFoods = [
    '米线',
    '河粉',
    '酸辣粉',
    '螺蛳粉',
    '热干面',
    '小笼包',
    '肉夹馍',
    '鸡排',
    '炸鸡',
    '汉堡',
    '披萨',
    '寿司',
    '三明治',
    '沙拉',
    '清炒青菜',
    '手撕包菜',
  ]

  const seededNames = new Set(seedFoods.map((food) => food.name))
  for (const name of requiredFoods) {
    assert.ok(seededNames.has(name), `${name} should be in seedFoods`)
  }
})
