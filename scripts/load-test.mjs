import { randomUUID } from 'node:crypto'

const target = process.env.LOAD_TEST_URL
const total = Number(process.env.LOAD_TEST_COUNT || 100)
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 10)

if (!target) {
  process.stderr.write('Set LOAD_TEST_URL to the deployed /api/submissions endpoint.\n')
  process.exit(1)
}

const categories = ['people', 'prosperity', 'planet', 'peace', 'partnership']

const payload = () => {
  const responses = categories.flatMap((category, categoryIndex) =>
    [1, 2, 3].map((cardNumber, index) => ({
      cardId: `${category}-${String(cardNumber).padStart(2, '0')}`,
      category,
      liked: index < 2,
      position: categoryIndex * 3 + index + 1,
    })),
  )
  return {
    version: 1,
    submissionId: randomUUID(),
    participantId: randomUUID(),
    eventSlug: 'sustrend-2027',
    deviceId: randomUUID(),
    player: {
      nickname: 'load-test',
      age: 30,
      gender: 'unspecified',
      phone: null,
      privacyAcceptedAt: new Date().toISOString(),
      privacyVersion: 'load-test',
    },
    cardSetVersion: '2026-01',
    resultSeed: randomUUID(),
    result: {
      character: 'all-rounder',
      strongest: null,
      growth: null,
      scores: Object.fromEntries(categories.map((category) => [category, 2])),
    },
    responses,
    clientCompletedAt: new Date().toISOString(),
  }
}

let next = 0
const results = []
const startedAt = Date.now()

const worker = async () => {
  while (next < total) {
    const index = next
    next += 1
    const started = Date.now()
    try {
      const response = await fetch(target, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload()),
      })
      results[index] = { status: response.status, duration: Date.now() - started }
    } catch {
      results[index] = { status: 0, duration: Date.now() - started }
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()))

const accepted = results.filter((result) => result.status === 202).length
const durations = results.map((result) => result.duration).sort((a, b) => a - b)
const percentile = (value) => durations[Math.min(durations.length - 1, Math.floor(durations.length * value))]
process.stdout.write(JSON.stringify({
  total,
  accepted,
  failed: total - accepted,
  elapsedMs: Date.now() - startedAt,
  p50Ms: percentile(0.5),
  p95Ms: percentile(0.95),
  p99Ms: percentile(0.99),
}, null, 2) + '\n')

if (accepted !== total || percentile(0.99) > 3000) process.exitCode = 1
