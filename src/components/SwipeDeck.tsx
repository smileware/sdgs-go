import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { balanceCardText } from '../lib/cardText'
import type { Card } from '../types'

export type SwipeDirection = 'left' | 'right'

interface SwipeDeckProps {
  cards: Card[]
  forcedSwipe: { direction: SwipeDirection; token: number } | null
  onSwipe: (direction: SwipeDirection) => void
}

const DISTANCE_THRESHOLD = 88
const VELOCITY_THRESHOLD = 650

export function SwipeDeck({ cards, forcedSwipe, onSwipe }: SwipeDeckProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-14, 0, 14])
  const likeOpacity = useTransform(x, [20, 130], [0, 1])
  const passOpacity = useTransform(x, [-130, -20], [1, 0])
  const nextScale = useTransform(x, [-180, 0, 180], [1, 0.96, 1])
  const nextY = useTransform(x, [-180, 0, 180], [0, 10, 0])
  const [leaving, setLeaving] = useState(false)

  const topCard = cards[0]
  const nextCard = cards[1]
  const thirdCard = cards[2]
  const textLines = topCard ? balanceCardText(topCard.text) : []

  useEffect(() => {
    const sources = new Set<string>(['/assets/splash-screen.png'])
    cards.forEach((card) => {
      sources.add(card.image)
      sources.add(`/assets/frame-${card.category}.png`)
    })

    sources.forEach((source) => {
      const image = new Image()
      image.src = source
      void image.decode?.().catch(() => undefined)
    })
  }, [cards])

  const commitSwipe = (direction: SwipeDirection) => {
    if (leaving) return
    setLeaving(true)
    navigator.vibrate?.(10)
    const destination = direction === 'right' ? window.innerWidth + 220 : -window.innerWidth - 220
    animate(x, destination, {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        x.set(0)
        setLeaving(false)
        onSwipe(direction)
      },
    })
  }

  useEffect(() => {
    if (forcedSwipe) commitSwipe(forcedSwipe.direction)
    // forcedSwipe.token intentionally makes every button press unique.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedSwipe?.token])

  if (!topCard) return null

  return (
    <div className="deck" aria-live="polite">
      {thirdCard && <div className="swipe-card swipe-card--third" aria-hidden="true" />}
      {nextCard && <motion.div className="swipe-card swipe-card--next" style={{ scale: nextScale, y: nextY }} aria-hidden="true" />}
      <motion.article
        key={topCard.id}
        className="swipe-card swipe-card--active"
        style={{ x, rotate }}
        drag={leaving ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={1}
        whileDrag={{ cursor: 'grabbing', scale: 1.015 }}
        onDragEnd={(_, info) => {
          const shouldLeave =
            Math.abs(info.offset.x) >= DISTANCE_THRESHOLD ||
            (Math.abs(info.velocity.x) >= VELOCITY_THRESHOLD && Math.abs(info.offset.x) >= 24)

          if (shouldLeave) commitSwipe(info.offset.x >= 0 ? 'right' : 'left')
          else animate(x, 0, { type: 'spring', stiffness: 520, damping: 34 })
        }}
      >
        <motion.div className="swipe-stamp swipe-stamp--like" style={{ opacity: likeOpacity }}>รักเลย</motion.div>
        <motion.div className="swipe-stamp swipe-stamp--pass" style={{ opacity: passOpacity }}>อาจจะยัง</motion.div>
        <img className="card-frame" src={`/assets/frame-${topCard.category}.png`} alt="" draggable={false} />
        <img className="card-logo" src="/assets/splash-screen.png" alt="" draggable={false} />
        <img className="card-illustration" src={topCard.image} alt="" draggable={false} />
        <h2>
          {textLines.map((line, lineIndex) => <span key={`${lineIndex}-${line}`}>{line}</span>)}
        </h2>
      </motion.article>
    </div>
  )
}
