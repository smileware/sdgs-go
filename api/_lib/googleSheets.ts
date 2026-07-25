import type { DashboardSummary, SubmissionPayloadV1 } from '../../src/types'
import { hasGoogleSheetsConfig, serverConfig } from './env'
import { createSignedEnvelope } from './security'

export interface SheetExportRow {
  submissionId: string
  eventSlug: string
  participantId: string
  deviceId: string
  nickname: string
  age: number
  gender: string
  phone: string | null
  privacyVersion: string
  privacyAcceptedAt: string
  cardSetVersion: string
  character: string
  scores: unknown
  responses: unknown
  clientCompletedAt: string
}

interface ScriptResult<T> {
  ok: boolean
  conflict?: boolean
  data?: T
  error?: string
}

const callScript = async <T>(action: string, data: unknown, signal?: AbortSignal): Promise<T> => {
  if (!hasGoogleSheetsConfig()) throw new Error('google_sheets_not_configured')
  const response = await fetch(serverConfig().googleAppsScriptUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(createSignedEnvelope(action, data)),
    signal,
    redirect: 'follow',
  })
  if (!response.ok) throw new Error(`google_sheets_http_${response.status}`)
  const result = await response.json() as ScriptResult<T>
  if (result.conflict) throw new Error('submission_conflict')
  if (!result.ok) throw new Error(result.error || 'google_sheets_failed')
  return result.data as T
}

export const writeSheetSubmission = async (
  payload: SubmissionPayloadV1,
  payloadHash: string,
  signal?: AbortSignal,
) => callScript<{ duplicate?: boolean }>('append', { payload, payloadHash }, signal)

export const batchWriteSheetSubmissions = async (
  submissions: Array<{ payload: SubmissionPayloadV1; payloadHash: string }>,
) => callScript<{ syncedIds: string[] }>('batch_append', { submissions })

export const loadSheetSummary = (eventSlug: string, signal?: AbortSignal) =>
  callScript<DashboardSummary>('summary', { eventSlug }, signal)

export const loadSheetExport = (eventSlug: string) =>
  callScript<SheetExportRow[]>('export', { eventSlug })

export const loadSheetPendingSupabase = (limit = 100) =>
  callScript<Array<{ payload: SubmissionPayloadV1; payloadHash: string }>>('pending_supabase', { limit })

export const markSheetSupabaseSynced = (submissionIds: string[]) =>
  callScript<{ updated: number }>('mark_supabase_synced', { submissionIds })
