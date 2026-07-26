import { LogIn, Users } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Brand } from '../components/Brand'
import { CHARACTERS } from '../content/results'
import { loadDashboardSummary } from '../lib/repository'
import type { CharacterKey, DashboardSummary } from '../types'

type AuthState = 'checking' | 'authenticated' | 'unauthenticated'

const DASHBOARD_RESULTS: CharacterKey[] = [
  'people',
  'prosperity',
  'planet',
  'peace',
  'partnership',
  'balanced',
  'no-score',
]
const DASHBOARD_REFRESH_MS = 30_000

export function DashboardScreen() {
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const loadInFlight = useRef<Promise<void> | null>(null)
  const summaryRef = useRef<DashboardSummary | null>(null)

  const load = useCallback((quiet = false): Promise<void> => {
    if (loadInFlight.current) return loadInFlight.current
    if (!quiet) setError('')

    const request = (async () => {
      try {
        const next = await loadDashboardSummary()
        summaryRef.current = next
        setSummary(next)
        setAuthState('authenticated')
        setError('')
      } catch (nextError) {
        if (nextError instanceof Error && nextError.message === 'unauthorized') {
          setAuthState('unauthenticated')
          summaryRef.current = null
          setSummary(null)
        } else {
          setAuthState('authenticated')
          setError(summaryRef.current
            ? 'ยังอัปเดตข้อมูลล่าสุดไม่ได้ กำลังแสดงข้อมูลเดิม'
            : 'โหลดข้อมูลไม่สำเร็จ ระบบจะลองใหม่อัตโนมัติ')
        }
      }
    })().finally(() => {
      loadInFlight.current = null
    })

    loadInFlight.current = request
    return request
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  useEffect(() => {
    if (authState !== 'authenticated') return

    const refreshWhenActive = () => {
      if (document.visibilityState !== 'hidden' && navigator.onLine) void load(true)
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshWhenActive()
    }
    const interval = window.setInterval(refreshWhenActive, DASHBOARD_REFRESH_MS)
    window.addEventListener('focus', refreshWhenActive)
    window.addEventListener('online', refreshWhenActive)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshWhenActive)
      window.removeEventListener('online', refreshWhenActive)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [authState, load])

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const body = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(body.error || 'login failed')
      setPassword('')
      await load()
    } catch {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือมีการลองเข้าสู่ระบบมากเกินไป')
    } finally {
      setBusy(false)
    }
  }

  if (authState !== 'authenticated') {
    return (
      <main className="dashboard-login-screen">
        <form className="dashboard-login-card" onSubmit={login}>
          <Brand />
          <span className="dashboard-kicker"><LogIn size={16} /> ADMIN ACCESS</span>
          <h1>เข้าสู่ระบบทีมงาน</h1>
          <p>ใช้บัญชีกลางที่กำหนดไว้สำหรับดูภาพรวมกิจกรรม</p>
          <label>
            <span>ชื่อผู้ใช้</span>
            <input type="text" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            <span>รหัสผ่าน</span>
            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="figma-button" disabled={busy || authState === 'checking'}>
            {authState === 'checking' ? 'กำลังตรวจสอบ…' : busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </main>
    )
  }

  const resultCounts = new Map(summary?.characters.map((item) => [item.character, item.count]) ?? [])

  return (
    <main className="dashboard-screen">
      <section className="dashboard-video-panel" aria-label="วิดีโอประชาสัมพันธ์">
        <video autoPlay muted loop playsInline preload="auto" disablePictureInPicture>
          <source src="/placeholder-video.mp4" type="video/mp4" />
        </video>
      </section>

      <section className="dashboard-live-panel" aria-live="polite">
        {!summary && !error && <div className="dashboard-loading">กำลังโหลดข้อมูล…</div>}
        {error && <p className="dashboard-live-error">{error}</p>}
        {summary && (
          <>
            <header className="dashboard-total">
              <div className="dashboard-total-icon"><Users /></div>
              <div>
                <span>มีผู้ร่วมเล่นสะสมทั้งหมด</span>
                <p>
                  <strong>{summary.totalPlayers.toLocaleString('th-TH')}</strong>
                  <small>คน</small>
                </p>
              </div>
              <time dateTime={summary.updatedAt}>
                อัปเดต {new Date(summary.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </time>
            </header>

            <div className="dashboard-category-heading">
              <h1>จำนวนผู้ร่วมเล่นในแต่ละหมวดหมู่</h1>
              {summary.syncWarning && <span title={summary.syncWarning}>ข้อมูลสำรอง</span>}
            </div>

            <div className="dashboard-category-grid">
              {DASHBOARD_RESULTS.map((key) => {
                const character = CHARACTERS[key]
                return (
                  <article
                    className="dashboard-category-card"
                    key={key}
                    style={{ '--dashboard-character': character.color, '--dashboard-character-soft': character.softColor } as React.CSSProperties}
                  >
                    <div className="dashboard-category-icon">
                      {character.image ? <img src={character.image} alt="" /> : <span>{character.icon}</span>}
                    </div>
                    <div>
                      <span>{character.name}</span>
                      <p><strong>{(resultCounts.get(key) ?? 0).toLocaleString('th-TH')}</strong><small> คน</small></p>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
