import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardSummary } from '../../src/types'
import { clearDashboardSummaryCache, loadCachedDashboardSummary } from './dashboardCache'

const summary: DashboardSummary = {
  totalPlayers: 12,
  totalPlays: 12,
  characters: [],
  updatedAt: '2026-07-26T00:00:00.000Z',
}

beforeEach(() => {
  clearDashboardSummaryCache()
  vi.useRealTimers()
})

describe('dashboard summary cache', () => {
  it('queries the data source again after the previous request completes', async () => {
    const loader = vi.fn().mockResolvedValue(summary)

    await loadCachedDashboardSummary('event', loader)
    await loadCachedDashboardSummary('event', loader)

    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('coalesces simultaneous refreshes into one data-source query', async () => {
    const loader = vi.fn().mockResolvedValue(summary)

    const [first, second] = await Promise.all([
      loadCachedDashboardSummary('event', loader),
      loadCachedDashboardSummary('event', loader),
    ])

    expect(first).toBe(summary)
    expect(second).toBe(summary)
    expect(loader).toHaveBeenCalledOnce()
  })
})
