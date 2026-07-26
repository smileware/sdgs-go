import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DashboardScreen } from './DashboardScreen'

const { loadDashboardSummaryMock } = vi.hoisted(() => ({
  loadDashboardSummaryMock: vi.fn(),
}))

vi.mock('../lib/repository', () => ({
  loadDashboardSummary: loadDashboardSummaryMock,
}))

afterEach(() => {
  cleanup()
  loadDashboardSummaryMock.mockReset()
})

describe('DashboardScreen kiosk layout', () => {
  it('shows a looping video, total participants, and every result category', async () => {
    loadDashboardSummaryMock.mockResolvedValue({
      totalPlayers: 22,
      totalPlays: 27,
      updatedAt: '2026-07-26T16:00:00.000Z',
      csrfToken: 'csrf',
      source: 'supabase',
      characters: [
        { character: 'people', count: 2, percentage: 9.1 },
        { character: 'prosperity', count: 4, percentage: 18.2 },
        { character: 'planet', count: 3, percentage: 13.6 },
        { character: 'peace', count: 1, percentage: 4.5 },
        { character: 'partnership', count: 3, percentage: 13.6 },
        { character: 'balanced', count: 8, percentage: 36.4 },
        { character: 'no-score', count: 1, percentage: 4.5 },
      ],
    })

    render(<DashboardScreen />)

    await waitFor(() => expect(screen.getByText('มีผู้ร่วมเล่นสะสมทั้งหมด')).toBeInTheDocument())
    const videoPanel = screen.getByLabelText('วิดีโอประชาสัมพันธ์')
    const video = videoPanel.querySelector('video') as HTMLVideoElement
    expect(video.autoplay).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.muted).toBe(true)
    expect(video.querySelector('source')).toHaveAttribute('src', '/placeholder-video.mp4')

    expect(screen.getByText('22')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'จำนวนผู้ร่วมเล่นในแต่ละหมวดหมู่' })).toBeInTheDocument()
    const categories = screen.getAllByRole('article')
    expect(categories).toHaveLength(7)
    expect(within(categories[0]).getByText('นักเชื่อมใจคน')).toBeInTheDocument()
    expect(within(categories[6]).getByText('ผู้อาจจะยังขาดความสมดุล')).toBeInTheDocument()
    expect(screen.queryByText('รอบที่เล่นทั้งหมด')).not.toBeInTheDocument()
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument()
  })
})
