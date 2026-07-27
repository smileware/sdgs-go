import { describe, expect, it } from 'vitest'
import { balanceCardText } from './cardText'

describe('balanceCardText', () => {
  it('avoids leaving a short Thai word alone on the final line', () => {
    expect(balanceCardText('ชวนเพื่อนมาร่วมโครงการอาสา')).toEqual([
      'ชวนเพื่อนมาร่วม',
      'โครงการอาสา',
    ])
  })

  it('keeps short copy on one centered line', () => {
    expect(balanceCardText('บริจาคเลือด')).toEqual(['บริจาคเลือด'])
  })

  it('uses at most four balanced lines for long copy', () => {
    const lines = balanceCardText('หยุดรถทางม้าลายสม่ำเสมอแม้ไม่มีคนรอข้าม')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.length).toBeLessThanOrEqual(4)
    expect(lines.every(Boolean)).toBe(true)
  })

  it('balances English copy without losing spaces between words', () => {
    const lines = balanceCardText('Invite friends to join a volunteer project', 'en')
    expect(lines.length).toBeGreaterThanOrEqual(3)
    expect(lines.join(' ')).toBe('Invite friends to join a volunteer project')
    expect(lines.every((line) => !line.includes('  '))).toBe(true)
  })

  it('keeps long English copy within four short lines for narrow Android cards', () => {
    const copy = 'Volunteer with a foundation that supports people who are ill'
    const lines = balanceCardText(copy, 'en')
    expect(lines).toHaveLength(4)
    expect(lines.join(' ')).toBe(copy)
    expect(lines.every((line) => line.length <= 18)).toBe(true)
  })
})
