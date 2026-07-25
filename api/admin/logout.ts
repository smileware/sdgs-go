import { clearAdminSession, requireAdminSession, verifyCsrf } from '../_lib/security'
import { methodNotAllowed, noStore, type ApiRequest, type ApiResponse } from '../_lib/http'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  noStore(response)
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST')
  const session = requireAdminSession(request, response)
  if (!session) return
  if (!verifyCsrf(request, session)) return response.status(403).json({ error: 'invalid_csrf' })
  clearAdminSession(response)
  return response.status(200).json({ ok: true })
}
