import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { CONTACT } from '../../data/contact'
import { useSession } from '../../session/SessionContext'
import { ContactFab } from './ContactFab'
import { SettingsSheet } from './SettingsSheet'

const links = [
  { to: '/', label: 'ภาพรวมวันนี้', shortLabel: 'ภาพรวม', end: true },
  { to: '/products', label: 'สินค้า', shortLabel: 'สินค้า' },
  { to: '/stock', label: 'สต็อก', shortLabel: 'สต็อก' },
  { to: '/issues', label: 'คิวเบิกของ', shortLabel: 'คิวเบิก' },
  { to: '/reports', label: 'รายงานรายวัน', shortLabel: 'รายงาน' },
]

const MOBILE_MQ = '(max-width: 960px)'
const SCROLL_DELTA = 14
/** หลังยุบเท่านั้น — ล็อกขาขึ้นชั่วคราว กัน expand ปลอมจาก layout */
const EXPAND_COOLDOWN_MS = 280

export function AppShell({ children }: { children: ReactNode }) {
  const { mode, sessionId } = useSession()
  const sessionShort = sessionId ? `${sessionId.slice(0, 8)}…` : '-'
  const modeLabel = mode === 'cloud' ? 'คลาวด์' : 'บนอุปกรณ์'
  const contentRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)
  const chromeCollapsedRef = useRef(false)
  const expandLockedUntil = useRef(0)
  const [chromeCollapsed, setChromeCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const mq = window.matchMedia(MOBILE_MQ)

    const applyCollapsed = (next: boolean) => {
      if (chromeCollapsedRef.current === next) return
      chromeCollapsedRef.current = next
      setChromeCollapsed(next)
      if (next) {
        expandLockedUntil.current = performance.now() + EXPAND_COOLDOWN_MS
      }
      requestAnimationFrame(() => {
        lastScrollTop.current = el.scrollTop
      })
    }

    const onScroll = () => {
      if (!mq.matches) {
        applyCollapsed(false)
        lastScrollTop.current = el.scrollTop
        return
      }

      const top = el.scrollTop
      const delta = top - lastScrollTop.current

      if (top <= 8) {
        applyCollapsed(false)
        lastScrollTop.current = top
        return
      }

      if (Math.abs(delta) < SCROLL_DELTA) return

      if (delta > 0 && top > 24) {
        applyCollapsed(true)
      } else if (delta < 0) {
        if (performance.now() < expandLockedUntil.current) {
          lastScrollTop.current = top
          return
        }
        applyCollapsed(false)
      }

      lastScrollTop.current = top
    }

    const onMqChange = () => {
      if (!mq.matches) applyCollapsed(false)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    mq.addEventListener('change', onMqChange)
    return () => {
      el.removeEventListener('scroll', onScroll)
      mq.removeEventListener('change', onMqChange)
    }
  }, [])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand">
            <div className="brand-name">DemoLCS</div>
            <div className="brand-sub">LimitCode Studio · หลังบ้านอะไหล่ Demo</div>
          </div>
          <button
            type="button"
            className="settings-trigger"
            aria-label="ตั้งค่าเดโม"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(true)}
          >
            <svg className="settings-trigger-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                fill="currentColor"
                d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.25.12.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
              />
            </svg>
          </button>
        </div>
        <nav className="nav" aria-label="เมนูหลัก">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              <span className="nav-label-full">{l.label}</span>
              <span className="nav-label-short">{l.shortLabel}</span>
            </NavLink>
          ))}
        </nav>
        <div className="contact-block contact-block--sidebar">
          <span className="contact-lcs">{CONTACT.brandTag}</span>
          <p className="contact-lead">{CONTACT.lead}</p>
          <div className="contact-links">
            {CONTACT.channels.map((ch) => (
              <a
                key={ch.id}
                className="contact-link"
                href={ch.href}
                {...(ch.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span className="contact-link-label">{ch.label}</span>
                <span className="contact-link-value">{ch.display}</span>
              </a>
            ))}
          </div>
        </div>
      </aside>
      <div className="main">
        {mode === 'local' && (
          <div className="banner banner--slim">
            <span className="banner-text">ใช้งานบนเครื่องนี้ — ข้อมูลไม่ซิงก์</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm banner-action"
              onClick={() => setSettingsOpen(true)}
            >
              ตั้งค่า
            </button>
          </div>
        )}
        <header
          className={`topbar${chromeCollapsed ? ' topbar--collapsed' : ''}`}
          aria-hidden={chromeCollapsed}
        >
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
        </header>
        <div className="content" ref={contentRef}>
          {children}
        </div>
      </div>

      <ContactFab />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
