import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GameResult, Language } from '../types'
import { ResultScreen } from './ResultScreen'

const { toPngMock } = vi.hoisted(() => ({
  toPngMock: vi.fn(),
}))

vi.mock('html-to-image', () => ({
  toPng: toPngMock,
}))

const scores = {
  people: 1,
  prosperity: 1,
  planet: 1,
  peace: 1,
  partnership: 1,
}

const renderResult = (result: GameResult, language: Language = 'th') => {
  render(
    <ResultScreen
      language={language}
      nickname="ผู้ทดสอบ"
      result={result}
      onReplay={vi.fn()}
      onHome={vi.fn()}
    />,
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  toPngMock.mockReset()
})

describe('ResultScreen copy', () => {
  it('shows the five balanced descriptions as a list', () => {
    renderResult({ character: 'balanced', strongest: null, growth: null, scores })

    expect(screen.getByRole('heading', { name: 'ผู้สมดุลในทุกด้าน' })).toBeInTheDocument()
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(within(list).getByText('ให้คุณค่ากับความสัมพันธ์และการดูแลกัน')).toBeInTheDocument()
    expect(screen.queryByText('จุดแข็ง')).not.toBeInTheDocument()
    const shareButton = screen.getByRole('button', { name: 'แชร์' })
    expect(shareButton).toBeInTheDocument()
    expect(shareButton.querySelector('svg')).toBeInTheDocument()
  })

  it('uses the winning character weakness copy', () => {
    renderResult({
      character: 'people',
      strongest: 'people',
      growth: 'prosperity',
      scores: { ...scores, people: 3, prosperity: 0 },
    })

    expect(screen.getByText('ลองเริ่มจากก้าวเล็กๆ เช่น ถามไถ่สารทุกข์สุกดิบคนใกล้ตัว หรือหันไปยิ้มให้กับคนที่มางานกับคุณ')).toBeInTheDocument()
    expect(screen.queryByText('ลองเริ่มง่าย ๆ ด้วยการอุดหนุนร้านค้าเล็ก ๆ ในชุมชน หรือวางแผนออมเงินเล็กน้อยในแต่ละเดือน')).not.toBeInTheDocument()
  })

  it('shows the standard result label with the zero-score result copy', () => {
    renderResult({
      character: 'no-score',
      strongest: null,
      growth: null,
      scores: { people: 0, prosperity: 0, planet: 0, peace: 0, partnership: 0 },
    })

    const exportArea = screen.getByLabelText('ผลลัพธ์ของ ผู้ทดสอบ')
    const card = exportArea.querySelector('.share-card') as HTMLElement
    expect(within(card).getByText('คุณคือ...')).toBeInTheDocument()
    expect(within(card).getByRole('heading', { name: 'ผู้อาจจะยังขาดความสมดุล' })).toBeInTheDocument()
    expect(card).toHaveStyle({ '--character': '#e03c44' })
  })

  it('embeds the logo and every result character image before creating the PNG', async () => {
    let capturedSources: string[] = []
    toPngMock.mockImplementation(async (node: HTMLElement) => {
      capturedSources = Array.from(node.querySelectorAll('img')).map((image) => image.src)
      return 'data:image/png;base64,ZXhwb3J0'
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => ({
      ok: true,
      status: 200,
      blob: async () => new Blob(
        [String(input).startsWith('data:') ? 'export' : 'asset'],
        { type: 'image/png' },
      ),
    }) as Response)

    renderResult({ character: 'balanced', strongest: null, growth: null, scores })

    await waitFor(() => expect(toPngMock).toHaveBeenCalledOnce())
    expect(capturedSources).toHaveLength(6)
    expect(capturedSources.every((source) => source.startsWith('data:image/png'))).toBe(true)
  })

  it('renders the complete English result copy', () => {
    renderResult({
      character: 'partnership',
      strongest: 'partnership',
      growth: 'people',
      scores: { ...scores, partnership: 3, people: 0 },
    }, 'en')

    expect(screen.getByText('You are...')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Collaboration Catalyst' })).toBeInTheDocument()
    expect(screen.getByText('Your strength')).toBeInTheDocument()
    expect(screen.getByText('Growth area')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play again' })).toBeInTheDocument()
  })

  it('renders the five-part English balanced title', () => {
    renderResult({ character: 'balanced', strongest: null, growth: null, scores }, 'en')

    const title = screen.getByRole('heading', { name: 'Balanced in All 5 Dimensions' })
    expect(title).toHaveClass('balanced-title--en')
    expect(title).toHaveTextContent('Balanced in All 5 Dimensions')
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByText('You value relationships and caring for one another.')).toBeInTheDocument()
  })
})
