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

const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(reader.error ?? new Error('Unable to read image'))
  reader.readAsDataURL(blob)
})

const waitForPaint = () => new Promise<void>((resolve) => {
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
})

const loadImage = (source: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('Unable to decode export image'))
  image.src = source
})

const numericStyle = (value: string): number => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const drawExportImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  captureRect: DOMRect,
  scaleX: number,
  scaleY: number,
) => {
  const rect = image.getBoundingClientRect()
  const style = window.getComputedStyle(image)
  if (
    rect.width <= 0
    || rect.height <= 0
    || image.naturalWidth <= 0
    || image.naturalHeight <= 0
    || style.display === 'none'
    || style.visibility === 'hidden'
  ) return

  const paddingLeft = numericStyle(style.paddingLeft)
  const paddingRight = numericStyle(style.paddingRight)
  const paddingTop = numericStyle(style.paddingTop)
  const paddingBottom = numericStyle(style.paddingBottom)
  const contentWidth = Math.max(0, rect.width - paddingLeft - paddingRight)
  const contentHeight = Math.max(0, rect.height - paddingTop - paddingBottom)
  if (!contentWidth || !contentHeight) return

  let drawWidth = contentWidth
  let drawHeight = contentHeight
  if (style.objectFit === 'contain' || style.objectFit === 'scale-down') {
    const ratio = Math.min(
      contentWidth / image.naturalWidth,
      contentHeight / image.naturalHeight,
      style.objectFit === 'scale-down' ? 1 : Number.POSITIVE_INFINITY,
    )
    drawWidth = image.naturalWidth * ratio
    drawHeight = image.naturalHeight * ratio
  } else if (style.objectFit === 'cover') {
    const ratio = Math.max(
      contentWidth / image.naturalWidth,
      contentHeight / image.naturalHeight,
    )
    drawWidth = image.naturalWidth * ratio
    drawHeight = image.naturalHeight * ratio
  }

  const x = rect.left - captureRect.left + paddingLeft + ((contentWidth - drawWidth) / 2)
  const y = rect.top - captureRect.top + paddingTop + ((contentHeight - drawHeight) / 2)
  context.save()
  context.globalAlpha = numericStyle(style.opacity) || 1
  context.drawImage(
    image,
    x * scaleX,
    y * scaleY,
    drawWidth * scaleX,
    drawHeight * scaleY,
  )
  context.restore()
}

const compositeExportImages = async (
  baseDataUrl: string,
  captureNode: HTMLElement,
  images: HTMLImageElement[],
): Promise<string> => {
  const baseImage = await loadImage(baseDataUrl)
  const captureRect = captureNode.getBoundingClientRect()
  if (!captureRect.width || !captureRect.height) throw new Error('Invalid export dimensions')

  const canvas = document.createElement('canvas')
  canvas.width = baseImage.naturalWidth
  canvas.height = baseImage.naturalHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')

  context.drawImage(baseImage, 0, 0)
  const scaleX = canvas.width / captureRect.width
  const scaleY = canvas.height / captureRect.height
  images.forEach((image) => drawExportImage(context, image, captureRect, scaleX, scaleY))
  return canvas.toDataURL('image/png')
}

const canShareImageFile = (file: File): boolean => {
  try {
    const shareData = { files: [file] }
    return Boolean(navigator.share)
      && (!navigator.canShare || navigator.canShare(shareData))
  } catch {
    return false
  }
}

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

    const sourceRect = cardRef.current.getBoundingClientRect()
    const captureHost = document.createElement('div')
    const captureNode = cardRef.current.cloneNode(true) as HTMLDivElement
    captureNode.removeAttribute('aria-label')
    captureNode.setAttribute('aria-hidden', 'true')
    captureNode.style.width = `${sourceRect.width}px`
    captureHost.style.position = 'fixed'
    captureHost.style.top = '0'
    captureHost.style.left = `${-(Math.ceil(sourceRect.width) + 100)}px`
    captureHost.style.width = `${sourceRect.width}px`
    captureHost.style.pointerEvents = 'none'
    captureHost.appendChild(captureNode)
    document.body.appendChild(captureHost)

    try {
      const images = Array.from(captureNode.querySelectorAll('img'))
      await Promise.all(images.map(async (image) => {
        const source = image.getAttribute('src') || image.currentSrc || image.src
        if (!source || source.startsWith('data:')) return
        const response = await fetch(new URL(source, window.location.href), { cache: 'force-cache' })
        if (!response.ok) throw new Error(`Unable to load export image: ${response.status}`)
        image.src = await blobToDataUrl(await response.blob())
        if (image.decode) await image.decode()
      }))
      await waitForPaint()

      const baseDataUrl = await toPng(captureNode, {
        pixelRatio: 2,
        cacheBust: false,
        backgroundColor: '#faf2e8',
        filter: (node) => !(node instanceof HTMLImageElement),
      })
      const dataUrl = await compositeExportImages(baseDataUrl, captureNode, images)
      const blob = await (await fetch(dataUrl)).blob()
      return {
        dataUrl,
        file: new File([blob], `sustrend-${result.character}.png`, { type: 'image/png' }),
      }
    } finally {
      captureHost.remove()
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
    const objectUrl = URL.createObjectURL(preparedImage.file)
    const link = document.createElement('a')
    link.download = preparedImage.file.name
    link.href = objectUrl
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
  }

  const saveImageToPhotos = async () => {
    if (!preparedImage) return
    if (import.meta.env.DEV) {
      savePreparedImage()
      setShareMessage('บันทึก PNG สำหรับทดสอบแล้ว')
      return
    }
    setSharing(true)
    setShareMessage('')

    try {
      const shareData = { files: [preparedImage.file] }
      const canOpenPhotoSave = canShareImageFile(preparedImage.file)

      if (navigator.share && canOpenPhotoSave) {
        setShareMessage('เลือก “บันทึกรูปภาพ” หรือ “Add to Photos”')
        const outcome = await Promise.race([
          navigator.share(shareData).then(() => 'closed' as const),
          new Promise<'pending'>((resolve) => window.setTimeout(() => resolve('pending'), 12_000)),
        ])
        setShareMessage(outcome === 'closed'
          ? 'ปิดเมนูบันทึกรูปแล้ว'
          : 'เลือก “บันทึกรูปภาพ” หรือ “Add to Photos”')
      } else {
        savePreparedImage()
        setShareMessage('อุปกรณ์นี้ไม่รองรับการบันทึกลงคลังรูป จึงดาวน์โหลด PNG ให้แทน')
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setShareMessage('ยกเลิกการบันทึกภาพ')
      } else {
        savePreparedImage()
        setShareMessage('เปิดคลังรูปไม่ได้ จึงดาวน์โหลด PNG ให้แทน')
      }
    } finally {
      setSharing(false)
    }
  }

  const shareImage = async (platform: string) => {
    if (!preparedImage) return
    setSharing(true)
    setShareMessage('')
    try {
      const shareData = { files: [preparedImage.file] }
      const canShareFile = canShareImageFile(preparedImage.file)

      if (navigator.share && canShareFile) {
        const outcome = await Promise.race([
          navigator.share(shareData).then(() => 'shared' as const),
          new Promise<'pending'>((resolve) => window.setTimeout(() => resolve('pending'), 12_000)),
        ])
        setShareMessage(outcome === 'shared'
          ? 'แชร์ภาพแล้ว'
          : 'เปิดหน้าต่างแชร์แล้ว กรุณาเลือกแอปที่ต้องการ')
      } else {
        savePreparedImage()
        setShareMessage(`อุปกรณ์นี้เปิด ${platform} โดยตรงไม่ได้ จึงบันทึกภาพให้แล้ว`)
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
        <button className="figma-button" onClick={() => void saveImageToPhotos()} disabled={!preparedImage || sharing}>
          {!preparedImage ? 'กำลังสร้างภาพ…' : 'บันทึกภาพ'}
        </button>
        <button className="figma-button figma-button--outline" onClick={onReplay} disabled={sharing}>
          เล่นอีกครั้ง
        </button>
      </div>
    </main>
  )
}
