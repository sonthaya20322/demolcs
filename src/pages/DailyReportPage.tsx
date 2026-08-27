import { useEffect, useState } from 'react'
import { StatusPill } from '../components/StatusPill'
import type { DailyReport } from '../data/types'
import { formatDateTime, formatQty, friendlyError } from '../lib/format'
import { useSession } from '../session/SessionContext'

export function DailyReportPage() {
  const { repository, refreshKey } = useSession()
  const [report, setReport] = useState<DailyReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!repository) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await repository.getDailyReport()
        if (!cancelled) {
          setReport(data)
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

  if (!report && !error) return <div className="loading">กำลังโหลดรายงาน...</div>
  if (error) return <p className="error-text">{error}</p>
  if (!report) return null

  return (
    <>
      <div className="page-header">
        <div>
          <h1>รายงานรายวัน</h1>
          <p>สรุปงานและจำนวนเบิก/รับเข้าของวันที่ {report.date}</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">ใบเบิกสำเร็จวันนี้</div>
          <div className="stat-value">{report.completedOrders}</div>
        </div>
        <div className="stat">
          <div className="stat-label">คิวที่ยังเปิด</div>
          <div className="stat-value">{report.openOrders}</div>
        </div>
        <div className="stat">
          <div className="stat-label">จำนวนที่เบิกออก</div>
          <div className="stat-value">{formatQty(report.totalIssuedQty)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">จำนวนที่รับเข้า</div>
          <div className="stat-value">{formatQty(report.totalReceivedQty)}</div>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel-title">ใบเบิกที่ปิดวันนี้</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>เวลาปิด</th>
                <th>สถานะ</th>
                <th>อ้างอิง</th>
                <th>รายการ</th>
              </tr>
            </thead>
            <tbody>
              {report.completedIssueOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    ยังไม่มีใบเบิกสำเร็จวันนี้ — ลองไปที่คิวเบิกของแล้วกดเบิกสำเร็จ
                  </td>
                </tr>
              )}
              {report.completedIssueOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.completed_at ? formatDateTime(o.completed_at) : '-'}</td>
                  <td>
                    <StatusPill status={o.status} />
                  </td>
                  <td>{o.ref_note || '-'}</td>
                  <td>
                    {(o.items ?? []).map((it) => (
                      <div key={it.id}>
                        {it.product?.sku} × {formatQty(it.qty_issued || it.qty_requested)}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">ความเคลื่อนไหววันนี้ ({report.movements.length})</h2>
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
              {report.movements.map((m) => (
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
