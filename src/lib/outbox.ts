import type { OutboxState, SubmissionPayloadV1, SubmissionReceipt, SyncStatus } from '../types'

const DATABASE_NAME = 'sustrend-kiosk-v1'
const STORE_NAME = 'submissions'
const DEVICE_KEY = 'sustrend-kiosk-device-id-v1'
const LAST_SYNC_KEY = 'sustrend-kiosk-last-sync-v1'
const SYNC_EVENT = 'sustrend-sync-status'

interface OutboxRecord {
  submissionId: string
  payload: SubmissionPayloadV1
  state: OutboxState
  supabase: 'ok' | 'pending'
  sheet: 'ok' | 'pending'
  attempts: number
  nextAttemptAt: number
  createdAt: string
  lastError?: string
}

let flushPromise: Promise<void> | null = null

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, 1)
  request.onupgradeneeded = () => {
    const database = request.result
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME, { keyPath: 'submissionId' })
    }
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const useStore = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = operation(transaction.objectStore(STORE_NAME))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => reject(transaction.error)
  })
}

const allRecords = (): Promise<OutboxRecord[]> => useStore('readonly', (store) => store.getAll())
const putRecord = (record: OutboxRecord) => useStore('readwrite', (store) => store.put(record))
const deleteRecord = (id: string) => useStore('readwrite', (store) => store.delete(id))

const announceStatus = () => window.dispatchEvent(new CustomEvent(SYNC_EVENT))

const retryDelay = (attempt: number) => {
  const base = Math.min(300_000, 5_000 * (2 ** Math.min(attempt, 6)))
  return base + Math.floor(Math.random() * Math.min(5_000, base * 0.2))
}

export const getDeviceId = (): string => {
  const current = localStorage.getItem(DEVICE_KEY)
  if (current) return current
  const next = crypto.randomUUID()
  localStorage.setItem(DEVICE_KEY, next)
  return next
}

export const enqueueSubmission = async (payload: SubmissionPayloadV1): Promise<void> => {
  await putRecord({
    submissionId: payload.submissionId,
    payload,
    state: 'pending',
    supabase: 'pending',
    sheet: 'pending',
    attempts: 0,
    nextAttemptAt: 0,
    createdAt: new Date().toISOString(),
  })
  announceStatus()
}

const submitRecord = async (record: OutboxRecord): Promise<void> => {
  try {
    const response = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(record.payload),
    })
    const receipt = await response.json().catch(() => null) as SubmissionReceipt | null
    if (response.status === 409 || receipt?.supabase === 'conflict' || receipt?.sheet === 'conflict') {
      await putRecord({ ...record, state: 'dead-letter', lastError: 'submission conflict' })
      return
    }
    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
      await putRecord({ ...record, state: 'dead-letter', lastError: `gateway rejected submission (${response.status})` })
      return
    }
    if (!response.ok || !receipt) throw new Error(`gateway returned ${response.status}`)

    const supabase = receipt.supabase === 'ok' ? 'ok' : record.supabase
    const sheet = receipt.sheet === 'ok' ? 'ok' : record.sheet
    if (supabase === 'ok' && sheet === 'ok') {
      await deleteRecord(record.submissionId)
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
      return
    }
    await putRecord({
      ...record,
      supabase,
      sheet,
      state: 'partial',
      attempts: record.attempts + 1,
      nextAttemptAt: Date.now() + retryDelay(record.attempts + 1),
      lastError: undefined,
    })
  } catch (error) {
    await putRecord({
      ...record,
      attempts: record.attempts + 1,
      nextAttemptAt: Date.now() + retryDelay(record.attempts + 1),
      lastError: error instanceof Error ? error.message : 'unknown sync error',
    })
  }
}

export const flushPendingSubmissions = async (): Promise<void> => {
  if (!('indexedDB' in window) || !navigator.onLine) return
  if (flushPromise) return flushPromise
  flushPromise = (async () => {
    const records = await allRecords()
    for (const record of records) {
      if (record.state !== 'dead-letter' && record.nextAttemptAt <= Date.now()) {
        await submitRecord(record)
      }
    }
    announceStatus()
  })().finally(() => {
    flushPromise = null
  })
  return flushPromise
}

export const getSyncStatus = async (): Promise<SyncStatus> => {
  const records = 'indexedDB' in window ? await allRecords() : []
  return {
    pending: records.filter((record) => record.state === 'pending').length,
    partial: records.filter((record) => record.state === 'partial').length,
    deadLetter: records.filter((record) => record.state === 'dead-letter').length,
    online: navigator.onLine,
    lastSuccessfulSync: localStorage.getItem(LAST_SYNC_KEY),
  }
}

export const subscribeToSyncStatus = (listener: () => void): (() => void) => {
  window.addEventListener(SYNC_EVENT, listener)
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener(SYNC_EVENT, listener)
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

export const startOutboxSync = (): (() => void) => {
  const sync = () => { void flushPendingSubmissions() }
  window.addEventListener('online', sync)
  const interval = window.setInterval(sync, 30_000)
  sync()
  return () => {
    window.removeEventListener('online', sync)
    window.clearInterval(interval)
  }
}
