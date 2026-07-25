import { CATEGORIES, type Card, type CardResponse, type Category, type GameResult, type Scores } from '../types'

const shuffle = <T,>(items: T[], random: () => number): T[] => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[nextIndex]] = [result[nextIndex], result[index]]
  }
  return result
}

export const sampleGameCards = (cards: Card[], random = Math.random): Card[] => {
  const selected = CATEGORIES.flatMap((category) => {
    const categoryCards = cards.filter((card) => card.category === category)
    if (categoryCards.length < 3) throw new Error(`Not enough cards for ${category}`)
    return shuffle(categoryCards, random).slice(0, 3)
  })

  return shuffle(selected, random)
}

const emptyScores = (): Scores => ({
  people: 0,
  prosperity: 0,
  planet: 0,
  peace: 0,
  partnership: 0,
})

const hash = (value: string): number => {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

const seededPick = (categories: Category[], seed: string): Category | null => {
  if (!categories.length) return null
  return categories[hash(seed) % categories.length]
}

export const calculateResult = (responses: CardResponse[], seed: string): GameResult => {
  const scores = responses.reduce<Scores>((current, response) => {
    if (response.liked) current[response.category] += 1
    return current
  }, emptyScores())

  const values = CATEGORIES.map((category) => scores[category])
  const highest = Math.max(...values)
  const lowest = Math.min(...values)
  const isAllRounder = highest - lowest <= 1
  const strongestCandidates = CATEGORIES.filter((category) => scores[category] === highest)
  const growthCandidates = CATEGORIES.filter((category) => scores[category] === lowest)

  return {
    character: isAllRounder ? 'all-rounder' : seededPick(strongestCandidates, `${seed}-strong` )!,
    strongest: isAllRounder ? null : seededPick(strongestCandidates, `${seed}-strong`),
    growth: isAllRounder ? null : seededPick(growthCandidates, `${seed}-growth`),
    scores,
  }
}
