import { useEffect } from 'react'
import { PLAYER_COPY } from '../content/translations'
import type { Language } from '../types'

const SPLASH_DURATION_MS = 2600

export function SplashScreen({ language, onComplete }: { language: Language; onComplete: () => void }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onComplete, SPLASH_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [onComplete])

  return (
    <main className="splash-screen" aria-label={PLAYER_COPY[language].splashLabel}>
      <img
        className="splash-screen__art"
        src="/assets/splash-screen.png"
        alt=""
        aria-hidden="true"
      />
    </main>
  )
}
