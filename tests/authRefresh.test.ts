import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldRefreshAfterUnauthorized } from '../src/api/authRefresh.ts'

test('refreshes access token when auth/me returns unauthorized', () => {
  assert.equal(shouldRefreshAfterUnauthorized('/auth/me'), true)
})

test('does not refresh access token for token issuing endpoints', () => {
  assert.equal(shouldRefreshAfterUnauthorized('/auth/login'), false)
  assert.equal(shouldRefreshAfterUnauthorized('/auth/register'), false)
  assert.equal(shouldRefreshAfterUnauthorized('/auth/refresh'), false)
  assert.equal(shouldRefreshAfterUnauthorized('/auth/send-email-code'), false)
})
