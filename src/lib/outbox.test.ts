import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validSubmission } from '../test/fixtures'
import { enqueueSubmission, flushPendingSubmissions, getSyncStatus } from './outbox'

const resetDatabase = () => new Promise<void>((resolve, reject) => {
  const request = indexedDB.deleteDatabase('sustrend-kiosk-v1')
  request.onsuccess = () => resolve()
  request.onerror = () => reject(request.error)
  request.onblocked = () => resolve()
})

describe('submission outbox', () => {
  beforeEach(async () => {
    await resetDatabase()
    localStorage.clear()
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
  })

  it('removes a record only after both sinks acknowledge it', async () => {
    const payload = validSubmission()
    await enqueueSubmission(payload)
    expect((await getSyncStatus()).pending).toBe(1)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      submissionId: payload.submissionId,
      supabase: 'ok',
      sheet: 'ok',
    }), { status: 202, headers: { 'content-type': 'application/json' } }))

    await flushPendingSubmissions()
    expect(await getSyncStatus()).toMatchObject({ pending: 0, partial: 0, deadLetter: 0 })
  })

  it('retains a partial record for reconciliation', async () => {
    const payload = validSubmission()
    await enqueueSubmission(payload)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      submissionId: payload.submissionId,
      supabase: 'ok',
      sheet: 'pending',
    }), { status: 202, headers: { 'content-type': 'application/json' } }))

    await flushPendingSubmissions()
    expect(await getSyncStatus()).toMatchObject({ pending: 0, partial: 1, deadLetter: 0 })
  })
})
