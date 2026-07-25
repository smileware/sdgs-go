const deviceAttempts = new Map<string, number[]>()
const ipAttempts = new Map<string, number[]>()

const consume = (store: Map<string, number[]>, key: string, limit: number): boolean => {
  const cutoff = Date.now() - 60 * 60 * 1000
  const current = (store.get(key) ?? []).filter((timestamp) => timestamp > cutoff)
  if (current.length >= limit) {
    store.set(key, current)
    return false
  }
  current.push(Date.now())
  store.set(key, current)
  return true
}

export const consumeSubmissionLimit = (ip: string, deviceId: string): boolean =>
  consume(ipAttempts, ip, 1_000) && consume(deviceAttempts, deviceId || 'unknown', 120)
