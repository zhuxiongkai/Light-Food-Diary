export type ServingUnit = '份' | '碗' | '个' | '杯' | '瓶' | '片' | '根'

export interface ServingOption {
  label: string
  multiplier: number
  weight: number
}

export type NutritionSource = 'food-db' | 'alias' | 'unknown'

export interface FoodItem {
  id: number | string
  name: string
  category: 'staple' | 'meat' | 'vegetable' | 'fruit' | 'snack' | 'drink' | 'custom'
  caloriesPer100g: number
  protein: number
  fat: number
  carbs: number
  defaultServingWeight?: number
  servingUnit?: ServingUnit
  servingOptions?: ServingOption[]
}

export interface MealRecord {
  id?: number
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodId: number
  foodName: string
  weight: number
  calories: number
  protein: number
  fat: number
  carbs: number
  createdAt?: number
}

export interface WeightRecord {
  id?: number
  date: string
  weight: number
  createdAt?: number
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high'
export type CalorieGoalMode = 'maintain' | 'fat_loss' | 'muscle_gain'

export interface UserSettings {
  id?: number
  dailyCalorieGoal: number
  proteinRatio: number
  fatRatio: number
  carbsRatio: number
  height: number
  weight: number
  age: number
  gender: 'male' | 'female'
  weightGoal: number
  activityLevel: ActivityLevel
  calorieGoalMode: CalorieGoalMode
}

export interface AiRecognitionResult {
  foodName: string
  estimatedWeight: number
  estimatedCalories: number
  confidence: number
  matchedFoodId?: number
  matchedFoodName?: string
  protein?: number
  fat?: number
  carbs?: number
  nutritionSource?: NutritionSource
}

export interface TemplateFoodItem {
  foodId: number
  foodName: string
  weight: number
  caloriesPer100g: number
  protein: number
  fat: number
  carbs: number
}

export interface MealTemplate {
  id?: number
  name: string
  mealType: MealType
  foods: TemplateFoodItem[]
  createdAt?: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type FoodCategory = 'staple' | 'meat' | 'vegetable' | 'fruit' | 'snack' | 'drink' | 'custom'

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
}

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  custom: '自定义',
  staple: '主食',
  meat: '肉类',
  vegetable: '蔬菜',
  fruit: '水果',
  snack: '零食',
  drink: '饮品'
}
