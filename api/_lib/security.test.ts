// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { ApiRequest, ApiResponse } from './http'
import {
  createAdminSession,
  createPasswordHash,
  hashCanonicalPayload,
  requireAdminSession,
  verifyCsrf,
  verifyPassword,
} from './security'

describe('admin credential security', () => {
  it('creates a salted scrypt password hash', () => {
    const hash = createPasswordHash('correct horse battery staple')
    expect(hash).toMatch(/^scrypt\$[a-f0-9]+\$[a-f0-9]+$/)
    expect(verifyPassword('correct horse battery staple', hash)).toBe(true)
    expect(verifyPassword('wrong password', hash)).toBe(false)
  })

  it('produces a stable SHA-256 payload hash', () => {
    const first = hashCanonicalPayload({ a: 1, b: 'two' })
    expect(first).toHaveLength(64)
    expect(hashCanonicalPayload({ a: 1, b: 'two' })).toBe(first)
  })

  it('issues and verifies an HttpOnly same-site admin session', () => {
    process.env.ADMIN_SESSION_SECRET = 'test-session-secret-that-is-long-enough'
    const headers = new Map<string, string | string[]>()
    let response: ApiResponse
    response = {
      setHeader: (name: string, value: string | string[]) => { headers.set(name, value) },
      status: () => response,
      json: () => undefined,
      send: () => undefined,
      end: () => undefined,
    }
    const created = createAdminSession('admin@example.com', response)
    const setCookie = String(headers.get('Set-Cookie'))
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Strict')

    const request = {
      headers: { cookie: setCookie.split(';')[0], 'x-csrf-token': created.csrfToken },
    } satisfies ApiRequest
    const verified = requireAdminSession(request, response)
    expect(verified?.email).toBe('admin@example.com')
    expect(verified && verifyCsrf(request, verified)).toBe(true)
  })
})
