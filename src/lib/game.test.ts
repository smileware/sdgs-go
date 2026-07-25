import { describe, expect, it } from 'vitest'
import { CARDS } from '../content/cards'
import { CATEGORIES, type CardResponse, type Category } from '../types'
import { calculateResult, sampleGameCards } from './game'

const responsesFor = (scores: Record<Category, number>): CardResponse[] =>
  CATEGORIES.flatMap((category) =>
    [0, 1, 2].map((index) => ({
      cardId: `${category}-${index}`,
      category,
      liked: index < scores[category],
      position: CATEGORIES.indexOf(category) * 3 + index + 1,
    })),
  )

describe('card content', () => {
  it('contains 80 unique cards split evenly across 5P', () => {
    expect(CARDS).toHaveLength(80)
    expect(new Set(CARDS.map((card) => card.id)).size).toBe(80)
    for (const category of CATEGORIES) {
      expect(CARDS.filter((card) => card.category === category)).toHaveLength(16)
    }
  })
})

describe('sampleGameCards', () => {
  it('returns 15 unique cards with exactly three cards per category', () => {
    const cards = sampleGameCards(CARDS, () => 0.42)
    expect(cards).toHaveLength(15)
    expect(new Set(cards.map((card) => card.id)).size).toBe(15)
    for (const category of CATEGORIES) {
      expect(cards.filter((card) => card.category === category)).toHaveLength(3)
    }
  })
})

describe('calculateResult', () => {
  it('returns the highest scoring character and lowest scoring growth area', () => {
    const result = calculateResult(responsesFor({
      people: 3,
      prosperity: 2,
      planet: 1,
      peace: 0,
      partnership: 1,
    }), 'session-a')

    expect(result.character).toBe('people')
    expect(result.strongest).toBe('people')
    expect(result.growth).toBe('peace')
  })

  it('returns all-rounder when the five scores are within one point', () => {
    const result = calculateResult(responsesFor({
      people: 3,
      prosperity: 3,
      planet: 2,
      peace: 2,
      partnership: 2,
    }), 'session-b')

    expect(result.character).toBe('all-rounder')
    expect(result.strongest).toBeNull()
    expect(result.growth).toBeNull()
  })

  it('resolves a partial tie deterministically for a session seed', () => {
    const answers = responsesFor({
      people: 3,
      prosperity: 3,
      planet: 1,
      peace: 0,
      partnership: 1,
    })
    const first = calculateResult(answers, 'fixed-seed')
    const second = calculateResult(answers, 'fixed-seed')

    expect(['people', 'prosperity']).toContain(first.character)
    expect(second.character).toBe(first.character)
  })
})
