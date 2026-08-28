export function formatMoney(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function formatQty(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('th-TH', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('INSUFFICIENT_STOCK')) {
    const payload = msg.includes('INSUFFICIENT_STOCK:')
      ? msg.slice(msg.indexOf('INSUFFICIENT_STOCK:') + 'INSUFFICIENT_STOCK:'.length)
      : ''
    const [sku, onHandRaw, requestedRaw] = payload.split(':')
    if (sku && onHandRaw !== undefined && requestedRaw !== undefined && onHandRaw !== '' && requestedRaw !== '') {
      const onHand = Number(onHandRaw)
      const requested = Number(requestedRaw)
      if (Number.isFinite(onHand) && Number.isFinite(requested)) {
        return `คงเหลือไม่พอสำหรับ ${sku} — เหลือ ${formatQty(onHand)} ขอเบิก ${formatQty(requested)}`
      }
    }
    if (sku) return `คงเหลือไม่พอสำหรับ ${sku}`
    return 'คงเหลือไม่พอ ไม่สามารถเบิกสำเร็จได้'
  }
  if (msg.includes('ORDER_NOT_COMPLETABLE')) return 'ใบเบิกนี้ไม่สามารถปิดงานได้'
  if (msg.includes('SESSION_EXPIRED')) return 'เซสชันหมดอายุ กรุณารีเซ็ตหรือรีเฟรชหน้า'
  if (msg.includes('PRODUCT_NOT_FOUND')) return 'ไม่พบสินค้า'
  if (msg.includes('INVALID_QTY')) return 'จำนวนไม่ถูกต้อง'
  if (msg.includes('EMPTY_ITEMS')) return 'กรุณาเลือกรายการสินค้าอย่างน้อย 1 รายการ'
  return msg || 'เกิดข้อผิดพลาด'
}
