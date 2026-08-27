import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useSession } from '../../session/SessionContext'

const links = [
  { to: '/', label: 'ภาพรวมวันนี้', end: true },
  { to: '/products', label: 'สินค้า' },
  { to: '/stock', label: 'สต็อก' },
  { to: '/issues', label: 'คิวเบิกของ' },
  { to: '/reports', label: 'รายงานรายวัน' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { mode, canRetryCloud, retryCloud, resetDemo, busy, sessionId } = useSession()
  const sessionShort = sessionId ? `${sessionId.slice(0, 8)}…` : '-'
  const modeLabel = mode === 'cloud' ? 'คลาวด์' : 'บนอุปกรณ์'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-name">DemoDainamo</div>
          <div className="brand-sub">หลังบ้านอะไหล่รถ · Demo</div>
        </div>
        <nav className="nav" aria-label="เมนูหลัก">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        {mode === 'local' && (
          <div className="banner">
            <span className="banner-text">โหมดสาธิตบนอุปกรณ์นี้ — ข้อมูลจะไม่ซิงก์ข้ามเครื่อง</span>
            {canRetryCloud && (
              <button
                type="button"
                className="btn btn-secondary btn-sm banner-action"
                disabled={busy}
                onClick={() => void retryCloud()}
              >
                เชื่อมต่อโหมดคลาวด์อีกครั้ง
              </button>
            )}
          </div>
        )}
        <header className="topbar">
          <div className="topbar-meta">
            <strong className="topbar-title">ระบบคลังและเบิกอะไหล่</strong>
            <div className="muted topbar-session">
              <span className="session-full">
                Session: {sessionShort} · {modeLabel}
              </span>
              <span className="session-short">
                {sessionShort} · {modeLabel}
              </span>
            </div>
          </div>
          <button type="button" className="btn btn-secondary topbar-reset" disabled={busy} onClick={() => void resetDemo()}>
            รีเซ็ตข้อมูลตัวอย่าง
          </button>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
