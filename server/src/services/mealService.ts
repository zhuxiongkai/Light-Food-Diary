import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { pool } from '../db/connection.js'
import { mealRecords } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'

const db = drizzle(pool)

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

function isValidMealType(t: string): t is MealType {
  return ['breakfast', 'lunch', 'dinner', 'snack'].includes(t)
}

export interface MealInput {
  date: string
  mealType: string
  foodId: number
  foodName: string
  weight: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

export async function getMealsByDate(userId: number, date: string) {
  return db
    .select()
    .from(mealRecords)
    .where(
      and(
        eq(mealRecords.userId, userId),
        eq(mealRecords.date, sql`${date}` as any)
      )
    )
    .orderBy(mealRecords.createdAt)
}

export async function getMealsByDateRange(userId: number, start: string, end: string) {
  return db
    .select()
    .from(mealRecords)
    .where(
      and(
        eq(mealRecords.userId, userId),
        gte(mealRecords.date, sql`${start}` as any),
        lte(mealRecords.date, sql`${end}` as any)
      )
    )
    .orderBy(mealRecords.date, mealRecords.createdAt)
}

export async function getMealStats(userId: number, date: string) {
  const meals = await getMealsByDate(userId, date)

  const stats = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    byMealType: {} as Record<string, { calories: number; protein: number; fat: number; carbs: number }>,
  }

  for (const m of meals) {
    stats.calories += m.calories
    stats.protein += m.protein
    stats.fat += m.fat
    stats.carbs += m.carbs

    if (!stats.byMealType[m.mealType]) {
      stats.byMealType[m.mealType] = { calories: 0, protein: 0, fat: 0, carbs: 0 }
    }
    stats.byMealType[m.mealType].calories += m.calories
    stats.byMealType[m.mealType].protein += m.protein
    stats.byMealType[m.mealType].fat += m.fat
    stats.byMealType[m.mealType].carbs += m.carbs
  }

  return stats
}

export async function addMeal(userId: number, data: MealInput) {
  const mealType = isValidMealType(data.mealType) ? data.mealType : 'snack' as const

  const result = await db.insert(mealRecords).values({
    userId,
    date: sql`${data.date}` as any,
    mealType,
    foodId: data.foodId,
    foodName: data.foodName,
    weight: data.weight,
    calories: data.calories,
    protein: data.protein,
    fat: data.fat,
    carbs: data.carbs,
  })
  const id = Number(result[0].insertId)

  return { id, ...data, createdAt: Date.now() }
}

export async function updateMeal(userId: number, mealId: number, data: Partial<MealInput>) {
  const [existing] = await db
    .select()
    .from(mealRecords)
    .where(and(eq(mealRecords.id, mealId), eq(mealRecords.userId, userId)))
    .limit(1)

  if (!existing) {
    throw new AppError('记录不存在', 404)
  }

  const updateData: Record<string, any> = {}
  if (data.date !== undefined) updateData.date = sql`${data.date}`
  if (data.mealType !== undefined && isValidMealType(data.mealType)) updateData.mealType = data.mealType
  if (data.foodId !== undefined) updateData.foodId = data.foodId
  if (data.foodName !== undefined) updateData.foodName = data.foodName
  if (data.weight !== undefined) updateData.weight = data.weight
  if (data.calories !== undefined) updateData.calories = data.calories
  if (data.protein !== undefined) updateData.protein = data.protein
  if (data.fat !== undefined) updateData.fat = data.fat
  if (data.carbs !== undefined) updateData.carbs = data.carbs

  if (Object.keys(updateData).length === 0) {
    return existing
  }

  await db.update(mealRecords).set(updateData).where(eq(mealRecords.id, mealId))

  return { ...existing, ...data }
}

export async function deleteMeal(userId: number, mealId: number) {
  const [existing] = await db
    .select()
    .from(mealRecords)
    .where(and(eq(mealRecords.id, mealId), eq(mealRecords.userId, userId)))
    .limit(1)

  if (!existing) {
    throw new AppError('记录不存在', 404)
  }

  await db.delete(mealRecords).where(eq(mealRecords.id, mealId))
  return { success: true }
}
