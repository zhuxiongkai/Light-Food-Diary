import type { MealType } from '../types/index.ts'

export function getMealTypeForTime(date = new Date()): MealType {
  const hour = date.getHours()

  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 14) return 'lunch'
  if (hour >= 17 && hour < 21) return 'dinner'
  return 'snack'
}
