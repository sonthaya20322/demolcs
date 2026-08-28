import { useEffect, useId, useRef } from 'react'
import { useSession } from '../../session/SessionContext'

type Props = {
  open: boolean
  onClose: () => void
}

export function SettingsSheet({ open, onClose }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const { mode, sessionId, canRetryCloud, bootError, error, busy, retryCloud, resetDemo } = useSession()
  const sessionShort = sessionId ? `${sessionId.slice(0, 8)}…` : '-'
  const modeLabel = mode === 'cloud' ? 'คลาวด์' : 'บนอุปกรณ์'
  const displayError = error ?? bootError

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!open) return null

  const onReset = () => {
    const ok = window.confirm('รีเซ็ตข้อมูลตัวอย่างทั้งหมดในเซสชันนี้? การกระทำนี้ย้อนกลับไม่ได้')
    if (!ok) return
    void resetDemo().then(() => onClose())
  }

  return (
    <div className="sheet-root" role="presentation">
      <button type="button" className="sheet-backdrop" aria-label="ปิด" onClick={onClose} />
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
            ตั้งค่าเดโม
          </h2>
          <button type="button" className="btn btn-secondary btn-sm sheet-close" onClick={onClose}>
            ปิด
          </button>
        </div>

        <dl className="settings-meta">
          <div className="settings-meta-row">
            <dt>โหมด</dt>
            <dd>{modeLabel}</dd>
          </div>
          <div className="settings-meta-row">
            <dt>Session</dt>
            <dd className="settings-mono">{sessionShort}</dd>
          </div>
        </dl>

        {displayError && <p className="error-text settings-error">{displayError}</p>}

        <div className="settings-actions">
          {mode === 'local' && canRetryCloud && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void retryCloud()}
            >
              เชื่อมต่อโหมดคลาวด์อีกครั้ง
            </button>
          )}
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onReset}>
            รีเซ็ตข้อมูลตัวอย่าง
          </button>
        </div>
      </div>
    </div>
  )
}
