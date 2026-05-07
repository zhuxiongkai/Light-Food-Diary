import { randomInt } from 'node:crypto'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { pool } from '../db/connection.js'
import { emailVerificationCodes, users } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'
import {
  canAttemptCode,
  hashEmailCode,
  isEmailCodeExpired,
  isValidEmail,
  normalizeEmail,
  verifyEmailCodeHash,
} from '../utils/emailVerification.js'
import { sendVerificationCodeEmail } from './mailService.js'

const db = drizzle(pool)
const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_SECONDS = 30

function createEmailCode() {
  return String(randomInt(100000, 1000000))
}

export async function sendRegisterEmailCode(email: string) {
  const normalizedEmail = normalizeEmail(email || '')

  if (!isValidEmail(normalizedEmail)) {
    throw new AppError('邮箱格式不正确', 400)
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  if (existingUser) {
    throw new AppError('邮箱已被注册', 409)
  }

  const [recentCode] = await db
    .select({ id: emailVerificationCodes.id })
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, normalizedEmail),
        eq(emailVerificationCodes.purpose, 'register'),
        sql`${emailVerificationCodes.createdAt} > DATE_SUB(NOW(), INTERVAL ${RESEND_COOLDOWN_SECONDS} SECOND)`
      )
    )
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1)

  if (recentCode) {
    throw new AppError('验证码发送太频繁，请稍后再试', 429)
  }

  const code = createEmailCode()
  const result = await db.insert(emailVerificationCodes).values({
    email: normalizedEmail,
    codeHash: hashEmailCode(code),
    purpose: 'register',
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  })
  const codeId = Number(result[0].insertId)

  try {
    await sendVerificationCodeEmail(normalizedEmail, code)
  } catch (error) {
    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, codeId))
    throw error
  }

  return { email: normalizedEmail, expiresIn: CODE_TTL_MS / 1000 }
}

export async function verifyRegisterEmailCode(
  tx: any,
  email: string,
  code: string | undefined
) {
  const normalizedEmail = normalizeEmail(email || '')

  if (!isValidEmail(normalizedEmail)) {
    throw new AppError('邮箱格式不正确', 400)
  }
  if (!code) {
    throw new AppError('请输入邮箱验证码', 400)
  }

  const [record] = await tx
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, normalizedEmail),
        eq(emailVerificationCodes.purpose, 'register'),
        isNull(emailVerificationCodes.usedAt)
      )
    )
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1)

  if (!record) {
    throw new AppError('验证码无效或已过期', 400)
  }

  if (isEmailCodeExpired(record.expiresAt) || !canAttemptCode(record.attemptCount)) {
    throw new AppError('验证码无效或已过期', 400)
  }

  if (!verifyEmailCodeHash(code, record.codeHash)) {
    await tx
      .update(emailVerificationCodes)
      .set({ attemptCount: sql`${emailVerificationCodes.attemptCount} + 1` })
      .where(eq(emailVerificationCodes.id, record.id))
    throw new AppError('验证码错误', 400)
  }

  await tx
    .update(emailVerificationCodes)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationCodes.id, record.id))

  return normalizedEmail
}
