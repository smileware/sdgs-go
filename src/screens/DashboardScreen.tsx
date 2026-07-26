import { ArrowLeft, BarChart3, Download, LogIn, LogOut, RefreshCw, Users, Wifi, WifiOff } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Brand } from '../components/Brand'
import { CHARACTERS } from '../content/results'
import { getSyncStatus, subscribeToSyncStatus } from '../lib/outbox'
import { loadDashboardSummary } from '../lib/repository'
import type { DashboardSummary, SyncStatus } from '../types'

type AuthState = 'checking' | 'authenticated' | 'unauthenticated'

const emptySyncStatus: SyncStatus = {
  pending: 0,
  partial: 0,
  deadLetter: 0,
  online: navigator.onLine,
  lastSuccessfulSync: null,
}

export function DashboardScreen({ onBack }: { onBack: () => void }) {
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [csrfToken, setCsrfToken] = useState('')
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(emptySyncStatus)

  const load = async () => {
    setError('')
    try {
      const next = await loadDashboardSummary()
      setSummary(next)
      setCsrfToken(next.csrfToken)
      setAuthState('authenticated')
    } catch (nextError) {
      if (nextError instanceof Error && nextError.message === 'unauthorized') {
        setAuthState('unauthenticated')
        setSummary(null)
      } else {
        setAuthState('unauthenticated')
        setError(authState === 'checking' ? '' : 'โหลดข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง')
      }
    }
  }

  useEffect(() => {
    void load()
    const updateSync = () => { void getSyncStatus().then(setSyncStatus) }
    updateSync()
    return subscribeToSyncStatus(updateSync)
  }, [])

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
      const body = await response.json().catch(() => ({})) as { csrfToken?: string; error?: string }
      if (!response.ok) throw new Error(body.error || 'login failed')
      setCsrfToken(body.csrfToken ?? '')
      setPassword('')
      await load()
    } catch {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือมีการลองเข้าสู่ระบบมากเกินไป')
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
    }).catch(() => null)
    setSummary(null)
    setCsrfToken('')
    setAuthState('unauthenticated')
  }

  const exportCsv = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({}),
      })
      if (response.status === 401) {
        setAuthState('unauthenticated')
        return
      }
      if (!response.ok) throw new Error('export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sustrend-export-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('ส่งออกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง')
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
          <p>ใช้บัญชีกลางที่กำหนดไว้สำหรับดูสรุปและส่งออกข้อมูล</p>
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
          <button type="button" className="dashboard-back-link" onClick={onBack}>กลับหน้าเกม</button>
        </form>
      </main>
    )
  }

  return (
    <main className="dashboard-screen">
      <header className="dashboard-header">
        <button className="round-button round-button--small" onClick={onBack} aria-label="กลับ"><ArrowLeft size={19} /></button>
        <Brand />
        <button className="round-button round-button--small" onClick={logout} aria-label="ออกจากระบบ"><LogOut size={17} /></button>
      </header>
      <section className="dashboard-shell">
        <div className="dashboard-title-row">
          <div>
            <span className="dashboard-kicker"><BarChart3 size={16} /> LIVE OVERVIEW</span>
            <h1>ภาพรวมกิจกรรม</h1>
            <p>ข้อมูลรวมเท่านั้น · Export ต้องผ่าน session ทีมงาน</p>
          </div>
          <div className="dashboard-tools">
            <button onClick={() => void load()} disabled={busy}><RefreshCw size={16} /> รีเฟรช</button>
            <button onClick={() => void exportCsv()} disabled={busy}><Download size={16} /> Export CSV</button>
          </div>
        </div>

        <div className={`sync-banner ${syncStatus.online ? '' : 'sync-banner--offline'}`}>
          {syncStatus.online ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>
            {syncStatus.online ? 'เครื่องนี้ออนไลน์' : 'เครื่องนี้ออฟไลน์'}
            {' · '}รอส่ง {syncStatus.pending} · ส่งบางส่วน {syncStatus.partial}
            {syncStatus.deadLetter > 0 && ` · ต้องตรวจสอบ ${syncStatus.deadLetter}`}
          </span>
        </div>

        {error && <p className="form-error dashboard-error">{error}</p>}
        {!summary && !error && <div className="loading-card">กำลังโหลดข้อมูล…</div>}
        {summary && (
          <>
            {summary.syncWarning && <div className="demo-banner">{summary.syncWarning}</div>}
            <p className="dashboard-source">แหล่งข้อมูล: {summary.source === 'google-sheets' ? 'Google Sheets fallback' : 'Supabase'}</p>
            <div className="metric-grid">
              <article className="metric-card metric-card--primary">
                <Users size={22} />
                <span>ผู้เล่นที่เล่นจบ</span>
                <strong>{summary.totalPlayers.toLocaleString()}</strong>
                <small>นับผู้เล่นแต่ละคนครั้งเดียว</small>
              </article>
              <article className="metric-card">
                <RefreshCw size={22} />
                <span>รอบที่เล่นทั้งหมด</span>
                <strong>{summary.totalPlays.toLocaleString()}</strong>
                <small>รวมการเล่นชุดใหม่</small>
              </article>
            </div>

            <section className="distribution-card">
              <div className="section-heading">
                <div><span>CHARACTER MIX</span><h2>สัดส่วนตัวละคร</h2></div>
                <small>อัปเดต {new Date(summary.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</small>
              </div>
              {!summary.characters.length && <div className="empty-state">ยังไม่มีผู้เล่นที่เล่นจบ<br /><small>ข้อมูลจะปรากฏหลังจบเกมแรก</small></div>}
              <div className="distribution-list">
                {summary.characters.map((item) => {
                  const character = CHARACTERS[item.character]
                  return (
                    <div className="distribution-row" key={item.character}>
                      <div className="distribution-icon" style={{ background: character.softColor }}>
                        {character.image ? <img src={character.image} alt="" /> : character.icon}
                      </div>
                      <div className="distribution-copy">
                        <div><b>{character.name}</b><span>{item.count} คน · {item.percentage}%</span></div>
                        <div className="distribution-track"><i style={{ width: `${item.percentage}%`, background: character.color }} /></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  )
}
