import type { DashboardSummary, SubmissionPayloadV1, SubmissionReceipt } from '../../src/types'
import { validateSubmission } from '../../src/lib/submission'
import { loadSheetSummary, markSheetSupabaseSynced, writeSheetSubmission } from './googleSheets'
import { hashCanonicalPayload } from './security'
import { loadSupabaseSummary, markSupabaseSheetSynced, writeSupabaseSubmission } from './supabase'

const withTimeout = async <T>(operation: (signal: AbortSignal) => Promise<T>, milliseconds: number): Promise<T> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), milliseconds)
  try {
    return await operation(controller.signal)
  } finally {
    clearTimeout(timeout)
  }
}

const sinkState = (result: PromiseSettledResult<unknown>): 'ok' | 'pending' | 'conflict' => {
  if (result.status === 'fulfilled') return 'ok'
  return result.reason instanceof Error && result.reason.message === 'submission_conflict' ? 'conflict' : 'pending'
}

export const submitToBothSinks = async (
  input: unknown,
): Promise<{ status: number; receipt: SubmissionReceipt; payload?: SubmissionPayloadV1; payloadHash?: string }> => {
  const validation = validateSubmission(input)
  const submissionId = input && typeof input === 'object' && 'submissionId' in input
    ? String((input as { submissionId?: unknown }).submissionId ?? '')
    : ''
  if (!validation.ok) {
    return {
      status: 400,
      receipt: { submissionId, supabase: 'pending', sheet: 'pending' },
    }
  }
  const payload = validation.payload
  const payloadHash = hashCanonicalPayload(payload)
  const [supabaseResult, sheetResult] = await Promise.allSettled([
    withTimeout(() => writeSupabaseSubmission(payload, payloadHash), 8_000),
    withTimeout((signal) => writeSheetSubmission(payload, payloadHash, signal), 8_000),
  ])
  const receipt: SubmissionReceipt = {
    submissionId: payload.submissionId,
    supabase: sinkState(supabaseResult),
    sheet: sinkState(sheetResult),
  }

  if (receipt.supabase === 'conflict' || receipt.sheet === 'conflict') {
    return { status: 409, receipt, payload, payloadHash }
  }
  if (receipt.supabase === 'ok' && receipt.sheet === 'ok') {
    void markSupabaseSheetSynced([payload.submissionId]).catch(() => null)
    void markSheetSupabaseSynced([payload.submissionId]).catch(() => null)
  }
  const accepted = receipt.supabase === 'ok' || receipt.sheet === 'ok'
  return { status: accepted ? 202 : 503, receipt, payload, payloadHash }
}

export const loadDashboardWithFallback = async (eventSlug: string): Promise<DashboardSummary> => {
  try {
    const summary = await withTimeout(() => loadSupabaseSummary(eventSlug), 3_000)
    return { ...summary, source: 'supabase' }
  } catch {
    const summary = await withTimeout((signal) => loadSheetSummary(eventSlug, signal), 8_000)
    return { ...summary, source: 'google-sheets', syncWarning: 'Supabase ไม่พร้อมใช้งาน กำลังแสดงข้อมูลสำรองจาก Google Sheets' }
  }
}
