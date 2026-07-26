// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({
  writeSupabaseSubmission: vi.fn(),
  markSupabaseSheetSynced: vi.fn(),
  loadSupabaseSummary: vi.fn(),
}))

vi.mock('./googleSheets', () => ({
  writeSheetSubmission: vi.fn(),
  markSheetSupabaseSynced: vi.fn(),
  loadSheetSummary: vi.fn(),
}))

import { writeSheetSubmission } from './googleSheets.js'
import { submitToBothSinks } from './gateway.js'
import { writeSupabaseSubmission } from './supabase.js'
import { validSubmission } from '../../src/test/fixtures.js'

describe('dual-write gateway', () => {
  beforeEach(() => {
    vi.mocked(writeSupabaseSubmission).mockReset()
    vi.mocked(writeSheetSubmission).mockReset()
  })

  it('accepts when Supabase fails but Google Sheets succeeds', async () => {
    vi.mocked(writeSupabaseSubmission).mockRejectedValue(new Error('supabase unavailable'))
    vi.mocked(writeSheetSubmission).mockResolvedValue({})
    const result = await submitToBothSinks({ ...validSubmission(), submissionId: randomUUID() })
    expect(result.status).toBe(202)
    expect(result.receipt).toMatchObject({ supabase: 'pending', sheet: 'ok' })
  })

  it('returns unavailable only when both sinks fail', async () => {
    vi.mocked(writeSupabaseSubmission).mockRejectedValue(new Error('supabase unavailable'))
    vi.mocked(writeSheetSubmission).mockRejectedValue(new Error('sheet unavailable'))
    const result = await submitToBothSinks(validSubmission())
    expect(result.status).toBe(503)
    expect(result.receipt).toMatchObject({ supabase: 'pending', sheet: 'pending' })
  })

  it('returns a conflict when an existing ID has a different payload hash', async () => {
    vi.mocked(writeSupabaseSubmission).mockRejectedValue(new Error('submission_conflict'))
    vi.mocked(writeSheetSubmission).mockResolvedValue({})
    const result = await submitToBothSinks(validSubmission())
    expect(result.status).toBe(409)
    expect(result.receipt.supabase).toBe('conflict')
  })
})
