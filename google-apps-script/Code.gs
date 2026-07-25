var SUBMISSION_HEADERS = [
  'submission_id',
  'payload_version',
  'payload_hash',
  'event_slug',
  'participant_id',
  'device_id',
  'nickname',
  'age',
  'gender',
  'phone',
  'privacy_version',
  'privacy_accepted_at',
  'card_set_version',
  'result_seed',
  'character',
  'scores_json',
  'responses_json',
  'client_completed_at',
  'sheet_received_at',
  'supabase_synced_at',
  'payload_json',
]

var SYNC_HEADERS = ['timestamp', 'submission_id', 'source', 'target', 'attempt', 'status', 'error']
var SUMMARY_HEADERS = ['event_slug', 'total_players', 'total_plays', 'character', 'count', 'percentage', 'updated_at']

function setup() {
  ensureSheets_()
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) { return trigger.getHandlerFunction() === 'runMaintenance' })
    .forEach(function (trigger) { ScriptApp.deleteTrigger(trigger) })
  ScriptApp.newTrigger('runMaintenance').timeBased().everyMinutes(5).create()
}

function doPost(event) {
  try {
    var envelope = JSON.parse(event.postData.contents)
    var verified = verifyEnvelope_(envelope)
    if (!verified) return json_({ ok: false, error: 'invalid_signature' })
    var request = JSON.parse(envelope.payload)
    ensureSheets_()

    if (request.action === 'append') {
      return json_({ ok: true, data: appendOne_(request.data.payload, request.data.payloadHash, false) })
    }
    if (request.action === 'batch_append') {
      var syncedIds = []
      request.data.submissions.forEach(function (item) {
        appendOne_(item.payload, item.payloadHash, true)
        syncedIds.push(item.payload.submissionId)
      })
      return json_({ ok: true, data: { syncedIds: syncedIds } })
    }
    if (request.action === 'pending_supabase') {
      return json_({ ok: true, data: pendingSupabase_(request.data.limit || 100) })
    }
    if (request.action === 'mark_supabase_synced') {
      return json_({ ok: true, data: markSupabaseSynced_(request.data.submissionIds || []) })
    }
    if (request.action === 'summary') {
      return json_({ ok: true, data: summaryForEvent_(request.data.eventSlug) })
    }
    if (request.action === 'export') {
      return json_({ ok: true, data: exportForEvent_(request.data.eventSlug) })
    }
    return json_({ ok: false, error: 'unknown_action' })
  } catch (error) {
    if (String(error).indexOf('submission_conflict') >= 0) {
      return json_({ ok: false, conflict: true, error: 'submission_conflict' })
    }
    logSync_('', 'apps-script', 'request', 1, 'error', sanitizeError_(error))
    return json_({ ok: false, error: 'request_failed' })
  }
}

function runMaintenance() {
  ensureSheets_()
  rebuildSummary_()
  var url = PropertiesService.getScriptProperties().getProperty('RECONCILE_URL')
  if (!url) return
  var envelope = createEnvelope_('reconcile', {})
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(envelope),
      muteHttpExceptions: true,
    })
  } catch (error) {
    logSync_('', 'google-sheets', 'vercel', 1, 'error', sanitizeError_(error))
  }
}

function ensureSheets_() {
  var spreadsheetId = requiredProperty_('SPREADSHEET_ID')
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  ensureSheet_(spreadsheet, 'Submissions', SUBMISSION_HEADERS)
  ensureSheet_(spreadsheet, 'Summary', SUMMARY_HEADERS)
  ensureSheet_(spreadsheet, 'SyncLog', SYNC_HEADERS)
}

function ensureSheet_(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name)
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function submissionSheet_() {
  return SpreadsheetApp.openById(requiredProperty_('SPREADSHEET_ID')).getSheetByName('Submissions')
}

function appendOne_(payload, payloadHash, supabaseAlreadySynced) {
  var lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    var sheet = submissionSheet_()
    var existing = findSubmissionRow_(sheet, payload.submissionId)
    if (existing) {
      var existingHash = String(sheet.getRange(existing, 3).getValue())
      if (existingHash !== payloadHash) throw new Error('submission_conflict')
      if (supabaseAlreadySynced && !sheet.getRange(existing, 20).getValue()) {
        sheet.getRange(existing, 20).setValue(new Date().toISOString())
      }
      return { duplicate: true }
    }
    var now = new Date().toISOString()
    sheet.appendRow([
      payload.submissionId,
      payload.version,
      payloadHash,
      payload.eventSlug,
      payload.participantId,
      payload.deviceId,
      payload.player.nickname,
      payload.player.age,
      payload.player.gender,
      payload.player.phone || '',
      payload.player.privacyVersion,
      payload.player.privacyAcceptedAt,
      payload.cardSetVersion,
      payload.resultSeed,
      payload.result.character,
      JSON.stringify(payload.result.scores),
      JSON.stringify(payload.responses),
      payload.clientCompletedAt,
      now,
      supabaseAlreadySynced ? now : '',
      JSON.stringify(payload),
    ])
    return { duplicate: false }
  } catch (error) {
    if (String(error).indexOf('submission_conflict') >= 0) {
      logSync_(payload.submissionId, 'gateway', 'google-sheets', 1, 'conflict', 'payload hash mismatch')
      throw new Error('submission_conflict')
    }
    throw error
  } finally {
    lock.releaseLock()
  }
}

function findSubmissionRow_(sheet, submissionId) {
  if (sheet.getLastRow() < 2) return 0
  var match = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(String(submissionId))
    .matchEntireCell(true)
    .findNext()
  return match ? match.getRow() : 0
}

function pendingSupabase_(limit) {
  var sheet = submissionSheet_()
  if (sheet.getLastRow() < 2) return []
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, SUBMISSION_HEADERS.length).getValues()
  return values
    .filter(function (row) { return !row[19] })
    .slice(0, Math.min(Math.max(Number(limit), 1), 100))
    .map(function (row) {
      return { payload: JSON.parse(row[20]), payloadHash: String(row[2]) }
    })
}

function markSupabaseSynced_(submissionIds) {
  var lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    var sheet = submissionSheet_()
    var updated = 0
    submissionIds.forEach(function (id) {
      var row = findSubmissionRow_(sheet, id)
      if (row && !sheet.getRange(row, 20).getValue()) {
        sheet.getRange(row, 20).setValue(new Date().toISOString())
        updated += 1
      }
    })
    return { updated: updated }
  } finally {
    lock.releaseLock()
  }
}

function exportForEvent_(eventSlug) {
  var sheet = submissionSheet_()
  if (sheet.getLastRow() < 2) return []
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, SUBMISSION_HEADERS.length).getValues()
    .filter(function (row) { return String(row[3]) === String(eventSlug) })
    .map(function (row) {
      var payload = JSON.parse(row[20])
      return {
        submissionId: payload.submissionId,
        eventSlug: payload.eventSlug,
        participantId: payload.participantId,
        deviceId: payload.deviceId,
        nickname: payload.player.nickname,
        age: payload.player.age,
        gender: payload.player.gender,
        phone: payload.player.phone || null,
        privacyVersion: payload.player.privacyVersion,
        privacyAcceptedAt: payload.player.privacyAcceptedAt,
        cardSetVersion: payload.cardSetVersion,
        character: payload.result.character,
        scores: payload.result.scores,
        responses: payload.responses,
        clientCompletedAt: payload.clientCompletedAt,
      }
    })
}

function summaryForEvent_(eventSlug) {
  var rows = exportForEvent_(eventSlug)
  var firstByParticipant = {}
  rows.forEach(function (row) {
    if (!firstByParticipant[row.participantId]) firstByParticipant[row.participantId] = row
  })
  var counts = {}
  Object.keys(firstByParticipant).forEach(function (id) {
    var character = firstByParticipant[id].character
    counts[character] = (counts[character] || 0) + 1
  })
  var totalPlayers = Object.keys(firstByParticipant).length
  return {
    totalPlayers: totalPlayers,
    totalPlays: rows.length,
    characters: Object.keys(counts).map(function (character) {
      return {
        character: character,
        count: counts[character],
        percentage: totalPlayers ? Math.round((counts[character] / totalPlayers) * 1000) / 10 : 0,
      }
    }).sort(function (a, b) { return b.count - a.count }),
    updatedAt: new Date().toISOString(),
  }
}

function rebuildSummary_() {
  var sheet = submissionSheet_()
  var summary = SpreadsheetApp.openById(requiredProperty_('SPREADSHEET_ID')).getSheetByName('Summary')
  if (summary.getLastRow() > 1) summary.getRange(2, 1, summary.getLastRow() - 1, SUMMARY_HEADERS.length).clearContent()
  if (sheet.getLastRow() < 2) return
  var eventSlugs = {}
  sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getValues().forEach(function (row) { eventSlugs[String(row[0])] = true })
  var output = []
  Object.keys(eventSlugs).forEach(function (eventSlug) {
    var result = summaryForEvent_(eventSlug)
    if (!result.characters.length) output.push([eventSlug, result.totalPlayers, result.totalPlays, '', 0, 0, result.updatedAt])
    result.characters.forEach(function (item) {
      output.push([eventSlug, result.totalPlayers, result.totalPlays, item.character, item.count, item.percentage, result.updatedAt])
    })
  })
  if (output.length) summary.getRange(2, 1, output.length, SUMMARY_HEADERS.length).setValues(output)
}

function verifyEnvelope_(envelope) {
  if (!envelope || Math.abs(Date.now() - Number(envelope.timestamp)) > 5 * 60 * 1000) return false
  var cache = CacheService.getScriptCache()
  if (cache.get('nonce:' + envelope.nonce)) return false
  var expected = hmac_(envelope.timestamp + '.' + envelope.nonce + '.' + envelope.payload)
  if (expected !== envelope.signature) return false
  cache.put('nonce:' + envelope.nonce, '1', 600)
  return true
}

function createEnvelope_(action, data) {
  var timestamp = Date.now()
  var nonce = Utilities.getUuid().replace(/-/g, '')
  var payload = JSON.stringify({ action: action, data: data })
  return {
    timestamp: timestamp,
    nonce: nonce,
    payload: payload,
    signature: hmac_(timestamp + '.' + nonce + '.' + payload),
  }
}

function hmac_(value) {
  var bytes = Utilities.computeHmacSha256Signature(value, requiredProperty_('SHARED_SECRET'))
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '')
}

function requiredProperty_(name) {
  var value = PropertiesService.getScriptProperties().getProperty(name)
  if (!value) throw new Error('missing script property: ' + name)
  return value
}

function logSync_(submissionId, source, target, attempt, status, error) {
  try {
    var sheet = SpreadsheetApp.openById(requiredProperty_('SPREADSHEET_ID')).getSheetByName('SyncLog')
    sheet.appendRow([new Date().toISOString(), submissionId, source, target, attempt, status, error])
  } catch (_) {
    // Never log submission payloads or personal data.
  }
}

function sanitizeError_(error) {
  return String(error && error.message ? error.message : error).slice(0, 250)
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON)
}
