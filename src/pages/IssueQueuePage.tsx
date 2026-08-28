import { useEffect, useState, type FormEvent } from 'react'
import { StatusPill } from '../components/StatusPill'
import type { IssueOrder, Product } from '../data/types'
import { formatDateTime, formatQty, friendlyError } from '../lib/format'
import {
  enrichInsufficientFromOrder,
  validateIssueDraftLines,
  type LineFieldErrors,
  type MovementDraftLine,
} from '../lib/issueDraft'
import { parseNumberInput } from '../lib/numberInput'
import { useSession } from '../session/SessionContext'

const emptyLine = (): MovementDraftLine => ({ product_id: '', qty: '' })

export function IssueQueuePage() {
  const { repository, refreshKey, bump } = useSession()
  const [orders, setOrders] = useState<IssueOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [refNote, setRefNote] = useState('')
  const [lines, setLines] = useState<MovementDraftLine[]>([emptyLine()])
  const [lineErrors, setLineErrors] = useState<Record<number, LineFieldErrors>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!repository) return
    let cancelled = false
    ;(async () => {
      try {
        const [o, p] = await Promise.all([repository.listIssueOrders(), repository.listProducts()])
        if (!cancelled) {
          setOrders(o)
          setProducts(p)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(friendlyError(err))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [repository, refreshKey])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!repository) return

    const result = validateIssueDraftLines(lines, products)
    setLineErrors(result.lineErrors)
    if (result.formError) {
      setError(result.formError)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await repository.createIssueOrder({ ref_note: refNote.trim() || undefined, items: result.items })
      setRefNote('')
      setLines([emptyLine()])
      setLineErrors({})
      bump()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function complete(orderId: string) {
    if (!repository) return
    setBusy(true)
    setError(null)
    try {
      await repository.completeIssueOrder(orderId)
      bump()
    } catch (err) {
      const order = orders.find((o) => o.id === orderId)
      const base = friendlyError(err)
      setError(enrichInsufficientFromOrder(base, order?.items ?? [], products))
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(orderId: string, status: 'picking' | 'cancelled') {
    if (!repository) return
    setBusy(true)
    setError(null)
    try {
      await repository.updateIssueStatus(orderId, status)
      bump()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>คิวเบิกของ</h1>
          <p>สร้างใบเบิกหลายรายการ — กดเบิกสำเร็จแล้วตัดสต็อกทันที (กันเบิกเกินคงเหลือ)</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="panel">
        <h2 className="panel-title">สร้างใบเบิกใหม่</h2>
        <form onSubmit={onCreate}>
          <div className="field full" style={{ marginBottom: '0.75rem' }}>
            <label>อ้างอิงงาน / ทะเบียน (ไม่บังคับ)</label>
            <input
              placeholder="เช่น ทะเบียน กข-1234 หรือ งานเปลี่ยนถ่ายน้ำมัน"
              value={refNote}
              onChange={(e) => setRefNote(e.target.value)}
            />
          </div>
          {lines.map((line, index) => (
            <div className="form-grid" key={index} style={{ marginBottom: '0.5rem' }}>
              <div className="field">
                <label>สินค้า</label>
                <select
                  required
                  value={line.product_id}
                  onChange={(e) =>
                    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, product_id: e.target.value } : l)))
                  }
                >
                  <option value="">เลือกสินค้า</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} · {p.name} (เหลือ {formatQty(p.qty_on_hand)} {p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className={`field${lineErrors[index]?.qty ? ' field--invalid' : ''}`}>
                <label>จำนวนเบิก</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  aria-invalid={Boolean(lineErrors[index]?.qty)}
                  value={line.qty}
                  onChange={(e) => {
                    const qty = parseNumberInput(e.target.value)
                    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, qty } : l)))
                    if (lineErrors[index]?.qty) {
                      setLineErrors((prev) => {
                        const next = { ...prev }
                        delete next[index]
                        return next
                      })
                    }
                  }}
                />
                {lineErrors[index]?.qty && (
                  <span className="field-error" role="alert">
                    {lineErrors[index].qty}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div className="actions" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
              เพิ่มรายการในใบเบิก
            </button>
            <button className="btn" type="submit" disabled={busy}>
              สร้างใบเบิก
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2 className="panel-title">รายการคิว ({orders.length})</h2>
        <div className="table-wrap">
          <table className="data table-dense">
            <thead>
              <tr>
                <th className="col-hide-sm">สร้างเมื่อ</th>
                <th>สถานะ</th>
                <th>อ้างอิง</th>
                <th>รายการ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="col-hide-sm">{formatDateTime(o.created_at)}</td>
                  <td>
                    <StatusPill status={o.status} />
                  </td>
                  <td>{o.ref_note || '-'}</td>
                  <td>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {(o.items ?? []).map((it) => (
                        <li key={it.id}>
                          {it.product?.sku} · {it.product?.name} × {formatQty(it.qty_requested)}
                          {o.status === 'completed' ? ` (เบิกแล้ว ${formatQty(it.qty_issued)})` : ''}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <div className="actions actions-stack-sm">
                      {(o.status === 'pending' || o.status === 'picking') && (
                        <>
                          {o.status === 'pending' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              disabled={busy}
                              onClick={() => void setStatus(o.id, 'picking')}
                            >
                              เริ่มจัดของ
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm"
                            disabled={busy}
                            onClick={() => void complete(o.id)}
                          >
                            เบิกสำเร็จ
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={busy}
                            onClick={() => void setStatus(o.id, 'cancelled')}
                          >
                            ยกเลิก
                          </button>
                        </>
                      )}
                      {o.status === 'completed' && o.completed_at && (
                        <span className="muted">ปิดเมื่อ {formatDateTime(o.completed_at)}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
