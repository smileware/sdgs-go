import { describe, expect, it } from 'vitest'
import { validSubmission } from '../test/fixtures'
import { isValidPhone, validateSubmission } from './submission'

describe('phone validation', () => {
  it.each(['', '0812345678', '+66 81-234-5678', '(02) 123 4567'])('accepts %j', (phone) => {
    expect(isValidPhone(phone)).toBe(true)
  })

  it.each(['123', '0812ABC567', '1234567890123456'])('rejects %j', (phone) => {
    expect(isValidPhone(phone)).toBe(false)
  })
})

describe('submission validation', () => {
  it('accepts a complete 15-card payload', () => {
    const result = validateSubmission(validSubmission())
    expect(result.ok).toBe(true)
  })

  it('rejects invalid age and duplicate responses', () => {
    const payload = validSubmission()
    payload.player.age = 121
    payload.responses[1] = payload.responses[0]
    const result = validateSubmission(payload)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContain('invalid age')
      expect(result.errors.some((error) => error.startsWith('duplicate card'))).toBe(true)
    }
  })

  it('recalculates a tampered result on the server contract', () => {
    const payload = validSubmission()
    payload.result.character = 'people'
    payload.result.scores.people = 99
    const result = validateSubmission(payload)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.result.scores.people).toBe(2)
    }
  })
})
