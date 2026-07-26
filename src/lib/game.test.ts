import { existsSync } from 'node:fs'
import { join } from 'node:path'
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
    expect(CARDS.every((card) => card.text.trim() && card.textEn.trim())).toBe(true)
  })

  it('maps every card to a real image asset', () => {
    expect(new Set(CARDS.map((card) => card.image)).size).toBe(80)
    for (const card of CARDS) {
      expect(existsSync(join(process.cwd(), 'public', card.image)), card.image).toBe(true)
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

  it('returns balanced only when all five non-zero scores are equal', () => {
    const result = calculateResult(responsesFor({
      people: 2,
      prosperity: 2,
      planet: 2,
      peace: 2,
      partnership: 2,
    }), 'session-b')

    expect(result.character).toBe('balanced')
    expect(result.strongest).toBeNull()
    expect(result.growth).toBeNull()
  })

  it('does not return balanced when the five scores are merely close', () => {
    const result = calculateResult(responsesFor({
      people: 3,
      prosperity: 3,
      planet: 2,
      peace: 2,
      partnership: 2,
    }), 'session-close')

    expect(['people', 'prosperity']).toContain(result.character)
    expect(result.character).not.toBe('balanced')
  })

  it.each([
    {
      scores: { people: 3, prosperity: 3, planet: 1, peace: 0, partnership: 1 },
      expected: ['people', 'prosperity'],
    },
    {
      scores: { people: 3, prosperity: 3, planet: 3, peace: 0, partnership: 1 },
      expected: ['people', 'prosperity', 'planet'],
    },
    {
      scores: { people: 3, prosperity: 3, planet: 3, peace: 3, partnership: 1 },
      expected: ['people', 'prosperity', 'planet', 'peace'],
    },
  ] as Array<{ scores: Record<Category, number>; expected: Category[] }>)(
    'randomly resolves a $expected.length-category tie and stays stable for the submission seed',
    ({ scores, expected }) => {
      const first = calculateResult(responsesFor(scores), 'fixed-seed')
      const second = calculateResult(responsesFor(scores), 'fixed-seed')

      expect(expected).toContain(first.character)
      expect(second.character).toBe(first.character)
      expect(second.strongest).toBe(first.strongest)
    },
  )

  it('returns no-score when every answer is rejected', () => {
    const answers = responsesFor({
      people: 0,
      prosperity: 0,
      planet: 0,
      peace: 0,
      partnership: 0,
    })
    const result = calculateResult(answers, 'session-empty')

    expect(result.character).toBe('no-score')
    expect(result.strongest).toBeNull()
    expect(result.growth).toBeNull()
  })
})
