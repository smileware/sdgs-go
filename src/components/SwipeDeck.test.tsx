import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Card } from '../types'
import { SwipeDeck } from './SwipeDeck'

const cards: Card[] = [
  {
    id: 'people-01',
    category: 'people',
    icon: '',
    image: '/assets/cards/people-01.png',
    text: 'การ์ดใบแรก',
    textEn: 'The first card',
  },
  {
    id: 'planet-01',
    category: 'planet',
    icon: '',
    image: '/assets/cards/planet-01.png',
    text: 'การ์ดใบถัดไป',
    textEn: 'The next card',
  },
]

afterEach(cleanup)

describe('SwipeDeck image transitions', () => {
  it('mounts a fresh image element when the active card changes', () => {
    const { container, rerender } = render(
      <SwipeDeck language="th" cards={cards} forcedSwipe={null} onSwipe={vi.fn()} />,
    )
    const firstImage = container.querySelector('.card-illustration')

    rerender(
      <SwipeDeck language="th" cards={cards.slice(1)} forcedSwipe={null} onSwipe={vi.fn()} />,
    )
    const nextImage = container.querySelector('.card-illustration')

    expect(firstImage).not.toBe(nextImage)
    expect(nextImage).toHaveAttribute('src', cards[1].image)
  })

  it('renders English card copy and swipe stamps', () => {
    const { getByRole, getByText } = render(
      <SwipeDeck language="en" cards={cards} forcedSwipe={null} onSwipe={vi.fn()} />,
    )

    expect(getByRole('heading', { name: 'The first card' })).toBeInTheDocument()
    expect(getByText('Love it')).toBeInTheDocument()
    expect(getByText('Maybe not yet')).toBeInTheDocument()
  })
})
