import test from 'node:test'
import assert from 'node:assert/strict'
import { getServingProfile } from '../src/utils/servingSize.ts'

test('uses food-specific serving defaults for common Chinese foods', () => {
  assert.equal(getServingProfile({ name: '米饭', category: 'staple' }).defaultServingWeight, 150)
  assert.equal(getServingProfile({ name: '鸡蛋', category: 'meat' }).defaultServingWeight, 50)
  assert.equal(getServingProfile({ name: '红烧肉', category: 'meat' }).defaultServingWeight, 180)
})

test('matches common aliases and keeps compact portion options', () => {
  const profile = getServingProfile({ name: '白米饭', category: 'staple' })

  assert.equal(profile.servingUnit, '碗')
  assert.deepEqual(profile.servingOptions.map((option) => option.weight), [75, 150, 225])
})

test('falls back to category defaults for unknown foods', () => {
  const profile = getServingProfile({ name: '未知炒菜', category: 'vegetable' })

  assert.equal(profile.defaultServingWeight, 200)
  assert.equal(profile.servingUnit, '份')
})
