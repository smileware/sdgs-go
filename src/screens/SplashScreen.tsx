import { useEffect } from 'react'

const SPLASH_DURATION_MS = 2600

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onComplete, SPLASH_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [onComplete])

  return (
    <main className="splash-screen" aria-label="กำลังเปิดเกม SDGs 5P">
      <img
        className="splash-screen__art"
        src="/assets/splash-screen.png"
        alt=""
        aria-hidden="true"
      />
    </main>
  )
}
