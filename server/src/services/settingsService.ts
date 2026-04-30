import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { pool } from '../db/connection.js'
import { userSettings } from '../db/schema.js'
import { decodeStoredApiKey, encodeApiKey } from '../utils/apiKey.js'

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
    return {
      userId,
      ...defaultSettings(),
      aiApiKey: '',
    }
  }

  return {
    ...settings,
    aiApiKey: decodeStoredApiKey(settings.aiApiKey),
  }
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

  // Encrypt AI API key if provided
  if (data.aiApiKey !== undefined) {
    updateData.aiApiKey = encodeApiKey(data.aiApiKey)
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
