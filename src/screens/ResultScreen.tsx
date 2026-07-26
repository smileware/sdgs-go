import { toPng } from 'html-to-image'
import { useEffect, useRef, useState } from 'react'
import { CHARACTERS } from '../content/results'
import type { GameResult } from '../types'

const SHARE_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: '/assets/social/facebook.svg' },
  { key: 'instagram', label: 'Instagram', icon: '/assets/social/instagram.svg' },
  { key: 'tiktok', label: 'TikTok', icon: '/assets/social/tiktok.svg' },
  { key: 'x', label: 'X', icon: '/assets/social/x.svg' },
] as const

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
  const [preparedImage, setPreparedImage] = useState<{ dataUrl: string; file: File } | null>(null)
  const character = CHARACTERS[result.character]
  const isBalanced = result.character === 'balanced'
  const hasNoScore = result.character === 'no-score'
  const balancedCharacters = (['people', 'prosperity', 'planet', 'peace', 'partnership'] as const)
    .map((key) => CHARACTERS[key])

  const buildImage = async (): Promise<{ dataUrl: string; file: File }> => {
    if (!cardRef.current) throw new Error('Result card unavailable')
    await document.fonts?.ready
    await Promise.all(
      Array.from(cardRef.current.querySelectorAll('img')).map((image) => (
        image.decode ? image.decode().catch(() => undefined) : Promise.resolve()
      )),
    )
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#faf2e8' })
    const blob = await (await fetch(dataUrl)).blob()
    return {
      dataUrl,
      file: new File([blob], `sustrend-${result.character}.png`, { type: 'image/png' }),
    }
  }

  useEffect(() => {
    let active = true
    setPreparedImage(null)
    setShareMessage('')

    const frame = window.requestAnimationFrame(() => {
      void buildImage()
        .then((image) => {
          if (active) setPreparedImage(image)
        })
        .catch(() => {
          if (active) setShareMessage('ไม่สามารถสร้างภาพผลลัพธ์ได้ กรุณาลองใหม่')
        })
    })

    return () => {
      active = false
      window.cancelAnimationFrame(frame)
    }
  }, [result.character])

  const savePreparedImage = () => {
    if (!preparedImage) return
    const link = document.createElement('a')
    link.download = preparedImage.file.name
    link.href = preparedImage.dataUrl
    link.click()
  }

  const downloadImage = () => {
    savePreparedImage()
    setShareMessage('บันทึกภาพแล้ว')
  }

  const shareImage = async (platform: string) => {
    if (!preparedImage) return
    setSharing(true)
    setShareMessage('')
    try {
      const shareData = { files: [preparedImage.file] }

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData)
        setShareMessage(`แชร์ภาพผ่าน ${platform} แล้ว`)
      } else {
        savePreparedImage()
        setShareMessage(`บันทึกภาพแล้ว สามารถนำไปแชร์ผ่าน ${platform} ได้`)
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        savePreparedImage()
        setShareMessage('เปิดการแชร์ไม่ได้ จึงบันทึกภาพให้แทน')
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <main className="result-screen">
      <div
        className="result-export"
        ref={cardRef}
        aria-label={`ผลลัพธ์ของ ${nickname}`}
      >
        <button className="result-logo-button" onClick={onHome} aria-label="กลับหน้าแรก">
          <img src="/assets/splash-screen.png" alt="" />
        </button>

        <div
          className={`share-card${isBalanced ? ' share-card--balanced' : ''}${hasNoScore ? ' share-card--no-score' : ''}`}
          style={{ '--character': character.color, '--character-soft': character.softColor } as React.CSSProperties}
        >
          <div className="result-heading">
            <p className="you-are">คุณคือ...</p>
            <h1
              className={isBalanced ? 'balanced-title' : undefined}
              aria-label={isBalanced ? character.name : undefined}
            >
              {isBalanced ? (
                <>
                  <span>ผู้</span>
                  <span>สมดุล</span>
                  <span>ใน</span>
                  <span>ทุก</span>
                  <span>ด้าน</span>
                </>
              ) : character.name}
            </h1>
          </div>
          {hasNoScore ? null : isBalanced ? (
            <div className="balanced-orbit" aria-label="สมดุลทั้ง 5 ด้าน">
              {balancedCharacters.map((item) => (
                <span
                  key={item.key}
                  className="balanced-orbit__item"
                  style={{ '--orbit-color': item.color, '--orbit-soft': item.softColor } as React.CSSProperties}
                >
                  {item.image ? <img src={item.image} alt="" /> : <i>{item.icon}</i>}
                  <small>{item.eyebrow}</small>
                </span>
              ))}
            </div>
          ) : (
            <div className="character-orbit">
              {character.image ? <img src={character.image} alt="" /> : <span>{character.icon}</span>}
            </div>
          )}
          {isBalanced ? (
            <ul className="balanced-summary-list">
              {balancedCharacters.map((item) => <li key={item.key}>{item.description}</li>)}
            </ul>
          ) : hasNoScore ? null : (
            <p className="character-description">{character.description}</p>
          )}

          {hasNoScore || isBalanced ? null : (
            <>
              <div className="insight insight--strength">
                <b>จุดแข็ง</b>
                <p>{character.strength}</p>
              </div>
              <div className="insight">
                <b>จุดอ่อน</b>
                <p>{character.advice}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="result-actions">
        <section className="social-share" aria-labelledby="share-heading">
          <h2 id="share-heading">แชร์ไปยัง</h2>
          <div className="social-share-buttons">
            {SHARE_PLATFORMS.map((platform) => (
              <button
                key={platform.key}
                className={`social-share-button social-share-button--${platform.key}`}
                type="button"
                aria-label={`แชร์ภาพไปยัง ${platform.label}`}
                onClick={() => void shareImage(platform.label)}
                disabled={!preparedImage || sharing}
              >
                <span className="social-share-icon">
                  <img src={platform.icon} alt="" />
                </span>
              </button>
            ))}
          </div>
          {shareMessage && <p className="share-message" role="status">{shareMessage}</p>}
        </section>
        <button className="figma-button" onClick={downloadImage} disabled={!preparedImage || sharing}>
          {!preparedImage ? 'กำลังสร้างภาพ…' : 'บันทึกภาพ'}
        </button>
        <button className="figma-button figma-button--outline" onClick={onReplay} disabled={sharing}>
          เล่นอีกครั้ง
        </button>
      </div>
    </main>
  )
}
