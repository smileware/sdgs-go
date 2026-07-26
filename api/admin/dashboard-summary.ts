import { serverConfig } from '../_lib/env.js'
import { loadCachedDashboardSummary } from '../_lib/dashboardCache.js'
import { loadDashboardWithFallback } from '../_lib/gateway.js'
import { methodNotAllowed, noStore, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { requireAdminSession } from '../_lib/security.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  noStore(response)
  if (request.method !== 'GET') return methodNotAllowed(response, 'GET')
  const session = requireAdminSession(request, response)
  if (!session) return
  try {
    const summary = await loadCachedDashboardSummary(serverConfig().eventSlug, loadDashboardWithFallback)
    return response.status(200).json({ ...summary, csrfToken: session.csrfToken })
  } catch {
    return response.status(503).json({ error: 'dashboard_unavailable' })
  }
}
