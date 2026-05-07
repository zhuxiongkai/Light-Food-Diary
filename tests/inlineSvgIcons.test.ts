import test from 'node:test'
import assert from 'node:assert/strict'
import { inlineSvgIcons, semanticInlineIconNames } from '../src/utils/inlineSvgIcons.ts'

test('semantic icon gaps are backed by inline svg strings', () => {
  assert.deepEqual(semanticInlineIconNames, [
    'meal-breakfast',
    'meal-lunch',
    'meal-dinner',
    'meal-snack',
    'macro-protein',
    'macro-carbs',
    'macro-fat',
  ])

  for (const name of semanticInlineIconNames) {
    const svg = inlineSvgIcons[name]
    assert.match(svg, /^<svg\b/)
    assert.match(svg, /<\/svg>$/)
    assert.doesNotMatch(svg, /href=|url\(|<use\b|van-icon/)
    assert.match(svg, /currentColor/)
  }
})
