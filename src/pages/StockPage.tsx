import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StockPill } from '../components/StatusPill'
import type { Product, StockMovement } from '../data/types'
import { formatDateTime, formatQty, friendlyError } from '../lib/format'
import { useSession } from '../session/SessionContext'

export function StockPage() {
  const { repository, refreshKey } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<(StockMovement & { product_name?: string; product_sku?: string })[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!repository) return
    let cancelled = false
    ;(async () => {
      try {
        const [p, m] = await Promise.all([repository.listProducts(), repository.listMovements(40)])
        if (!cancelled) {
          setProducts(p)
          setMovements(m)
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

  const low = products.filter((p) => p.qty_on_hand <= p.reorder_level)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>สต็อก</h1>
          <p>ดูคงเหลือและประวัติเคลื่อนไหว — งานรับเข้าแยกเป็นขั้นตอนชัดเจน</p>
        </div>
        <Link className="btn btn-gold" to="/stock/receive">
          รับเข้าสินค้า
        </Link>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="stats">
        <div className="stat">
          <div className="stat-label">รายการสินค้าทั้งหมด</div>
          <div className="stat-value">{products.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">ใกล้หมด / หมด</div>
          <div className="stat-value">{low.length}</div>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel-title">คงเหลือปัจจุบัน</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อ</th>
                <th>คงเหลือ</th>
                <th>จุดเตือน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>
                    {formatQty(p.qty_on_hand)} {p.unit}
                  </td>
                  <td>{formatQty(p.reorder_level)}</td>
                  <td>
                    <StockPill qty={p.qty_on_hand} reorder={p.reorder_level} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">ประวัติรับเข้า / เบิกออก</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>เวลา</th>
                <th>ประเภท</th>
                <th>สินค้า</th>
                <th>จำนวน</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{formatDateTime(m.created_at)}</td>
                  <td>{m.type === 'receive' ? 'รับเข้า' : 'เบิกออก'}</td>
                  <td>
                    {m.product_sku} · {m.product_name}
                  </td>
                  <td>{formatQty(m.qty)}</td>
                  <td>{m.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
