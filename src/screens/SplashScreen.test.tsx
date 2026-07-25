import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SplashScreen } from './SplashScreen'

describe('SplashScreen', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('moves to the homepage after the splash animation', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()

    render(<SplashScreen onComplete={onComplete} />)

    act(() => vi.advanceTimersByTime(2599))
    expect(onComplete).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(onComplete).toHaveBeenCalledOnce()
  })
})
