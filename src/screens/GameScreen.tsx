import { Heart, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SwipeDeck, type SwipeDirection } from '../components/SwipeDeck'
import type { Card, CardResponse, GameResult, PlayerDraft } from '../types'
import { calculateResult } from '../lib/game'
import { savePlay } from '../lib/repository'

export function GameScreen({
  participantId,
  player,
  cards,
  onComplete,
}: {
  participantId: string
  player: PlayerDraft
  cards: Card[]
  onComplete: (result: GameResult, responses: CardResponse[]) => void
}) {
  const [index, setIndex] = useState(0)
  const [responses, setResponses] = useState<CardResponse[]>([])
  const [forcedSwipe, setForcedSwipe] = useState<{ direction: SwipeDirection; token: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const sessionSeed = useMemo(() => crypto.randomUUID(), [])
  const visibleCards = cards.slice(index, index + 3)

  const answer = async (direction: SwipeDirection) => {
    const current = cards[index]
    if (!current || saving) return
    const nextResponse: CardResponse = {
      cardId: current.id,
      category: current.category,
      liked: direction === 'right',
      position: index + 1,
    }
    const nextResponses = [...responses, nextResponse]
    setResponses(nextResponses)

    if (index === cards.length - 1) {
      setSaving(true)
      const result = calculateResult(nextResponses, sessionSeed)
      try {
        await savePlay(participantId, player, result, nextResponses, sessionSeed)
      } finally {
        onComplete(result, nextResponses)
      }
      return
    }
    setIndex((currentIndex) => currentIndex + 1)
  }

  const triggerButtonSwipe = (direction: SwipeDirection) => {
    setForcedSwipe({ direction, token: Date.now() + Math.random() })
  }

  return (
    <main className="game-screen" data-category={visibleCards[0]?.category ?? 'people'}>
      <div className="progress-track"><span style={{ width: `${((index + 1) / cards.length) * 100}%` }} /></div>
      <div className="progress-copy">{index + 1}/{cards.length}</div>

      <section className="game-copy">
        <h1>คุณรักที่จะทำสิ่งนี้หรือไม่?</h1>
      </section>

      <SwipeDeck cards={visibleCards} forcedSwipe={forcedSwipe} onSwipe={answer} />

      <div className="game-actions">
        <button className="action-button action-button--pass" onClick={() => triggerButtonSwipe('left')} disabled={saving} aria-label="อาจจะยัง">
          <X size={45} strokeWidth={1.8} />
        </button>
        <button className="action-button action-button--like" onClick={() => triggerButtonSwipe('right')} disabled={saving} aria-label="รักเลย">
          <Heart size={42} strokeWidth={1.8} />
        </button>
      </div>
      <p className="drag-note">ลากการ์ดซ้าย/ขวา หรือกดปุ่ม</p>
    </main>
  )
}
