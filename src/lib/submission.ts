import { CARDS } from '../content/cards'
import type { CardResponse, PlayerDraft, SubmissionPayloadV1 } from '../types'
import { CATEGORIES } from '../types'
import { calculateResult } from './game'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EVENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/
const PHONE_CHARS_PATTERN = /^[0-9+\-()\s]+$/
const cardById = new Map(CARDS.map((card) => [card.id, card]))

export const normalizePhone = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed || null
}

export const isValidPhone = (value: string): boolean => {
  const normalized = normalizePhone(value)
  if (!normalized) return true
  if (!PHONE_CHARS_PATTERN.test(normalized) || normalized.length > 30) return false
  const digitCount = normalized.replace(/\D/g, '').length
  return digitCount >= 8 && digitCount <= 15
}

export const normalizePlayerDraft = (draft: PlayerDraft): PlayerDraft => ({
  ...draft,
  nickname: draft.nickname.trim(),
  age: draft.age.trim(),
  phone: draft.phone.trim(),
})

export const validateResponses = (responses: CardResponse[]): string[] => {
  const errors: string[] = []
  if (responses.length !== 15) errors.push('responses must contain exactly 15 answers')

  const ids = new Set<string>()
  const positions = new Set<number>()
  const categoryCounts = new Map(CATEGORIES.map((category) => [category, 0]))

  for (const response of responses) {
    const card = cardById.get(response.cardId)
    if (!card) errors.push(`unknown card: ${response.cardId}`)
    else if (card.category !== response.category) errors.push(`category mismatch: ${response.cardId}`)
    if (ids.has(response.cardId)) errors.push(`duplicate card: ${response.cardId}`)
    if (!Number.isInteger(response.position) || response.position < 1 || response.position > 15) {
      errors.push(`invalid position: ${response.position}`)
    }
    if (positions.has(response.position)) errors.push(`duplicate position: ${response.position}`)
    ids.add(response.cardId)
    positions.add(response.position)
    if (categoryCounts.has(response.category)) {
      categoryCounts.set(response.category, categoryCounts.get(response.category)! + 1)
    }
  }

  for (const category of CATEGORIES) {
    if (categoryCounts.get(category) !== 3) errors.push(`${category} must contain exactly 3 answers`)
  }
  return errors
}

export const buildSubmission = ({
  participantId,
  draft,
  resultSeed,
  result,
  responses,
  eventSlug,
  privacyVersion,
  cardSetVersion,
  deviceId,
}: {
  participantId: string
  draft: PlayerDraft
  resultSeed: string
  result: SubmissionPayloadV1['result']
  responses: CardResponse[]
  eventSlug: string
  privacyVersion: string
  cardSetVersion: string
  deviceId: string
}): SubmissionPayloadV1 => {
  const player = normalizePlayerDraft(draft)
  return {
    version: 1,
    submissionId: crypto.randomUUID(),
    participantId,
    eventSlug,
    deviceId,
    player: {
      nickname: player.nickname,
      age: Number(player.age),
      gender: player.gender as SubmissionPayloadV1['player']['gender'],
      phone: normalizePhone(player.phone),
      privacyAcceptedAt: new Date().toISOString(),
      privacyVersion,
    },
    cardSetVersion,
    resultSeed,
    result,
    responses,
    clientCompletedAt: new Date().toISOString(),
  }
}

export const validateSubmission = (
  input: unknown,
): { ok: true; payload: SubmissionPayloadV1 } | { ok: false; errors: string[] } => {
  if (!input || typeof input !== 'object') return { ok: false, errors: ['payload must be an object'] }
  const payload = input as SubmissionPayloadV1
  const errors: string[] = []

  if (payload.version !== 1) errors.push('unsupported payload version')
  if (!UUID_PATTERN.test(payload.submissionId ?? '')) errors.push('invalid submissionId')
  if (!UUID_PATTERN.test(payload.participantId ?? '')) errors.push('invalid participantId')
  if (!UUID_PATTERN.test(payload.deviceId ?? '')) errors.push('invalid deviceId')
  if (!EVENT_SLUG_PATTERN.test(payload.eventSlug ?? '')) errors.push('invalid eventSlug')
  if (!payload.player || typeof payload.player !== 'object') {
    errors.push('player is required')
  } else {
    if (!payload.player.nickname?.trim() || payload.player.nickname.trim().length > 60) errors.push('invalid nickname')
    if (!Number.isInteger(payload.player.age) || payload.player.age < 1 || payload.player.age > 120) errors.push('invalid age')
    if (!['male', 'female', 'unspecified'].includes(payload.player.gender)) errors.push('invalid gender')
    if (!isValidPhone(payload.player.phone ?? '')) errors.push('invalid phone')
    if (!payload.player.privacyAcceptedAt || Number.isNaN(Date.parse(payload.player.privacyAcceptedAt))) {
      errors.push('invalid privacyAcceptedAt')
    }
    if (!payload.player.privacyVersion?.trim() || payload.player.privacyVersion.length > 50) {
      errors.push('invalid privacyVersion')
    }
  }
  if (!payload.cardSetVersion?.trim() || payload.cardSetVersion.length > 50) errors.push('invalid cardSetVersion')
  if (!payload.resultSeed || payload.resultSeed.length > 100) errors.push('invalid resultSeed')
  if (!Array.isArray(payload.responses)) errors.push('responses must be an array')
  else errors.push(...validateResponses(payload.responses))
  if (!payload.clientCompletedAt || Number.isNaN(Date.parse(payload.clientCompletedAt))) errors.push('invalid clientCompletedAt')

  if (!errors.length) {
    const computed = calculateResult(payload.responses, payload.resultSeed)
    if (JSON.stringify(computed) !== JSON.stringify(payload.result)) {
      payload.result = computed
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, payload }
}
