import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StartScreen } from './StartScreen'

afterEach(cleanup)

describe('StartScreen', () => {
  it('introduces the game and exposes the primary actions', () => {
    const onLanguageChange = vi.fn()
    const { container } = render(
      <StartScreen language="th" onLanguageChange={onLanguageChange} onStart={vi.fn()} />,
    )
    expect(screen.getByRole('heading', { name: 'คุณคือใครใน SDGs 5P' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'เริ่ม' })).toBeInTheDocument()
    const languageSwitcher = screen.getByRole('group', { name: 'เลือกภาษา' })
    expect(languageSwitcher).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ไทย' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'ไทย' })).not.toHaveClass('language-option--active')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveClass('language-option--active')
    expect([...container.querySelectorAll('img')].map((image) => image.getAttribute('src'))).toEqual([
      '/assets/splash-screen.png',
      '/assets/intro-th.png',
    ])

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(onLanguageChange).toHaveBeenCalledWith('en')
  })

  it('renders the English intro and active language state', () => {
    const { container } = render(
      <StartScreen language="en" onLanguageChange={vi.fn()} onStart={vi.fn()} />,
    )

    expect(screen.getByRole('heading', { name: 'Who Are You in the SDGs 5Ps?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ไทย' })).toHaveClass('language-option--active')
    expect(screen.getByRole('button', { name: 'EN' })).not.toHaveClass('language-option--active')
    expect(container.querySelector('.start-intro')).toHaveAttribute('src', '/assets/intro-en.png')
  })
})
