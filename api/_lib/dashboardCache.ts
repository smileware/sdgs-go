import type { DashboardSummary } from '../../src/types.js'

const CACHE_TTL_MS = 20_000
const cache = new Map<string, { expiresAt: number; summary: DashboardSummary }>()
const inFlight = new Map<string, Promise<DashboardSummary>>()

export const loadCachedDashboardSummary = (
  eventSlug: string,
  loader: (eventSlug: string) => Promise<DashboardSummary>,
): Promise<DashboardSummary> => {
  const cached = cache.get(eventSlug)
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.summary)

  const currentRequest = inFlight.get(eventSlug)
  if (currentRequest) return currentRequest

  const request = loader(eventSlug)
    .then((summary) => {
      cache.set(eventSlug, { summary, expiresAt: Date.now() + CACHE_TTL_MS })
      return summary
    })
    .finally(() => {
      inFlight.delete(eventSlug)
    })
  inFlight.set(eventSlug, request)
  return request
}

export const clearDashboardSummaryCache = () => {
  cache.clear()
  inFlight.clear()
}
