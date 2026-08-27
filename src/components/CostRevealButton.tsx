import { useState } from 'react'

export function CostRevealButton({ cost }: { cost: number }) {
  const [show, setShow] = useState(false)
  return (
    <span className="actions">
      {show ? (
        <strong>{cost.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</strong>
      ) : (
        <span className="muted">••••</span>
      )}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShow((s) => !s)}>
        {show ? 'ซ่อนต้นทุน' : 'แสดงต้นทุน'}
      </button>
    </span>
  )
}
