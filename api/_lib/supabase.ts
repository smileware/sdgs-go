import { createClient } from '@supabase/supabase-js'
import type { DashboardSummary, SubmissionPayloadV1 } from '../../src/types'
import type { SheetExportRow } from './googleSheets'
import { hasSupabaseConfig, serverConfig } from './env'

const client = () => {
  if (!hasSupabaseConfig()) throw new Error('supabase_not_configured')
  const config = serverConfig()
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const throwIfError = (error: { message: string } | null) => {
  if (!error) return
  if (error.message.includes('submission_conflict')) throw new Error('submission_conflict')
  throw new Error('supabase_operation_failed')
}

export const writeSupabaseSubmission = async (
  payload: SubmissionPayloadV1,
  payloadHash: string,
) => {
  const { data, error } = await client().rpc('submit_play_v1', {
    p_payload: payload,
    p_payload_hash: payloadHash,
  })
  throwIfError(error)
  return data as { duplicate?: boolean }
}

export const loadSupabaseSummary = async (eventSlug: string): Promise<DashboardSummary> => {
  const { data, error } = await client().rpc('get_dashboard_summary_admin', { p_event_slug: eventSlug })
  throwIfError(error)
  return data as DashboardSummary
}

export const loadSupabaseExport = async (eventSlug: string): Promise<SheetExportRow[]> => {
  const { data, error } = await client().rpc('export_submissions_v1', { p_event_slug: eventSlug })
  throwIfError(error)
  return (data ?? []) as SheetExportRow[]
}

export const loadSupabasePendingSheet = async (limit = 100) => {
  const { data, error } = await client().rpc('get_pending_sheet_submissions_v1', { p_limit: limit })
  throwIfError(error)
  return (data ?? []) as Array<{ payload: SubmissionPayloadV1; payloadHash: string }>
}

export const markSupabaseSheetSynced = async (submissionIds: string[]) => {
  if (!submissionIds.length) return
  const { error } = await client().rpc('mark_sheet_synced_v1', { p_submission_ids: submissionIds })
  throwIfError(error)
}

export const writeAuditEvent = async (action: string, ip: string, details: Record<string, unknown> = {}) => {
  if (!hasSupabaseConfig()) return
  const { error } = await client().from('admin_audit_log').insert({
    action,
    ip_address: ip,
    details,
  })
  if (error) throw new Error('audit_write_failed')
}
