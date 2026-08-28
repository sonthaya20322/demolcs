import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { CONTACT } from '../../data/contact'
import { useSession } from '../../session/SessionContext'

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
  const { mode, canRetryCloud, retryCloud, resetDemo, busy, sessionId } = useSession()
  const sessionShort = sessionId ? `${sessionId.slice(0, 8)}…` : '-'
  const modeLabel = mode === 'cloud' ? 'คลาวด์' : 'บนอุปกรณ์'
  const contentRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)
  const chromeCollapsedRef = useRef(false)
  const expandLockedUntil = useRef(0)
  const [chromeCollapsed, setChromeCollapsed] = useState(false)

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

      // ถึงบนสุด — โชว์ chrome เสมอ
      if (top <= 8) {
        applyCollapsed(false)
        lastScrollTop.current = top
        return
      }

      if (Math.abs(delta) < SCROLL_DELTA) return

      if (delta > 0 && top > 24) {
        applyCollapsed(true)
      } else if (delta < 0) {
        // cooldown ทิศเดียว: บล็อกแค่ expand ทันทีหลังยุบ
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
        <div className="brand">
          <div className="brand-name">DemoLCS</div>
          <div className="brand-sub">LimitCode Studio · หลังบ้านอะไหล่ Demo</div>
        </div>
        <nav className="nav" aria-label="เมนูหลัก">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              <span className="nav-label-full">{l.label}</span>
              <span className="nav-label-short">{l.shortLabel}</span>
            </NavLink>
          ))}
        </nav>
        <div
          className={`contact-block${chromeCollapsed ? ' contact-block--collapsed' : ''}`}
          aria-hidden={chromeCollapsed}
        >
          <span className="contact-lcs">{CONTACT.brandTag}</span>
          <p className="contact-lead">{CONTACT.lead}</p>
          <div className="contact-links">
            {CONTACT.channels.map((ch) => (
              <a
                key={ch.id}
                className="contact-link"
                href={ch.href}
                tabIndex={chromeCollapsed ? -1 : undefined}
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
          <button
            type="button"
            className="btn btn-secondary topbar-reset"
            disabled={busy || chromeCollapsed}
            tabIndex={chromeCollapsed ? -1 : undefined}
            onClick={() => void resetDemo()}
          >
            รีเซ็ตข้อมูลตัวอย่าง
          </button>
        </header>
        <div className="content" ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  )
}
