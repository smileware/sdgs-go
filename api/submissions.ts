import { isAllowedBrowserOrigin } from './_lib/security.js'
import { methodNotAllowed, noStore, parseJsonBody, requestIp, type ApiRequest, type ApiResponse } from './_lib/http.js'
import { submitToBothSinks } from './_lib/gateway.js'
import { consumeSubmissionLimit } from './_lib/rateLimit.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  noStore(response)
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST')
  if (!isAllowedBrowserOrigin(request)) return response.status(403).json({ error: 'origin_not_allowed' })

  let body: unknown
  try {
    body = parseJsonBody(request)
  } catch {
    return response.status(400).json({ error: 'invalid_json' })
  }
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > 32 * 1024) {
    return response.status(413).json({ error: 'payload_too_large' })
  }
  const deviceId = body && typeof body === 'object' && 'deviceId' in body
    ? String((body as { deviceId?: unknown }).deviceId ?? '')
    : ''
  if (!consumeSubmissionLimit(requestIp(request), deviceId)) {
    response.setHeader('Retry-After', '60')
    return response.status(429).json({ error: 'rate_limited' })
  }
  const result = await submitToBothSinks(body)
  return response.status(result.status).json(result.receipt)
}
