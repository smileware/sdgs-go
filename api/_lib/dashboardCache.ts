import type { DashboardSummary } from '../../src/types.js'

const inFlight = new Map<string, Promise<DashboardSummary>>()

export const loadCachedDashboardSummary = (
  eventSlug: string,
  loader: (eventSlug: string) => Promise<DashboardSummary>,
): Promise<DashboardSummary> => {
  const currentRequest = inFlight.get(eventSlug)
  if (currentRequest) return currentRequest

  const request = loader(eventSlug)
    .finally(() => {
      inFlight.delete(eventSlug)
    })
  inFlight.set(eventSlug, request)
  return request
}

export const clearDashboardSummaryCache = () => {
  inFlight.clear()
}
