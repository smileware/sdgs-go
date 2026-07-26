import { afterEach, describe, expect, it } from 'vitest'
import { getStoredLanguage, LANGUAGE_STORAGE_KEY } from './translations'

afterEach(() => {
  window.localStorage.clear()
})

describe('stored language', () => {
  it('defaults to Thai', () => {
    expect(getStoredLanguage()).toBe('th')
  })

  it('restores a supported language', () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en')
    expect(getStoredLanguage()).toBe('en')
  })

  it('falls back to Thai for an unsupported value', () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr')
    expect(getStoredLanguage()).toBe('th')
  })
})
