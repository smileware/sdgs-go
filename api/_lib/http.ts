export interface ApiRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
  query?: Record<string, string | string[] | undefined>
  socket?: { remoteAddress?: string }
}

export interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (value: unknown) => void
  send: (value: string | Buffer) => void
  end: () => void
  setHeader: (name: string, value: string | string[]) => void
}

export const header = (request: ApiRequest, name: string): string => {
  const value = request.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export const requestIp = (request: ApiRequest): string => {
  const forwarded = header(request, 'x-forwarded-for').split(',')[0]?.trim()
  return forwarded || request.socket?.remoteAddress || 'unknown'
}

export const parseJsonBody = <T>(request: ApiRequest): T => {
  if (typeof request.body === 'string') return JSON.parse(request.body) as T
  return request.body as T
}

export const methodNotAllowed = (response: ApiResponse, allowed: string) => {
  response.setHeader('Allow', allowed)
  response.status(405).json({ error: 'method_not_allowed' })
}

export const noStore = (response: ApiResponse) => {
  response.setHeader('Cache-Control', 'no-store, private')
}
