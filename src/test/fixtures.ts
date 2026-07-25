import { CARDS } from '../content/cards'
import { calculateResult } from '../lib/game'
import type { CardResponse, SubmissionPayloadV1 } from '../types'
import { CATEGORIES } from '../types'

export const validResponses = (): CardResponse[] => CATEGORIES.flatMap((category) =>
  CARDS.filter((card) => card.category === category).slice(0, 3).map((card, index) => ({
    cardId: card.id,
    category,
    liked: index !== 2,
    position: CATEGORIES.indexOf(category) * 3 + index + 1,
  })),
)

export const validSubmission = (): SubmissionPayloadV1 => {
  const responses = validResponses()
  const resultSeed = crypto.randomUUID()
  return {
    version: 1,
    submissionId: crypto.randomUUID(),
    participantId: crypto.randomUUID(),
    eventSlug: 'sustrend-2027',
    deviceId: crypto.randomUUID(),
    player: {
      nickname: 'โกดี',
      age: 27,
      gender: 'unspecified',
      phone: '+66 81-234-5678',
      privacyAcceptedAt: new Date().toISOString(),
      privacyVersion: '2026-01',
    },
    cardSetVersion: '2026-01',
    resultSeed,
    result: calculateResult(responses, resultSeed),
    responses,
    clientCompletedAt: new Date().toISOString(),
  }
}
