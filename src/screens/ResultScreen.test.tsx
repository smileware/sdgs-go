import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GameResult } from '../types'
import { ResultScreen } from './ResultScreen'

const scores = {
  people: 1,
  prosperity: 1,
  planet: 1,
  peace: 1,
  partnership: 1,
}

const renderResult = (result: GameResult) => {
  render(
    <ResultScreen
      nickname="ผู้ทดสอบ"
      result={result}
      onReplay={vi.fn()}
      onHome={vi.fn()}
    />,
  )
}

afterEach(cleanup)

describe('ResultScreen copy', () => {
  it('shows the five balanced descriptions as a list', () => {
    renderResult({ character: 'balanced', strongest: null, growth: null, scores })

    expect(screen.getByRole('heading', { name: 'ผู้สมดุลในทุกด้าน' })).toBeInTheDocument()
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(within(list).getByText('ให้คุณค่ากับความสัมพันธ์และการดูแลกัน')).toBeInTheDocument()
    expect(screen.queryByText('จุดแข็ง')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'แชร์ไปยัง' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^แชร์ภาพไปยัง/ })).toHaveLength(4)
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
})
