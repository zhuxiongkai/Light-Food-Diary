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
