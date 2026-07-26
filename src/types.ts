export const CATEGORIES = ['people', 'prosperity', 'planet', 'peace', 'partnership'] as const

export type Category = (typeof CATEGORIES)[number]
export type CharacterKey = Category | 'balanced' | 'no-score'
export type Scores = Record<Category, number>

export interface Card {
  id: string
  category: Category
  icon: string
  image: string
  text: string
}

export interface CardResponse {
  cardId: string
  category: Category
  liked: boolean
  position: number
}

export interface PlayerDraft {
  nickname: string
  age: string
  gender: '' | 'male' | 'female' | 'unspecified'
  phone: string
  privacyAccepted: boolean
  marketingAccepted: boolean
}

export interface GameResult {
  character: CharacterKey
  scores: Scores
  strongest: Category | null
  growth: Category | null
}

export interface CharacterContent {
  key: CharacterKey
  eyebrow: string
  name: string
  description: string
  strength: string
  advice: string
  icon: string
  image?: string
  color: string
  softColor: string
}

export interface DashboardSummary {
  totalPlayers: number
  totalPlays: number
  characters: Array<{
    character: CharacterKey
    count: number
    percentage: number
  }>
  updatedAt: string
  source?: 'supabase' | 'google-sheets' | 'cache'
  syncWarning?: string | null
}

export interface SubmissionPayloadV1 {
  version: 1
  submissionId: string
  participantId: string
  eventSlug: string
  deviceId: string
  player: {
    nickname: string
    age: number
    gender: Exclude<PlayerDraft['gender'], ''>
    phone: string | null
    privacyAcceptedAt: string
    privacyVersion: string
  }
  cardSetVersion: string
  resultSeed: string
  result: GameResult
  responses: CardResponse[]
  clientCompletedAt: string
}

export type SubmissionSinkState = 'ok' | 'pending' | 'conflict'

export interface SubmissionReceipt {
  submissionId: string
  supabase: SubmissionSinkState
  sheet: SubmissionSinkState
}

export type OutboxState = 'pending' | 'partial' | 'dead-letter'

export interface SyncStatus {
  pending: number
  partial: number
  deadLetter: number
  online: boolean
  lastSuccessfulSync: string | null
}
