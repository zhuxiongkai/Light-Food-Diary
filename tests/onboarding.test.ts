import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getOnboardingStorageKey,
  markOnboardingCompleted,
  resetOnboarding,
  shouldShowOnboarding,
  type OnboardingStorage,
} from '../src/utils/onboarding.ts'

class MemoryStorage implements OnboardingStorage {
  private values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

test('shows onboarding until the current user completes it', () => {
  const storage = new MemoryStorage()

  assert.equal(shouldShowOnboarding(16, storage), true)

  markOnboardingCompleted(16, storage)

  assert.equal(shouldShowOnboarding(16, storage), false)
})

test('stores onboarding state per user id', () => {
  const storage = new MemoryStorage()

  markOnboardingCompleted(16, storage)

  assert.equal(storage.getItem(getOnboardingStorageKey(16)), 'completed')
  assert.equal(shouldShowOnboarding(16, storage), false)
  assert.equal(shouldShowOnboarding(17, storage), true)
})

test('can reset onboarding for a user', () => {
  const storage = new MemoryStorage()
  markOnboardingCompleted(16, storage)

  resetOnboarding(16, storage)

  assert.equal(shouldShowOnboarding(16, storage), true)
})

test('does not open onboarding before a user id is known', () => {
  const storage = new MemoryStorage()

  assert.equal(shouldShowOnboarding(null, storage), false)
  assert.equal(shouldShowOnboarding(undefined, storage), false)
})
