export function assertCanIssue(
  onHand: number,
  requested: number,
  sku?: string,
): void {
  if (requested <= 0) {
    throw new Error('INVALID_QTY')
  }
  if (onHand < requested) {
    if (sku) {
      throw new Error(`INSUFFICIENT_STOCK:${sku}:${onHand}:${requested}`)
    }
    throw new Error('INSUFFICIENT_STOCK')
  }
}

export function applyIssue(onHand: number, requested: number, sku?: string): number {
  assertCanIssue(onHand, requested, sku)
  return onHand - requested
}

export function applyReceive(onHand: number, qty: number): number {
  if (qty <= 0) throw new Error('INVALID_QTY')
  return onHand + qty
}

export function isLowStock(qty: number, reorderLevel: number): boolean {
  return qty <= reorderLevel
}

export function startOfLocalDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfLocalDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function isSameLocalDay(iso: string, day = new Date()): boolean {
  const t = new Date(iso).getTime()
  return t >= startOfLocalDay(day).getTime() && t <= endOfLocalDay(day).getTime()
}
