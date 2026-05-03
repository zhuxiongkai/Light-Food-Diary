export interface OnboardingStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const ONBOARDING_STORAGE_PREFIX = 'calorie-tracker:onboarding:v1'
const COMPLETED_VALUE = 'completed'

export const ONBOARDING_REOPEN_EVENT = 'calorie-tracker:onboarding:reopen'

function browserStorage(): OnboardingStorage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function resolveStorage(storage?: OnboardingStorage | null) {
  return storage === undefined ? browserStorage() : storage
}

export function getOnboardingStorageKey(userId: number | string) {
  return `${ONBOARDING_STORAGE_PREFIX}:${userId}`
}

export function shouldShowOnboarding(
  userId: number | string | null | undefined,
  storage?: OnboardingStorage | null
) {
  if (userId === null || userId === undefined || userId === '') {
    return false
  }

  const store = resolveStorage(storage)
  if (!store) {
    return false
  }

  return store.getItem(getOnboardingStorageKey(userId)) !== COMPLETED_VALUE
}

export function markOnboardingCompleted(
  userId: number | string,
  storage?: OnboardingStorage | null
) {
  const store = resolveStorage(storage)
  if (!store) {
    return
  }

  store.setItem(getOnboardingStorageKey(userId), COMPLETED_VALUE)
}

export function resetOnboarding(
  userId: number | string,
  storage?: OnboardingStorage | null
) {
  const store = resolveStorage(storage)
  if (!store) {
    return
  }

  store.removeItem(getOnboardingStorageKey(userId))
}
