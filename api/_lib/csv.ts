import type { SheetExportRow } from './googleSheets'

const safeCell = (value: unknown): string => {
  const raw = value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value)
  const protectedValue = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${protectedValue.replace(/"/g, '""')}"`
}

const columns: Array<[string, (row: SheetExportRow) => unknown]> = [
  ['submission_id', (row) => row.submissionId],
  ['event_slug', (row) => row.eventSlug],
  ['participant_id', (row) => row.participantId],
  ['device_id', (row) => row.deviceId],
  ['nickname', (row) => row.nickname],
  ['age', (row) => row.age],
  ['gender', (row) => row.gender],
  ['phone', (row) => row.phone],
  ['privacy_version', (row) => row.privacyVersion],
  ['privacy_accepted_at', (row) => row.privacyAcceptedAt],
  ['card_set_version', (row) => row.cardSetVersion],
  ['character', (row) => row.character],
  ['scores_json', (row) => row.scores],
  ['responses_json', (row) => row.responses],
  ['client_completed_at', (row) => row.clientCompletedAt],
]

export const exportRowsToCsv = (rows: SheetExportRow[]): string => {
  const bySubmission = new Map<string, SheetExportRow>()
  for (const row of rows) {
    if (!bySubmission.has(row.submissionId)) bySubmission.set(row.submissionId, row)
  }
  const unique = [...bySubmission.values()]
  const lines = [
    columns.map(([name]) => safeCell(name)).join(','),
    ...unique.map((row) => columns.map(([, read]) => safeCell(read(row))).join(',')),
  ]
  return `\uFEFF${lines.join('\r\n')}`
}
