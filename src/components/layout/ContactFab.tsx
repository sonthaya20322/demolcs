import { useEffect, useId, useRef, useState } from 'react'
import { CONTACT } from '../../data/contact'

export function ContactFab() {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  return (
    <div className="contact-fab-root">
      <button
        type="button"
        className="contact-fab"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="ช่องทางติดต่อ LimitCode Studio"
        onClick={() => setOpen(true)}
      >
        {CONTACT.brandTag}
      </button>

      {open && (
        <div className="sheet-root" role="presentation">
          <button type="button" className="sheet-backdrop" aria-label="ปิด" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            <div className="sheet-handle" aria-hidden />
            <div className="sheet-header">
              <h2 id={titleId} className="sheet-title">
                ติดต่อ {CONTACT.brandTag}
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm sheet-close"
                onClick={() => setOpen(false)}
              >
                ปิด
              </button>
            </div>
            <p className="contact-sheet-lead">{CONTACT.lead}</p>
            <div className="contact-sheet-links">
              {CONTACT.channels.map((ch) => (
                <a
                  key={ch.id}
                  className="contact-sheet-link"
                  href={ch.href}
                  {...(ch.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span className="contact-link-label">{ch.label}</span>
                  <span className="contact-link-value">{ch.display}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
