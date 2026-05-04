import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveFoodSearchLimit } from '../server/src/services/foodSearchPolicy.ts'

test('does not limit full food cache loads', () => {
  assert.equal(resolveFoodSearchLimit(undefined), undefined)
  assert.equal(resolveFoodSearchLimit('   '), undefined)
})

test('keeps a cap for keyword food searches', () => {
  assert.equal(resolveFoodSearchLimit('米'), 100)
})
