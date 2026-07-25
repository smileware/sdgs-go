import { serverConfig } from '../_lib/env'
import { methodNotAllowed, noStore, parseJsonBody, requestIp, type ApiRequest, type ApiResponse } from '../_lib/http'
import {
  clearLoginAttempts,
  createAdminSession,
  isLoginRateLimited,
  recordFailedLogin,
  verifyPassword,
  isAllowedBrowserOrigin,
} from '../_lib/security'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  noStore(response)
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST')
  if (!isAllowedBrowserOrigin(request)) return response.status(403).json({ error: 'origin_not_allowed' })
  const ip = requestIp(request)
  if (isLoginRateLimited(ip)) return response.status(429).json({ error: 'too_many_attempts' })

  const body = parseJsonBody<{ email?: string; password?: string }>(request)
  const config = serverConfig()
  const email = body?.email?.trim().toLowerCase() ?? ''
  const password = body?.password ?? ''
  if (!config.adminEmail || !config.adminPasswordHash || !config.adminSessionSecret) {
    return response.status(503).json({ error: 'admin_auth_not_configured' })
  }
  if (email !== config.adminEmail || !verifyPassword(password, config.adminPasswordHash)) {
    recordFailedLogin(ip)
    return response.status(401).json({ error: 'invalid_credentials' })
  }
  clearLoginAttempts(ip)
  const session = createAdminSession(config.adminEmail, response)
  return response.status(200).json({ csrfToken: session.csrfToken })
}
