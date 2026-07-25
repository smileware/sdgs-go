const isProduction = import.meta.env.PROD

const requiredValue = (name: string, value: string | undefined, developmentFallback: string) => {
  const trimmed = value?.trim()
  if (trimmed) return trimmed
  if (!isProduction) return developmentFallback
  return ''
}

export const publicConfig = {
  eventSlug: requiredValue('VITE_EVENT_SLUG', import.meta.env.VITE_EVENT_SLUG, 'local-demo'),
  privacyVersion: requiredValue('VITE_PRIVACY_VERSION', import.meta.env.VITE_PRIVACY_VERSION, 'draft-v1'),
  cardSetVersion: requiredValue('VITE_CARD_SET_VERSION', import.meta.env.VITE_CARD_SET_VERSION, '2026-01'),
}

export const getConfigurationError = (): string | null => {
  const missing = Object.entries(publicConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  return missing.length
    ? `Production configuration is incomplete: ${missing.join(', ')}`
    : null
}
