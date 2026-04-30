import { eq, and, isNull, like, or } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { pool } from '../db/connection.js'
import { foods } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'

const db = drizzle(pool)

type FoodCategory = 'staple' | 'meat' | 'vegetable' | 'fruit' | 'snack' | 'drink' | 'custom'

export interface FoodResult {
  id: number
  name: string
  category: string
  caloriesPer100g: number
  protein: number
  fat: number
  carbs: number
  isBuiltin: boolean
}

export async function searchFoods(userId: number, keyword?: string, category?: string) {
  const conditions = [
    or(
      isNull(foods.userId),
      eq(foods.userId, userId)
    )
  ]

  if (category && isValidCategory(category)) {
    conditions.push(eq(foods.category, category))
  }

  if (keyword && keyword.trim()) {
    conditions.push(like(foods.name, `%${keyword.trim()}%`))
  }

  const results = await db
    .select()
    .from(foods)
    .where(and(...conditions))
    .orderBy(foods.name)
    .limit(100)

  return results.map(f => ({
    id: f.id,
    name: f.name,
    category: f.category,
    caloriesPer100g: f.caloriesPer100g,
    protein: f.protein,
    fat: f.fat,
    carbs: f.carbs,
    isBuiltin: f.userId === null,
  }))
}

function isValidCategory(c: string): c is FoodCategory {
  return ['staple', 'meat', 'vegetable', 'fruit', 'snack', 'drink', 'custom'].includes(c)
}

export async function addCustomFood(
  userId: number,
  data: { name: string; category: string; caloriesPer100g: number; protein: number; fat: number; carbs: number }
) {
  const category = isValidCategory(data.category) ? data.category : 'custom' as const

  const result = await db.insert(foods).values({
    userId,
    name: data.name,
    category,
    caloriesPer100g: data.caloriesPer100g,
    protein: data.protein,
    fat: data.fat,
    carbs: data.carbs,
  })
  const id = Number(result[0].insertId)

  return {
    id,
    name: data.name,
    category,
    caloriesPer100g: data.caloriesPer100g,
    protein: data.protein,
    fat: data.fat,
    carbs: data.carbs,
    isBuiltin: false,
  }
}

export async function updateCustomFood(userId: number, foodId: number, data: Partial<FoodResult>) {
  const [existing] = await db
    .select()
    .from(foods)
    .where(and(eq(foods.id, foodId), eq(foods.userId, userId)))
    .limit(1)

  if (!existing) {
    throw new AppError('食物不存在或无权修改', 404)
  }

  const updateData: Record<string, any> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.category !== undefined && isValidCategory(data.category)) updateData.category = data.category
  if (data.caloriesPer100g !== undefined) updateData.caloriesPer100g = data.caloriesPer100g
  if (data.protein !== undefined) updateData.protein = data.protein
  if (data.fat !== undefined) updateData.fat = data.fat
  if (data.carbs !== undefined) updateData.carbs = data.carbs

  await db.update(foods).set(updateData).where(eq(foods.id, foodId))

  return { ...existing, ...updateData }
}

export async function deleteCustomFood(userId: number, foodId: number) {
  const [existing] = await db
    .select()
    .from(foods)
    .where(and(eq(foods.id, foodId), eq(foods.userId, userId)))
    .limit(1)

  if (!existing) {
    throw new AppError('食物不存在或无权删除', 404)
  }

  await db.delete(foods).where(eq(foods.id, foodId))
  return { success: true }
}
