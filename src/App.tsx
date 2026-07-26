import { useEffect, useState } from 'react'
import { CARDS } from './content/cards'
import { getStoredLanguage, LANGUAGE_STORAGE_KEY, PLAYER_COPY } from './content/translations'
import { getConfigurationError } from './lib/config'
import { sampleGameCards } from './lib/game'
import { startOutboxSync } from './lib/outbox'
import { createParticipant } from './lib/repository'
import { DashboardScreen } from './screens/DashboardScreen'
import { GameScreen } from './screens/GameScreen'
import { RegisterScreen } from './screens/RegisterScreen'
import { ResultScreen } from './screens/ResultScreen'
import { SplashScreen } from './screens/SplashScreen'
import { StartScreen } from './screens/StartScreen'
import type { Card, CardResponse, GameResult, Language, PlayerDraft } from './types'

type Screen = 'splash' | 'start' | 'register' | 'game' | 'result' | 'dashboard'

export default function App() {
  const configurationError = getConfigurationError()
  const [screen, setScreen] = useState<Screen>(() => window.location.pathname === '/dashboard' ? 'dashboard' : 'splash')
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage())
  const [player, setPlayer] = useState<PlayerDraft | null>(null)
  const [participantId, setParticipantId] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [result, setResult] = useState<GameResult | null>(null)
  const [, setResponses] = useState<CardResponse[]>([])

  useEffect(() => startOutboxSync(), [])
  useEffect(() => {
    if (screen === 'dashboard') {
      document.documentElement.lang = 'th'
      return
    }

    document.documentElement.lang = language
    document.title = PLAYER_COPY[language].documentTitle
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // Language persistence is optional when storage is unavailable.
    }
  }, [language, screen])

  const navigate = (next: Screen) => {
    const path = next === 'dashboard' ? '/dashboard' : '/'
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setScreen(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const register = async (draft: PlayerDraft) => {
    const id = await createParticipant()
    setPlayer(draft)
    setParticipantId(id)
    setCards(sampleGameCards(CARDS))
    navigate('game')
  }

  const replay = () => {
    setCards(sampleGameCards(CARDS))
    setResult(null)
    setResponses([])
    navigate('game')
  }

  if (configurationError) {
    const copy = PLAYER_COPY[language].configuration
    return (
      <main className="configuration-error">
        <h1>{copy.title}</h1>
        <p>{copy.detail}</p>
      </main>
    )
  }
  if (screen === 'splash') return <SplashScreen language={language} onComplete={() => navigate('start')} />
  if (screen === 'dashboard') return <DashboardScreen />
  if (screen === 'register') {
    return <RegisterScreen language={language} onBack={() => navigate('start')} onSubmit={register} />
  }
  if (screen === 'game' && participantId && player) {
    return (
      <GameScreen
        language={language}
        participantId={participantId}
        player={player}
        cards={cards}
        onComplete={(nextResult, nextResponses) => {
          setResult(nextResult)
          setResponses(nextResponses)
          navigate('result')
        }}
      />
    )
  }
  if (screen === 'result' && result && player) {
    return (
      <ResultScreen
        language={language}
        nickname={player.nickname}
        result={result}
        onReplay={replay}
        onHome={() => navigate('start')}
      />
    )
  }
  return (
    <StartScreen
      language={language}
      onLanguageChange={setLanguage}
      onStart={() => navigate('register')}
    />
  )
}
