import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { pool } from '../db/connection.js'
import { userSettings } from '../db/schema.js'

const db = drizzle(pool)

export async function getSettings(userId: number) {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  if (!settings) {
    // Create default settings if none exist
    await db.insert(userSettings).values({ userId } as any)
    return defaultSettings()
  }

  return toPublicSettings(settings)
}

export async function updateSettings(userId: number, data: Record<string, any>) {
  const [existing] = await db
    .select({ id: userSettings.id })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  const updateData: Record<string, any> = {}

  // Map allowed fields
  const allowedFields = [
    'dailyCalorieGoal', 'proteinRatio', 'fatRatio', 'carbsRatio',
    'height', 'weight', 'age', 'gender', 'weightGoal',
  ]
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field]
    }
  }

  if (Object.keys(updateData).length === 0) {
    return getSettings(userId)
  }

  if (existing) {
    await db.update(userSettings).set(updateData).where(eq(userSettings.userId, userId))
  } else {
    await db.insert(userSettings).values({ userId, ...updateData } as any)
  }

  return getSettings(userId)
}

function defaultSettings() {
  return {
    dailyCalorieGoal: 2000,
    proteinRatio: 20,
    fatRatio: 25,
    carbsRatio: 55,
    height: 170,
    weight: 65,
    age: 25,
    gender: 'male' as const,
    weightGoal: 60,
  }
}

function toPublicSettings(settings: Record<string, any>) {
  return {
    dailyCalorieGoal: settings.dailyCalorieGoal,
    proteinRatio: settings.proteinRatio,
    fatRatio: settings.fatRatio,
    carbsRatio: settings.carbsRatio,
    height: settings.height,
    weight: settings.weight,
    age: settings.age,
    gender: settings.gender,
    weightGoal: settings.weightGoal,
  }
}
