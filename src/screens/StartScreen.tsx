import { PLAYER_COPY } from '../content/translations'
import type { Language } from '../types'

export function StartScreen({
  language,
  onLanguageChange,
  onStart,
}: {
  language: Language
  onLanguageChange: (language: Language) => void
  onStart: () => void
}) {
  const copy = PLAYER_COPY[language].start

  return (
    <main className="start-screen">
      <h1 className="sr-only">{copy.heading}</h1>
      <img
        className="start-logo"
        src="/assets/splash-screen.png"
        alt=""
        aria-hidden="true"
      />
      <img
        className="start-intro"
        src={`/assets/intro-${language}.png`}
        alt=""
        aria-hidden="true"
      />
      <div className="start-actions">
        <div className="language-switcher" role="group" aria-label={copy.languageLabel}>
          <span>{copy.languageLabel}</span>
          <button
            className={`language-option${language !== 'th' ? ' language-option--active' : ''}`}
            type="button"
            aria-pressed={language === 'th'}
            onClick={() => onLanguageChange('th')}
          >
            {copy.thai}
          </button>
          <i aria-hidden="true">|</i>
          <button
            className={`language-option${language !== 'en' ? ' language-option--active' : ''}`}
            type="button"
            aria-pressed={language === 'en'}
            onClick={() => onLanguageChange('en')}
          >
            {copy.english}
          </button>
        </div>
        <button className="start-button" onClick={onStart}>
          {copy.button}
        </button>
      </div>
    </main>
  )
}
