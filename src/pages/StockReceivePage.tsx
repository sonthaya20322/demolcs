import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Product } from '../data/types'
import { formatQty, friendlyError } from '../lib/format'
import { validateReceiveDraftLines, type LineFieldErrors, type MovementDraftLine } from '../lib/issueDraft'
import { parseNumberInput } from '../lib/numberInput'
import { useSession } from '../session/SessionContext'

const emptyLine = (): MovementDraftLine => ({ product_id: '', qty: '' })

export function StockReceivePage() {
  const { repository, bump } = useSession()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [lines, setLines] = useState<MovementDraftLine[]>([emptyLine()])
  const [lineErrors, setLineErrors] = useState<Record<number, LineFieldErrors>>({})
  const [note, setNote] = useState('รับเข้าจากซัพพลายเออร์')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!repository) return
    void repository.listProducts().then(setProducts).catch((err) => setError(friendlyError(err)))
  }, [repository])

  function updateLine(index: number, patch: Partial<MovementDraftLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!repository) return

    const result = validateReceiveDraftLines(lines)
    setLineErrors(result.lineErrors)
    if (result.formError) {
      setError(result.formError)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await repository.receiveStock(result.items.map((i) => ({ ...i, note })))
      bump()
      navigate('/stock')
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
          <h1>รับเข้าสินค้า</h1>
          <p>งานรับเข้าแยกจากคิวเบิก — เพิ่มคงเหลือและบันทึกประวัติทันที</p>
        </div>
        <Link className="btn btn-secondary" to="/stock">
          กลับหน้าสต็อก
        </Link>
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="panel">
        <form onSubmit={onSubmit}>
          <div className="field full" style={{ marginBottom: '0.75rem' }}>
            <label>หมายเหตุ</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {lines.map((line, index) => (
            <div className="form-grid" key={index} style={{ marginBottom: '0.5rem' }}>
              <div className="field">
                <label>สินค้า</label>
                <select
                  required
                  value={line.product_id}
                  onChange={(e) => updateLine(index, { product_id: e.target.value })}
                >
                  <option value="">เลือกสินค้า</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} · {p.name} (คงเหลือ {formatQty(p.qty_on_hand)})
                    </option>
                  ))}
                </select>
              </div>
              <div className={`field${lineErrors[index]?.qty ? ' field--invalid' : ''}`}>
                <label>จำนวนรับเข้า</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  aria-invalid={Boolean(lineErrors[index]?.qty)}
                  value={line.qty}
                  onChange={(e) => {
                    updateLine(index, { qty: parseNumberInput(e.target.value) })
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
              เพิ่มรายการ
            </button>
            <button className="btn" type="submit" disabled={busy}>
              บันทึกรับเข้า
            </button>
          </div>
        </form>
      </section>
    </>
  )
}
