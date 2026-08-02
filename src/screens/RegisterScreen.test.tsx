import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RegisterScreen } from './RegisterScreen'

describe('RegisterScreen', () => {
  afterEach(cleanup)

  it('renders the Figma form and requires all mandatory answers', () => {
    render(<RegisterScreen language="th" onBack={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Swipe สิ่งที่คุณรัก' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'NESDC' })).toHaveAttribute('src', '/assets/nesdc-logo.png')
    expect(screen.getByRole('radio', { name: 'ชาย' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'หญิง' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'ไม่ระบุ' })).toBeInTheDocument()

    const submit = screen.getByRole('button', { name: 'ค้นหาตัวเอง' })
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('กรอกชื่อเล่น'), { target: { value: 'โกดี' } })
    fireEvent.change(screen.getByPlaceholderText('กรอกอายุ'), { target: { value: '20' } })
    fireEvent.change(screen.getByPlaceholderText('กรอกเบอร์โทรศัพท์'), { target: { value: '+66 81-234-5678' } })
    fireEvent.click(screen.getByRole('radio', { name: 'ชาย' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'ยอมรับนโยบายความเป็นส่วนตัว' }))

    expect(submit).toBeEnabled()
  })

  it('opens and closes the privacy policy dialog', () => {
    render(<RegisterScreen language="th" onBack={vi.fn()} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'นโยบายความเป็นส่วนตัว' }))
    expect(screen.getByRole('dialog', { name: 'นโยบายความเป็นส่วนตัว' })).toBeInTheDocument()
    expect(screen.getByText(/Supabase และ Google Sheets/)).toBeInTheDocument()
    expect(screen.getByText(/ไม่เกิน 180 วัน/)).toBeInTheDocument()
    expect(screen.getByText(/sdgs@nesdc.go.th/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ปิด' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps phone optional and rejects an invalid phone format', () => {
    render(<RegisterScreen language="th" onBack={vi.fn()} onSubmit={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('กรอกชื่อเล่น'), { target: { value: 'โกดี' } })
    fireEvent.change(screen.getByPlaceholderText('กรอกอายุ'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('radio', { name: 'ไม่ระบุ' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'ยอมรับนโยบายความเป็นส่วนตัว' }))

    const submit = screen.getByRole('button', { name: 'ค้นหาตัวเอง' })
    expect(submit).toBeEnabled()
    fireEvent.change(screen.getByPlaceholderText('กรอกเบอร์โทรศัพท์'), { target: { value: '123' } })
    expect(submit).toBeDisabled()
  })

  it('renders the registration flow and privacy policy in English', () => {
    render(<RegisterScreen language="en" onBack={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Swipe what you love' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your nickname')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Prefer not to say' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Privacy Policy' }))
    expect(screen.getByRole('dialog', { name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByText(/stored in Supabase and Google Sheets/)).toBeInTheDocument()
    expect(screen.getByText(/no longer than 180 days/)).toBeInTheDocument()
    expect(screen.getByText(/sdgs@nesdc.go.th/)).toBeInTheDocument()
  })
})
