import { exportRowsToCsv } from '../_lib/csv.js'
import { serverConfig } from '../_lib/env.js'
import { loadSheetExport } from '../_lib/googleSheets.js'
import { methodNotAllowed, noStore, requestIp, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { requireAdminSession, verifyCsrf } from '../_lib/security.js'
import { loadSupabaseExport, writeAuditEvent } from '../_lib/supabase.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  noStore(response)
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST')
  const session = requireAdminSession(request, response)
  if (!session) return
  if (!verifyCsrf(request, session)) return response.status(403).json({ error: 'invalid_csrf' })

  const eventSlug = serverConfig().eventSlug
  const results = await Promise.allSettled([
    loadSupabaseExport(eventSlug),
    loadSheetExport(eventSlug),
  ])
  const rows = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
  if (!rows.length && results.every((result) => result.status === 'rejected')) {
    return response.status(503).json({ error: 'export_unavailable' })
  }
  void writeAuditEvent('export_csv', requestIp(request), {
    eventSlug,
    rowCount: new Set(rows.map((row) => row.submissionId)).size,
  }).catch(() => null)
  response.setHeader('Content-Type', 'text/csv; charset=utf-8')
  response.setHeader('Content-Disposition', `attachment; filename="sustrend-${eventSlug}.csv"`)
  return response.status(200).send(exportRowsToCsv(rows))
}
