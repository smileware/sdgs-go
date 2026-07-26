import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { ApiRequest, ApiResponse } from './http.js'
import { header } from './http.js'
import { serverConfig } from './env.js'

const SESSION_COOKIE = 'sustrend_admin'
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000
const IDLE_LIFETIME_MS = 30 * 60 * 1000
const loginAttempts = new Map<string, number[]>()

interface SessionPayload {
  username: string
  issuedAt: number
  expiresAt: number
  lastActivityAt: number
  csrfToken: string
}

export interface SignedEnvelope {
  timestamp: number
  nonce: string
  payload: string
  signature: string
}

const base64Url = (value: string | Buffer) => Buffer.from(value).toString('base64url')
const hmac = (value: string, secret: string) => createHmac('sha256', secret).update(value).digest('base64url')

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export const verifyPassword = (password: string, storedHash: string): boolean => {
  const [algorithm, salt, expectedHex] = storedHash.split('$')
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false
  const actual = scryptSync(password, salt, 64)
  const expected = Buffer.from(expectedHex, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export const createPasswordHash = (password: string): string => {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`
}

const signSession = (payload: SessionPayload): string => {
  const secret = serverConfig().adminSessionSecret
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is missing')
  const encoded = base64Url(JSON.stringify(payload))
  return `${encoded}.${hmac(encoded, secret)}`
}

const readCookie = (request: ApiRequest, name: string): string => {
  const cookies = header(request, 'cookie').split(';')
  for (const cookie of cookies) {
    const [key, ...parts] = cookie.trim().split('=')
    if (key === name) return decodeURIComponent(parts.join('='))
  }
  return ''
}

const readSession = (request: ApiRequest): SessionPayload | null => {
  const token = readCookie(request, SESSION_COOKIE)
  const [encoded, signature] = token.split('.')
  const secret = serverConfig().adminSessionSecret
  if (!encoded || !signature || !secret || !safeEqual(signature, hmac(encoded, secret))) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload
    const now = Date.now()
    if (payload.expiresAt <= now || now - payload.lastActivityAt > IDLE_LIFETIME_MS) return null
    return payload
  } catch {
    return null
  }
}

const setSessionCookie = (response: ApiResponse, payload: SessionPayload) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(signSession(payload))}; Path=/; HttpOnly${secure}; SameSite=Strict; Max-Age=${SESSION_LIFETIME_MS / 1000}`,
  )
}

export const createAdminSession = (username: string, response: ApiResponse): SessionPayload => {
  const now = Date.now()
  const payload: SessionPayload = {
    username,
    issuedAt: now,
    expiresAt: now + SESSION_LIFETIME_MS,
    lastActivityAt: now,
    csrfToken: randomBytes(24).toString('base64url'),
  }
  setSessionCookie(response, payload)
  return payload
}

export const requireAdminSession = (request: ApiRequest, response: ApiResponse): SessionPayload | null => {
  const session = readSession(request)
  if (!session) {
    response.status(401).json({ error: 'unauthorized' })
    return null
  }
  const refreshed = { ...session, lastActivityAt: Date.now() }
  setSessionCookie(response, refreshed)
  return refreshed
}

export const clearAdminSession = (response: ApiResponse) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly${secure}; SameSite=Strict; Max-Age=0`)
}

export const verifyCsrf = (request: ApiRequest, session: SessionPayload): boolean =>
  safeEqual(header(request, 'x-csrf-token'), session.csrfToken)

export const isLoginRateLimited = (ip: string): boolean => {
  const cutoff = Date.now() - 15 * 60 * 1000
  const recent = (loginAttempts.get(ip) ?? []).filter((timestamp) => timestamp > cutoff)
  loginAttempts.set(ip, recent)
  return recent.length >= 5
}

export const recordFailedLogin = (ip: string) => {
  const recent = loginAttempts.get(ip) ?? []
  recent.push(Date.now())
  loginAttempts.set(ip, recent)
}

export const clearLoginAttempts = (ip: string) => loginAttempts.delete(ip)

export const hashCanonicalPayload = (payload: unknown): string =>
  createHash('sha256').update(JSON.stringify(payload)).digest('hex')

export const createSignedEnvelope = (action: string, data: unknown): SignedEnvelope => {
  const secret = serverConfig().googleAppsScriptSecret
  if (!secret) throw new Error('GOOGLE_APPS_SCRIPT_SECRET is missing')
  const timestamp = Date.now()
  const nonce = randomBytes(12).toString('hex')
  const payload = JSON.stringify({ action, data })
  return {
    timestamp,
    nonce,
    payload,
    signature: hmac(`${timestamp}.${nonce}.${payload}`, secret),
  }
}

export const verifySignedEnvelope = (input: unknown): { action: string; data: unknown } | null => {
  const envelope = input as SignedEnvelope
  const secret = serverConfig().googleAppsScriptSecret
  if (!secret || !envelope || Math.abs(Date.now() - Number(envelope.timestamp)) > 5 * 60 * 1000) return null
  const expected = hmac(`${envelope.timestamp}.${envelope.nonce}.${envelope.payload}`, secret)
  if (!safeEqual(envelope.signature ?? '', expected)) return null
  try {
    return JSON.parse(envelope.payload) as { action: string; data: unknown }
  } catch {
    return null
  }
}

export const isAllowedBrowserOrigin = (request: ApiRequest): boolean => {
  const origin = header(request, 'origin')
  if (!origin) return true
  const configured = serverConfig().allowedOrigins
  if (configured.includes(origin)) return true

  const forwardedProto = header(request, 'x-forwarded-proto').split(',')[0]?.trim()
  const forwardedHost = header(request, 'x-forwarded-host').split(',')[0]?.trim()
  const host = forwardedHost || header(request, 'host').split(',')[0]?.trim()
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http')

  if (host && origin === `${protocol}://${host}`) return true
  return process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(?::\d+)?$/.test(origin)
}
