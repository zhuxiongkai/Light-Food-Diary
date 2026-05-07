import { createHash, timingSafeEqual } from 'node:crypto'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_ATTEMPTS = 5

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string) {
  const normalized = normalizeEmail(email)
  return normalized.length <= 100 && EMAIL_PATTERN.test(normalized)
}

export function hashEmailCode(code: string) {
  return createHash('sha256').update(code).digest('hex')
}

export function verifyEmailCodeHash(code: string, hash: string) {
  const codeHash = hashEmailCode(code)
  const expected = Buffer.from(hash, 'hex')
  const actual = Buffer.from(codeHash, 'hex')

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}

export function isEmailCodeExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime()
}

export function canAttemptCode(attemptCount: number) {
  return attemptCount < MAX_ATTEMPTS
}
