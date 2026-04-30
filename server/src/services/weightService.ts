import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { pool } from '../db/connection.js'
import { weightRecords } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'

const db = drizzle(pool)

export async function getWeightRecords(userId: number) {
  return db
    .select()
    .from(weightRecords)
    .where(eq(weightRecords.userId, userId))
    .orderBy(desc(weightRecords.date))
    .limit(200)
}

export async function getWeightByDateRange(userId: number, start: string, end: string) {
  return db
    .select()
    .from(weightRecords)
    .where(
      and(
        eq(weightRecords.userId, userId),
        gte(weightRecords.date, sql`${start}` as any),
        lte(weightRecords.date, sql`${end}` as any)
      )
    )
    .orderBy(weightRecords.date)
}

export async function addWeightRecord(userId: number, weight: number, date?: string) {
  const recordDate = date || new Date().toISOString().slice(0, 10)

  const result = await db.insert(weightRecords).values({
    userId,
    date: sql`${recordDate}` as any,
    weight,
  })
  const id = Number(result[0].insertId)

  return { id, date: recordDate, weight, createdAt: Date.now() }
}

export async function deleteWeightRecord(userId: number, recordId: number) {
  const [existing] = await db
    .select()
    .from(weightRecords)
    .where(and(eq(weightRecords.id, recordId), eq(weightRecords.userId, userId)))
    .limit(1)

  if (!existing) {
    throw new AppError('记录不存在', 404)
  }

  await db.delete(weightRecords).where(eq(weightRecords.id, recordId))
  return { success: true }
}
