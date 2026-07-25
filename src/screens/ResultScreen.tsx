import { Share2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useRef, useState } from 'react'
import { CHARACTERS } from '../content/results'
import type { GameResult } from '../types'

export function ResultScreen({
  nickname,
  result,
  onReplay,
  onHome,
}: {
  nickname: string
  result: GameResult
  onReplay: () => void
  onHome: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const character = CHARACTERS[result.character]
  const growth = result.growth ? CHARACTERS[result.growth] : null

  const buildImage = async () => {
    if (!cardRef.current) throw new Error('Result card unavailable')
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#f8f4e8' })
  }

  const downloadImage = async () => {
    setSharing(true)
    try {
      const dataUrl = await buildImage()
      const link = document.createElement('a')
      link.download = `sustrend-${result.character}.png`
      link.href = dataUrl
      link.click()
      setShareMessage('บันทึกภาพแล้ว')
    } finally {
      setSharing(false)
    }
  }

  const share = async () => {
    setSharing(true)
    setShareMessage('')
    try {
      const dataUrl = await buildImage()
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `sustrend-${result.character}.png`, { type: 'image/png' })
      const gameUrl = import.meta.env.VITE_PUBLIC_GAME_URL || window.location.origin
      const shareData = {
        title: 'SUSTREND Swipe — สิ่งที่คุณรัก',
        text: `ฉันคือ “${character.name}” แล้วคุณล่ะ?`,
        url: gameUrl,
        files: [file],
      }

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share(shareData)
      } else {
        await downloadImage()
        await navigator.clipboard?.writeText(gameUrl)
        setShareMessage('บันทึกภาพและคัดลอกลิงก์แล้ว')
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setShareMessage('แชร์ไม่สำเร็จ ลองบันทึกภาพแทนได้เลย')
    } finally {
      setSharing(false)
    }
  }

  return (
    <main className="result-screen">
      <button className="result-logo-button" onClick={onHome} aria-label="กลับหน้าแรก">
        <img src="/assets/result-logo.png" alt="" />
      </button>

      <div
        className="share-card"
        ref={cardRef}
        aria-label={`ผลลัพธ์ของ ${nickname}`}
        style={{ '--character': character.color, '--character-soft': character.softColor } as React.CSSProperties}
      >
        <p className="you-are">คุณคือ...</p>
        <h1>{character.name}</h1>
        <div className="character-orbit"><span>{character.icon}</span></div>
        <p className="character-description">{character.description}</p>

        <div className="insight insight--strength">
          <b>จุดแข็ง</b>
          <p>{character.strength}</p>
        </div>
        <div className="insight">
          <b>จุดอ่อน</b>
          <p>{growth?.advice ?? character.advice}</p>
        </div>
      </div>

      <div className="result-actions">
        <button className="figma-button" onClick={downloadImage} disabled={sharing}>
          {sharing ? 'กำลังสร้างภาพ…' : 'บันทึกภาพ'}
        </button>
        <button className="figma-button figma-button--outline" onClick={onReplay} disabled={sharing}>
          เล่นอีกครั้ง
        </button>
        {shareMessage && <p className="share-message">{shareMessage}</p>}
        <button className="share-link" onClick={share} disabled={sharing}><Share2 size={15} /> แชร์ผลลัพธ์</button>
      </div>
    </main>
  )
}
