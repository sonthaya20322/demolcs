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
    const sku = msg.split(':')[1]
    return sku ? `คงเหลือไม่พอสำหรับ ${sku}` : 'คงเหลือไม่พอ ไม่สามารถเบิกสำเร็จได้'
  }
  if (msg.includes('ORDER_NOT_COMPLETABLE')) return 'ใบเบิกนี้ไม่สามารถปิดงานได้'
  if (msg.includes('SESSION_EXPIRED')) return 'เซสชันหมดอายุ กรุณารีเซ็ตหรือรีเฟรชหน้า'
  if (msg.includes('PRODUCT_NOT_FOUND')) return 'ไม่พบสินค้า'
  if (msg.includes('INVALID_QTY')) return 'จำนวนไม่ถูกต้อง'
  if (msg.includes('EMPTY_ITEMS')) return 'กรุณาเลือกรายการสินค้าอย่างน้อย 1 รายการ'
  return msg || 'เกิดข้อผิดพลาด'
}
