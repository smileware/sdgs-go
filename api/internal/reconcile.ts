import {
  batchWriteSheetSubmissions,
  loadSheetPendingSupabase,
  markSheetSupabaseSynced,
} from '../_lib/googleSheets.js'
import { methodNotAllowed, noStore, parseJsonBody, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { verifySignedEnvelope } from '../_lib/security.js'
import {
  loadSupabasePendingSheet,
  markSupabaseSheetSynced,
  writeSupabaseSubmission,
} from '../_lib/supabase.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  noStore(response)
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST')
  const verified = verifySignedEnvelope(parseJsonBody(request))
  if (!verified || verified.action !== 'reconcile') return response.status(401).json({ error: 'invalid_signature' })

  const report = { sheetToSupabase: 0, supabaseToSheet: 0, errors: 0 }
  try {
    const pendingSheet = await loadSupabasePendingSheet(100)
    if (pendingSheet.length) {
      const result = await batchWriteSheetSubmissions(pendingSheet)
      await markSupabaseSheetSynced(result.syncedIds)
      report.supabaseToSheet = result.syncedIds.length
    }
  } catch {
    report.errors += 1
  }

  try {
    const pendingSupabase = await loadSheetPendingSupabase(100)
    const synced: string[] = []
    for (const item of pendingSupabase) {
      try {
        await writeSupabaseSubmission(item.payload, item.payloadHash)
        synced.push(item.payload.submissionId)
      } catch {
        report.errors += 1
      }
    }
    if (synced.length) await markSheetSupabaseSynced(synced)
    report.sheetToSupabase = synced.length
  } catch {
    report.errors += 1
  }

  return response.status(200).json({ ok: report.errors === 0, ...report })
}
