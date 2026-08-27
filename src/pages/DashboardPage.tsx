import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill, StockPill } from '../components/StatusPill'
import type { DashboardSummary } from '../data/types'
import { formatDateTime, formatQty, friendlyError } from '../lib/format'
import { useSession } from '../session/SessionContext'

export function DashboardPage() {
  const { repository, refreshKey } = useSession()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!repository) return
    let cancelled = false
    ;(async () => {
      try {
        const summary = await repository.getDashboard()
        if (!cancelled) {
          setData(summary)
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

  if (!data && !error) return <div className="loading">กำลังโหลดภาพรวม...</div>
  if (error) return <p className="error-text">{error}</p>
  if (!data) return null

  return (
    <>
      <div className="page-header">
        <div>
          <h1>ภาพรวมวันนี้</h1>
          <p>ลดขั้นตอนคลังและเบิกของ — เห็นสถานะวันนั้นชัดในหน้าเดียว</p>
        </div>
        <div className="actions">
          <Link className="btn btn-secondary" to="/stock/receive">
            รับเข้าสินค้า
          </Link>
          <Link className="btn" to="/issues">
            ไปคิวเบิกของ
          </Link>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">ของใกล้หมด / หมด</div>
          <div className="stat-value">{data.lowStockCount}</div>
        </div>
        <div className="stat">
          <div className="stat-label">คิวรอดำเนินการ</div>
          <div className="stat-value">{data.pendingIssueCount}</div>
        </div>
        <div className="stat">
          <div className="stat-label">เบิกสำเร็จวันนี้</div>
          <div className="stat-value">{data.completedTodayCount}</div>
        </div>
        <div className="stat">
          <div className="stat-label">เบิก / รับเข้า (จำนวน)</div>
          <div className="stat-value">
            {formatQty(data.issueTodayQty)} / {formatQty(data.receiveTodayQty)}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2 className="panel-title">สินค้าที่ควรเติม</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อ</th>
                  <th>คงเหลือ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      ยังไม่มีรายการใกล้หมด
                    </td>
                  </tr>
                )}
                {data.lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>
                      {formatQty(p.qty_on_hand)} {p.unit}
                    </td>
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
          <h2 className="panel-title">คิวเบิกที่เปิดอยู่</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>สถานะ</th>
                  <th>อ้างอิง</th>
                  <th>รายการ</th>
                </tr>
              </thead>
              <tbody>
                {data.openIssues.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">
                      ไม่มีคิวค้าง
                    </td>
                  </tr>
                )}
                {data.openIssues.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <StatusPill status={o.status} />
                    </td>
                    <td>{o.ref_note || '-'}</td>
                    <td>{o.items?.length ?? 0} รายการ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2 className="panel-title">ความเคลื่อนไหวล่าสุด</h2>
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
              {data.recentMovements.map((m) => (
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
