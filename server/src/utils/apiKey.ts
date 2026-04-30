import { decrypt, encrypt } from './crypto.js'

export function decodeStoredApiKey(storedValue: string | null | undefined): string {
  if (!storedValue) return ''

  const parts = storedValue.split(':')
  if (parts.length === 3) {
    try {
      return decrypt(storedValue)
    } catch {
      return ''
    }
  }

  // Backward compatibility for old plain-text records
  return storedValue
}

export function encodeApiKey(rawValue: string | null | undefined): string | null {
  const value = (rawValue || '').trim()
  if (!value) return null
  return encrypt(value)
}
