import test from 'node:test'
import assert from 'node:assert/strict'
import { getMealTypeForTime } from '../src/utils/mealTime.ts'

test('selects breakfast during the morning meal window', () => {
  assert.equal(getMealTypeForTime(new Date('2026-05-07T05:00:00')), 'breakfast')
  assert.equal(getMealTypeForTime(new Date('2026-05-07T10:59:00')), 'breakfast')
})

test('selects lunch around midday', () => {
  assert.equal(getMealTypeForTime(new Date('2026-05-07T11:00:00')), 'lunch')
  assert.equal(getMealTypeForTime(new Date('2026-05-07T13:59:00')), 'lunch')
})

test('selects snack outside main meal windows', () => {
  assert.equal(getMealTypeForTime(new Date('2026-05-07T04:59:00')), 'snack')
  assert.equal(getMealTypeForTime(new Date('2026-05-07T14:00:00')), 'snack')
  assert.equal(getMealTypeForTime(new Date('2026-05-07T21:00:00')), 'snack')
})

test('selects dinner in the evening meal window', () => {
  assert.equal(getMealTypeForTime(new Date('2026-05-07T17:00:00')), 'dinner')
  assert.equal(getMealTypeForTime(new Date('2026-05-07T20:59:00')), 'dinner')
})
