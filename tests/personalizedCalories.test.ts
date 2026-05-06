import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateAbsorptionCoefficient,
  calculateBmi,
  calculateBmr,
  calculateDailyCalorieTarget,
  calculateTdee,
  personalizeCalories,
} from '../src/utils/personalizedCalories.ts'

test('calculates BMR and TDEE with the Mifflin-St Jeor formula from issue 8', () => {
  const profile = { gender: 'female' as const, weight: 50, height: 160, age: 20 }

  assert.equal(calculateBmr(profile), 1239)
  assert.equal(calculateTdee({ ...profile, activityLevel: 'sedentary' }), 1487)
})

test('derives daily calorie targets from TDEE and goal mode', () => {
  const profile = { gender: 'female' as const, weight: 50, height: 160, age: 20, activityLevel: 'sedentary' as const }

  assert.equal(calculateDailyCalorieTarget({ ...profile, calorieGoalMode: 'maintain' }), 1487)
  assert.equal(calculateDailyCalorieTarget({ ...profile, calorieGoalMode: 'fat_loss' }), 1087)
  assert.equal(calculateDailyCalorieTarget({ ...profile, calorieGoalMode: 'muscle_gain' }), 1737)
})

test('applies BMI-based absorption correction to recorded calories', () => {
  assert.equal(calculateBmi({ weight: 50, height: 160 }), 19.5)
  assert.equal(calculateAbsorptionCoefficient({ weight: 50, height: 160 }), 1)
  assert.equal(calculateAbsorptionCoefficient({ weight: 45, height: 170 }), 1.13)
  assert.equal(calculateAbsorptionCoefficient({ weight: 78, height: 170 }), 0.93)
  assert.equal(calculateAbsorptionCoefficient({ weight: 90, height: 170 }), 0.83)

  assert.equal(personalizeCalories(200, { weight: 78, height: 170 }), 186)
})
