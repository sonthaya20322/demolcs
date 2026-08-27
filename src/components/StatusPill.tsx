import type { IssueStatus } from '../data/types'

const labels: Record<IssueStatus, string> = {
  pending: 'รอดำเนินการ',
  picking: 'กำลังจัดของ',
  completed: 'เบิกสำเร็จ',
  cancelled: 'ยกเลิก',
}

export function StatusPill({ status }: { status: IssueStatus }) {
  const cls =
    status === 'completed'
      ? 'pill-success'
      : status === 'cancelled'
        ? 'pill-danger'
        : status === 'picking'
          ? 'pill-warning'
          : 'pill-neutral'
  return <span className={`pill ${cls}`}>{labels[status]}</span>
}

export function StockPill({ qty, reorder }: { qty: number; reorder: number }) {
  if (qty <= 0) return <span className="pill pill-danger">หมด</span>
  if (qty <= reorder) return <span className="pill pill-warning">ใกล้หมด</span>
  return <span className="pill pill-success">พอใช้</span>
}
