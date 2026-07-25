// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { SheetExportRow } from './googleSheets'
import { exportRowsToCsv } from './csv'

const row: SheetExportRow = {
  submissionId: 'submission-1',
  eventSlug: 'sustrend-2027',
  participantId: 'participant-1',
  deviceId: 'device-1',
  nickname: '=IMPORTXML("https://example.com")',
  age: 27,
  gender: 'unspecified',
  phone: '+66 81-234-5678',
  privacyVersion: '2026-01',
  privacyAcceptedAt: '2026-01-01T00:00:00.000Z',
  cardSetVersion: '2026-01',
  character: 'people',
  scores: { people: 3 },
  responses: [],
  clientCompletedAt: '2026-01-01T00:01:00.000Z',
}

describe('CSV export', () => {
  it('escapes formulas, quotes, and duplicate submission IDs', () => {
    const csv = exportRowsToCsv([row, { ...row, nickname: 'duplicate' }])
    expect(csv).toContain(`'=IMPORTXML(""https://example.com"")`)
    expect(csv.match(/submission-1/g)).toHaveLength(1)
  })
})
