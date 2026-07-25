import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { isValidPhone, normalizePlayerDraft } from '../lib/submission'
import type { PlayerDraft } from '../types'

const initialDraft: PlayerDraft = {
  nickname: '',
  age: '',
  gender: '',
  phone: '',
  privacyAccepted: false,
  marketingAccepted: false,
}

export function RegisterScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void
  onSubmit: (draft: PlayerDraft) => Promise<void>
}) {
  const [draft, setDraft] = useState(initialDraft)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const canSubmit = draft.nickname.trim() !== ''
    && Number.isInteger(Number(draft.age))
    && Number(draft.age) >= 1
    && Number(draft.age) <= 120
    && draft.gender !== ''
    && isValidPhone(draft.phone)
    && draft.privacyAccepted
    && !submitting

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.privacyAccepted) return setError('กรุณายอมรับนโยบายความเป็นส่วนตัวก่อนเริ่มเกม')
    if (!isValidPhone(draft.phone)) return setError('กรุณาตรวจสอบรูปแบบเบอร์โทรศัพท์')
    setError('')
    setSubmitting(true)
    try {
      await onSubmit(normalizePlayerDraft(draft))
    } catch {
      setError('บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง')
      setSubmitting(false)
    }
  }

  return (
    <main className="register-screen">
      <button className="sr-only" onClick={onBack}>ย้อนกลับ</button>
      <img className="nesdc-logo" src="/assets/nesdc-logo.png" alt="NESDC" />
      <div className="register-scroll">
        <header className="register-heading">
          <p>รักอะไรอยู่?</p>
          <h1>Swipe <span>สิ่งที่คุณรัก</span></h1>
        </header>

        <img className="register-art" src="/assets/form-cards.png" alt="" aria-hidden="true" />

        <form onSubmit={submit} className="player-form">
          <section className="form-card">
            <h2>ทำความรู้จักกันก่อนนะ</h2>
            <label>
              <span>ชื่อเล่น <b>*</b></span>
              <input
                required
                maxLength={60}
                placeholder="กรอกชื่อเล่น"
                value={draft.nickname}
                onChange={(event) => setDraft({ ...draft, nickname: event.target.value })}
              />
            </label>
            <label>
              <span>อายุ <b>*</b></span>
              <input
                required
                type="number"
                inputMode="numeric"
                min="1"
                max="120"
                placeholder="กรอกอายุ"
                value={draft.age}
                onChange={(event) => setDraft({ ...draft, age: event.target.value })}
              />
            </label>

            <fieldset className="gender-fieldset">
              <legend>เพศ <b>*</b></legend>
              <div>
                <label>
                  <input
                    required
                    type="radio"
                    name="gender"
                    value="male"
                    checked={draft.gender === 'male'}
                    onChange={() => setDraft({ ...draft, gender: 'male' })}
                  />
                  <span>ชาย</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={draft.gender === 'female'}
                    onChange={() => setDraft({ ...draft, gender: 'female' })}
                  />
                  <span>หญิง</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="unspecified"
                    checked={draft.gender === 'unspecified'}
                    onChange={() => setDraft({ ...draft, gender: 'unspecified' })}
                  />
                  <span>ไม่ระบุ</span>
                </label>
              </div>
            </fieldset>

            <label>
              <span>เบอร์โทรศัพท์</span>
              <input
                inputMode="tel"
                maxLength={30}
                placeholder="กรอกเบอร์โทรศัพท์"
                value={draft.phone}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                aria-describedby="phone-help"
              />
            </label>

            <div className="check-label">
              <span className="checkbox-control">
                <input
                  type="checkbox"
                  aria-label="ยอมรับนโยบายความเป็นส่วนตัว"
                  checked={draft.privacyAccepted}
                  onChange={(event) => setDraft({ ...draft, privacyAccepted: event.target.checked })}
                />
                <Check aria-hidden="true" strokeWidth={3} />
              </span>
              <span>
                รับทราบและให้ความยินยอมตาม{' '}
                <button type="button" className="privacy-link" onClick={() => setPrivacyOpen(true)}>
                  นโยบายความเป็นส่วนตัว
                </button>
              </span>
            </div>

            {error && <p className="form-error">{error}</p>}
          </section>
          <button className="figma-button register-button" disabled={!canSubmit}>
            {submitting ? 'กำลังเตรียมเกม…' : 'ค้นหาตัวเอง'}
          </button>
        </form>
      </div>

      {privacyOpen && (
        <div className="privacy-backdrop" role="presentation" onMouseDown={() => setPrivacyOpen(false)}>
          <section
            className="privacy-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="privacy-title">นโยบายความเป็นส่วนตัว</h2>
            <div className="privacy-copy">
              <p>
                โครงการเก็บชื่อเล่น อายุ เพศ เบอร์โทรศัพท์ที่ท่านเลือกกรอก
                คำตอบ และผลลัพธ์ของเกม เพื่อดำเนินกิจกรรม วิเคราะห์ผลในภาพรวม
                และติดต่อกลับตามวัตถุประสงค์ของโครงการ
              </p>
              <p>
                ข้อมูลจะถูกจัดเก็บใน Supabase และ Google Sheets ซึ่งใช้เป็นระบบสำรอง
                โดยจำกัดการเข้าถึงเฉพาะผู้ดูแลที่ได้รับอนุญาต และเก็บรักษาตามระยะเวลา
                ที่โครงการกำหนด
              </p>
              <p><strong>ทีมโครงการต้องแทนที่ข้อความนี้ด้วยนโยบายฉบับอนุมัติก่อนเปิดใช้งานจริง</strong></p>
            </div>
            <button type="button" className="figma-button privacy-close" onClick={() => setPrivacyOpen(false)}>
              ปิด
            </button>
          </section>
        </div>
      )}
    </main>
  )
}
