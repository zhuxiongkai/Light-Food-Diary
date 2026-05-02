import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { pool } from '../db/connection.js'
import { weightRecords } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'

const db = drizzle(pool)

export async function getWeightRecords(userId: number) {
  const records = await db
    .select()
    .from(weightRecords)
    .where(eq(weightRecords.userId, userId))
    .orderBy(desc(weightRecords.date))
    .limit(200)

  return records.map(toPublicWeightRecord)
}

export async function getWeightByDateRange(userId: number, start: string, end: string) {
  const records = await db
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

  return records.map(toPublicWeightRecord)
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

function formatDateOnly(value: unknown) {
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const text = String(value)
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!match) return text

  const [, y, m, d] = match
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function toPublicWeightRecord<T extends Record<string, any>>(record: T): T & { date: string } {
  return {
    ...record,
    date: formatDateOnly(record.date),
  }
}
