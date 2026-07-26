// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { ApiRequest, ApiResponse } from './http.js'
import {
  createAdminSession,
  createPasswordHash,
  hashCanonicalPayload,
  isAllowedBrowserOrigin,
  requireAdminSession,
  verifyCsrf,
  verifyPassword,
} from './security.js'

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
    const created = createAdminSession('admin', response)
    const setCookie = String(headers.get('Set-Cookie'))
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Strict')

    const request = {
      headers: { cookie: setCookie.split(';')[0], 'x-csrf-token': created.csrfToken },
    } satisfies ApiRequest
    const verified = requireAdminSession(request, response)
    expect(verified?.username).toBe('admin')
    expect(verified && verifyCsrf(request, verified)).toBe(true)
  })

  it('allows the exact request origin when no explicit allowlist is configured', () => {
    delete process.env.PUBLIC_APP_ORIGINS
    const request = {
      headers: {
        origin: 'https://game.example.com',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'game.example.com',
      },
    } satisfies ApiRequest

    expect(isAllowedBrowserOrigin(request)).toBe(true)
    expect(isAllowedBrowserOrigin({
      ...request,
      headers: { ...request.headers, origin: 'https://attacker.example' },
    })).toBe(false)
  })

  it('uses the configured cross-origin allowlist when provided', () => {
    process.env.PUBLIC_APP_ORIGINS = 'https://kiosk.example, https://admin.example'
    const request = {
      headers: {
        origin: 'https://admin.example',
        host: 'api.example',
      },
    } satisfies ApiRequest

    expect(isAllowedBrowserOrigin(request)).toBe(true)
    expect(isAllowedBrowserOrigin({
      ...request,
      headers: { ...request.headers, origin: 'https://attacker.example' },
    })).toBe(false)
    expect(isAllowedBrowserOrigin({
      headers: { origin: 'https://api.example', host: 'api.example', 'x-forwarded-proto': 'https' },
    })).toBe(true)
    delete process.env.PUBLIC_APP_ORIGINS
  })

  it('keeps localhost available during development when production origins are configured', () => {
    const previousNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    process.env.PUBLIC_APP_ORIGINS = 'https://sdgs-go.vercel.app'

    expect(isAllowedBrowserOrigin({
      headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
    })).toBe(true)

    process.env.NODE_ENV = previousNodeEnv
    delete process.env.PUBLIC_APP_ORIGINS
  })
})
