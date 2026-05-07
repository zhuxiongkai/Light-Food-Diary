import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canAttemptCode,
  hashEmailCode,
  isEmailCodeExpired,
  isValidEmail,
  normalizeEmail,
  verifyEmailCodeHash,
} from '../server/src/utils/emailVerification.ts'

test('normalizes email before persistence and lookup', () => {
  assert.equal(normalizeEmail('  USER.Name+Food@Example.COM  '), 'user.name+food@example.com')
})

test('validates common email formats without accepting malformed input', () => {
  assert.equal(isValidEmail('user@example.com'), true)
  assert.equal(isValidEmail('name+tag@sub.example.cn'), true)
  assert.equal(isValidEmail('bad-email'), false)
  assert.equal(isValidEmail('user@'), false)
  assert.equal(isValidEmail('@example.com'), false)
  assert.equal(isValidEmail('user@example'), false)
})

test('hashes email codes so plain codes are not stored', () => {
  const hash = hashEmailCode('123456')

  assert.notEqual(hash, '123456')
  assert.equal(verifyEmailCodeHash('123456', hash), true)
  assert.equal(verifyEmailCodeHash('000000', hash), false)
})

test('treats codes as expired only after their expiry time has passed', () => {
  const now = new Date('2026-05-07T10:00:00Z')

  assert.equal(isEmailCodeExpired(new Date('2026-05-07T10:00:01Z'), now), false)
  assert.equal(isEmailCodeExpired(new Date('2026-05-07T09:59:59Z'), now), true)
})

test('allows no more than five failed verification attempts', () => {
  assert.equal(canAttemptCode(0), true)
  assert.equal(canAttemptCode(4), true)
  assert.equal(canAttemptCode(5), false)
})
