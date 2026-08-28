import type { Product } from '../data/types'
import { formatQty } from './format'
import { commitNumberInput, type NumberInputValue } from './numberInput'

export type MovementDraftLine = {
  product_id: string
  qty: NumberInputValue
}

export type LineFieldErrors = {
  qty?: string
}

export function validateMovementQty(qty: NumberInputValue): string | undefined {
  if (qty === '' || qty <= 0) return 'กรุณากรอกจำนวนมากกว่า 0'
  return undefined
}

export function formatStockShort(sku: string, onHand: number, requested: number): string {
  if (onHand <= 0) {
    return `หมดสต็อก — ${sku} เหลือ 0 ไม่สามารถเบิกได้`
  }
  return `คงเหลือไม่พอ — ${sku} เหลือ ${formatQty(onHand)} แต่ขอเบิก ${formatQty(requested)}`
}

export function formatStockComplete(sku: string, onHand: number, requested: number): string {
  return `คงเหลือไม่พอสำหรับ ${sku} — เหลือ ${formatQty(onHand)} ขอเบิก ${formatQty(requested)}`
}

/** Encode for Error.message — kept for tests / callers that build the code manually */
export function encodeInsufficientStock(sku: string, onHand: number, requested: number): string {
  return `INSUFFICIENT_STOCK:${sku}:${onHand}:${requested}`
}

export function validateIssueDraftLines(
  lines: MovementDraftLine[],
  products: Product[],
): {
  lineErrors: Record<number, LineFieldErrors>
  formError: string | null
  items: { product_id: string; qty: number }[]
} {
  const lineErrors: Record<number, LineFieldErrors> = {}
  const items: { product_id: string; qty: number }[] = []
  const byId = Object.fromEntries(products.map((p) => [p.id, p]))

  lines.forEach((line, index) => {
    if (!line.product_id) return

    const qtyErr = validateMovementQty(line.qty)
    if (qtyErr) {
      lineErrors[index] = { qty: qtyErr }
      return
    }

    const qty = commitNumberInput(line.qty)
    const product = byId[line.product_id]
    if (!product) {
      lineErrors[index] = { qty: 'ไม่พบสินค้า' }
      return
    }

    if (product.qty_on_hand < qty) {
      lineErrors[index] = {
        qty: formatStockShort(product.sku, product.qty_on_hand, qty),
      }
      return
    }

    items.push({ product_id: line.product_id, qty })
  })

  if (Object.keys(lineErrors).length > 0) {
    const first = Object.values(lineErrors)[0]?.qty ?? 'กรุณาตรวจสอบจำนวนในใบเบิก'
    return { lineErrors, formError: first, items: [] }
  }

  if (!items.length) {
    return { lineErrors: {}, formError: 'กรุณาเลือกรายการอย่างน้อย 1 รายการ', items: [] }
  }

  return { lineErrors: {}, formError: null, items }
}

export function validateReceiveDraftLines(lines: MovementDraftLine[]): {
  lineErrors: Record<number, LineFieldErrors>
  formError: string | null
  items: { product_id: string; qty: number }[]
} {
  const lineErrors: Record<number, LineFieldErrors> = {}
  const items: { product_id: string; qty: number }[] = []

  lines.forEach((line, index) => {
    if (!line.product_id) return
    const qtyErr = validateMovementQty(line.qty)
    if (qtyErr) {
      lineErrors[index] = { qty: qtyErr }
      return
    }
    items.push({ product_id: line.product_id, qty: commitNumberInput(line.qty) })
  })

  if (Object.keys(lineErrors).length > 0) {
    const first = Object.values(lineErrors)[0]?.qty ?? 'กรุณาตรวจสอบจำนวน'
    return { lineErrors, formError: first, items: [] }
  }

  if (!items.length) {
    return { lineErrors: {}, formError: 'กรุณาเลือกรายการอย่างน้อย 1 รายการ', items: [] }
  }

  return { lineErrors: {}, formError: null, items }
}

/** Enrich complete-time errors when RPC only returns SKU */
export function enrichInsufficientFromOrder(
  message: string,
  orderItems: { product_id: string; qty_requested: number }[],
  products: Product[],
): string {
  if (!message.includes('คงเหลือไม่พอ') || message.includes('ขอเบิก')) return message
  const byId = Object.fromEntries(products.map((p) => [p.id, p]))
  for (const it of orderItems) {
    const product = byId[it.product_id]
    if (!product) continue
    if (product.qty_on_hand < it.qty_requested) {
      return formatStockComplete(product.sku, product.qty_on_hand, it.qty_requested)
    }
  }
  return message
}
