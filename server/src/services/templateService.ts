import { eq, and } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { pool } from '../db/connection.js'
import { mealTemplates } from '../db/schema.js'

const db = drizzle(pool)
import { AppError } from '../middleware/errorHandler.js'

export interface TemplateFood {
  foodId: number
  foodName: string
  weight: number
  caloriesPer100g: number
  protein: number
  fat: number
  carbs: number
}

export interface TemplateInput {
  name: string
  mealType: string
  foods: TemplateFood[]
}

function isValidMealType(t: string): t is 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  return ['breakfast', 'lunch', 'dinner', 'snack'].includes(t)
}

export async function getUserTemplates(userId: number) {
  const rows = await db
    .select()
    .from(mealTemplates)
    .where(eq(mealTemplates.userId, userId))
    .orderBy(mealTemplates.createdAt)

  return rows.map((row) => ({
    ...row,
    foods: typeof row.foods === 'string' ? JSON.parse(row.foods) : row.foods,
  }))
}

export async function createTemplate(userId: number, data: TemplateInput) {
  if (!data.name || !data.mealType || !Array.isArray(data.foods) || data.foods.length === 0) {
    throw new AppError('模板名称、餐别和食物列表不能为空', 400)
  }
  const mealType = isValidMealType(data.mealType) ? data.mealType : 'snack'

  const result = await db.insert(mealTemplates).values({
    userId,
    name: data.name,
    mealType,
    foods: JSON.stringify(data.foods),
  })
  const id = Number(result[0].insertId)
  return { id, name: data.name, mealType, foods: data.foods }
}

export async function updateTemplate(userId: number, templateId: number, data: Partial<TemplateInput>) {
  const [existing] = await db
    .select()
    .from(mealTemplates)
    .where(and(eq(mealTemplates.id, templateId), eq(mealTemplates.userId, userId)))
    .limit(1)

  if (!existing) throw new AppError('模板不存在', 404)

  const updateData: Record<string, any> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.mealType !== undefined && isValidMealType(data.mealType)) updateData.mealType = data.mealType
  if (data.foods !== undefined) updateData.foods = JSON.stringify(data.foods)

  if (Object.keys(updateData).length === 0) {
    return { ...existing, foods: JSON.parse(String(existing.foods)) }
  }

  await db.update(mealTemplates).set(updateData).where(eq(mealTemplates.id, templateId))

  const updated = { ...existing, ...updateData }
  return { ...updated, foods: typeof updated.foods === 'string' ? JSON.parse(updated.foods) : updated.foods }
}

export async function deleteTemplate(userId: number, templateId: number) {
  const [existing] = await db
    .select()
    .from(mealTemplates)
    .where(and(eq(mealTemplates.id, templateId), eq(mealTemplates.userId, userId)))
    .limit(1)

  if (!existing) throw new AppError('模板不存在', 404)

  await db.delete(mealTemplates).where(eq(mealTemplates.id, templateId))
  return { success: true }
}

export async function getTemplateById(userId: number, templateId: number) {
  const [row] = await db
    .select()
    .from(mealTemplates)
    .where(and(eq(mealTemplates.id, templateId), eq(mealTemplates.userId, userId)))
    .limit(1)

  if (!row) throw new AppError('模板不存在', 404)

  return {
    ...row,
    foods: typeof row.foods === 'string' ? JSON.parse(row.foods) : row.foods,
  }
}
