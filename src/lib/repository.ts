import type { CardResponse, DashboardSummary, GameResult, PlayerDraft, SubmissionPayloadV1 } from '../types'
import { publicConfig } from './config'
import { getDeviceId, enqueueSubmission, flushPendingSubmissions } from './outbox'
import { buildSubmission } from './submission'

export const createParticipant = async (): Promise<string> => crypto.randomUUID()

export const savePlay = async (
  participantId: string,
  draft: PlayerDraft,
  result: GameResult,
  responses: CardResponse[],
  resultSeed: string,
): Promise<SubmissionPayloadV1> => {
  const submission = buildSubmission({
    participantId,
    draft,
    resultSeed,
    result,
    responses,
    eventSlug: publicConfig.eventSlug,
    privacyVersion: publicConfig.privacyVersion,
    cardSetVersion: publicConfig.cardSetVersion,
    deviceId: getDeviceId(),
  })
  await enqueueSubmission(submission)
  void flushPendingSubmissions()
  return submission
}

export interface AdminSummaryResponse extends DashboardSummary {
  csrfToken: string
}

export const loadDashboardSummary = async (): Promise<AdminSummaryResponse> => {
  const response = await fetch('/api/admin/dashboard-summary', { credentials: 'include' })
  if (response.status === 401) throw new Error('unauthorized')
  if (!response.ok) throw new Error(`dashboard returned ${response.status}`)
  return response.json() as Promise<AdminSummaryResponse>
}
