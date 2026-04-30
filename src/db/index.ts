import Dexie, { type Table } from 'dexie'
import type { MealRecord, WeightRecord, UserSettings, FoodItem } from '@/types'

export class CalorieDB extends Dexie {
  meals!: Table<MealRecord, number>
  customFoods!: Table<FoodItem, number>
  weightRecords!: Table<WeightRecord, number>
  userSettings!: Table<UserSettings, number>

  constructor() {
    super('CalorieTrackerDB')
    this.version(1).stores({
      meals: '++id, date, mealType, foodId',
      customFoods: '++id, name, category',
      weightRecords: '++id, date',
      userSettings: '++id'
    })
  }
}

export const db = new CalorieDB()
