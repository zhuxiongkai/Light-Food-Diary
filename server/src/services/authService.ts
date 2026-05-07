import { eq, and, gt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { pool } from '../db/connection.js'
import { users, userSettings, refreshTokens } from '../db/schema.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { AppError } from '../middleware/errorHandler.js'
import { normalizeEmail } from '../utils/emailVerification.js'
import { verifyRegisterEmailCode } from './emailVerificationService.js'

const db = drizzle(pool)

const USER_SELECT = {
  id: users.id,
  username: users.username,
  email: users.email,
  createdAt: users.createdAt,
} as const

export async function register(username: string, password: string, email?: string, emailCode?: string) {
  const passwordHash = await hashPassword(password)
  try {
    return await db.transaction(async (tx) => {
      let verifiedEmail: string | null = null
      const normalizedEmail = email ? normalizeEmail(email) : ''

      if (normalizedEmail) {
        verifiedEmail = await verifyRegisterEmailCode(tx, normalizedEmail, emailCode)

        const [existingEmailUser] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, verifiedEmail))
          .limit(1)

        if (existingEmailUser) {
          throw new AppError('邮箱已被注册', 409)
        }
      }

      const result = await tx.insert(users).values({
        username,
        email: verifiedEmail,
        passwordHash,
      })
      const userId = Number(result[0].insertId)

      await tx.insert(userSettings).values({ userId } as any)

      const tokenPayload = { userId, username }
      const accessToken = signAccessToken(tokenPayload)
      const refreshToken = signRefreshToken(tokenPayload)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await tx.insert(refreshTokens).values({ userId, token: refreshToken, expiresAt } as any)

      return {
        user: { id: userId, username, email: verifiedEmail },
        accessToken,
        refreshToken,
      }
    })
  } catch (error: any) {
    const message = String(error?.message || '')
    if (message.includes('Duplicate entry') || message.includes('for key') || error?.code === 'ER_DUP_ENTRY') {
      if (message.includes('idx_users_email_unique') || message.includes('email')) {
        throw new AppError('邮箱已被注册', 409)
      }
      throw new AppError('用户名已存在', 409)
    }
    throw error
  }
}

export async function login(username: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (!user) {
    throw new AppError('用户名或密码错误', 401)
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    throw new AppError('用户名或密码错误', 401)
  }

  const tokenPayload = { userId: user.id, username: user.username }
  const accessToken = signAccessToken(tokenPayload)
  const refreshToken = signRefreshToken(tokenPayload)

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt } as any)

  return {
    user: { id: user.id, username: user.username, email: user.email },
    accessToken,
    refreshToken,
  }
}

export async function refreshAccessToken(token: string) {
  let payload
  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw new AppError('Token无效或已过期', 401)
  }

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, token),
        eq(refreshTokens.userId, payload.userId),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!stored) {
    throw new AppError('Token无效或已过期', 401)
  }

  const tokenPayload = { userId: payload.userId, username: payload.username }
  const newAccessToken = signAccessToken(tokenPayload)
  const newRefreshToken = signRefreshToken(tokenPayload)

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db.transaction(async (tx) => {
    await tx.delete(refreshTokens).where(eq(refreshTokens.id, stored.id))
    await tx.insert(refreshTokens).values({ userId: payload.userId, token: newRefreshToken, expiresAt } as any)
  })

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export async function getUserById(userId: number) {
  const [user] = await db
    .select(USER_SELECT)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    throw new AppError('用户不存在', 404)
  }

  return user
}
