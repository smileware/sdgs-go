import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { PLAYER_COPY } from '../content/translations'
import { isValidPhone, normalizePlayerDraft } from '../lib/submission'
import type { Language, PlayerDraft } from '../types'

const initialDraft: PlayerDraft = {
  nickname: '',
  age: '',
  gender: '',
  phone: '',
  privacyAccepted: false,
  marketingAccepted: false,
}

export function RegisterScreen({
  language,
  onBack,
  onSubmit,
}: {
  language: Language
  onBack: () => void
  onSubmit: (draft: PlayerDraft) => Promise<void>
}) {
  const copy = PLAYER_COPY[language].register
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
    if (!draft.privacyAccepted) return setError(copy.consentError)
    if (!isValidPhone(draft.phone)) return setError(copy.phoneError)
    setError('')
    setSubmitting(true)
    try {
      await onSubmit(normalizePlayerDraft(draft))
    } catch {
      setError(copy.submitError)
      setSubmitting(false)
    }
  }

  return (
    <main className="register-screen" data-language={language}>
      <button className="sr-only" onClick={onBack}>{copy.back}</button>
      <img className="nesdc-logo" src="/assets/nesdc-logo.png" alt="NESDC" />
      <div className="register-scroll">
        <header className="register-heading">
          <p>{copy.eyebrow}</p>
          <h1>{copy.headingPrefix} <span>{copy.headingHighlight}</span></h1>
        </header>

        <img className="register-art" src="/assets/form-cards.png" alt="" aria-hidden="true" />

        <form onSubmit={submit} className="player-form">
          <section className="form-card">
            <h2>{copy.formHeading}</h2>
            <label>
              <span>{copy.nickname} <b>*</b></span>
              <input
                required
                maxLength={60}
                placeholder={copy.nicknamePlaceholder}
                value={draft.nickname}
                onChange={(event) => setDraft({ ...draft, nickname: event.target.value })}
              />
            </label>
            <label>
              <span>{copy.age} <b>*</b></span>
              <input
                required
                type="number"
                inputMode="numeric"
                min="1"
                max="120"
                placeholder={copy.agePlaceholder}
                value={draft.age}
                onChange={(event) => setDraft({ ...draft, age: event.target.value })}
              />
            </label>

            <fieldset className="gender-fieldset">
              <legend>{copy.gender} <b>*</b></legend>
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
                  <span>{copy.male}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={draft.gender === 'female'}
                    onChange={() => setDraft({ ...draft, gender: 'female' })}
                  />
                  <span>{copy.female}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="unspecified"
                    checked={draft.gender === 'unspecified'}
                    onChange={() => setDraft({ ...draft, gender: 'unspecified' })}
                  />
                  <span>{copy.unspecified}</span>
                </label>
              </div>
            </fieldset>

            <label>
              <span>{copy.phone}</span>
              <input
                inputMode="tel"
                maxLength={30}
                placeholder={copy.phonePlaceholder}
                value={draft.phone}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                aria-describedby="phone-help"
              />
            </label>

            <div className="check-label">
              <span className="checkbox-control">
                <input
                  type="checkbox"
                  aria-label={copy.privacyAria}
                  checked={draft.privacyAccepted}
                  onChange={(event) => setDraft({ ...draft, privacyAccepted: event.target.checked })}
                />
                <Check aria-hidden="true" strokeWidth={3} />
              </span>
              <span>
                {copy.privacyPrefix}{' '}
                <button type="button" className="privacy-link" onClick={() => setPrivacyOpen(true)}>
                  {copy.privacyLink}
                </button>
              </span>
            </div>

            {error && <p className="form-error">{error}</p>}
          </section>
          <button className="figma-button register-button" disabled={!canSubmit}>
            {submitting ? copy.submitting : copy.submit}
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
            <h2 id="privacy-title">{copy.privacyTitle}</h2>
            <div className="privacy-copy">
              {copy.privacyParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <p><strong>{copy.privacyWarning}</strong></p>
            </div>
            <button type="button" className="figma-button privacy-close" onClick={() => setPrivacyOpen(false)}>
              {copy.close}
            </button>
          </section>
        </div>
      )}
    </main>
  )
}
