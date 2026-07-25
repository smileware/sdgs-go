import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StartScreen } from './StartScreen'

describe('StartScreen', () => {
  it('introduces the game and exposes the primary actions', () => {
    const { container } = render(<StartScreen onStart={vi.fn()} onDashboard={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'คุณคือใครใน SDGs 5P' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'เริ่ม' })).toBeInTheDocument()
    expect([...container.querySelectorAll('img')].map((image) => image.getAttribute('src'))).toEqual([
      '/assets/splash-screen.png',
      '/assets/intro-image.png',
      '/assets/sdgs-wheel.svg',
    ])
  })
})
