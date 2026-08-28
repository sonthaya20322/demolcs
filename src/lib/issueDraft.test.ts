import { describe, expect, it } from 'vitest'
import type { Product } from '../data/types'
import {
  enrichInsufficientFromOrder,
  formatStockShort,
  validateIssueDraftLines,
  validateMovementQty,
  validateReceiveDraftLines,
} from './issueDraft'

const product = (partial: Partial<Product> & Pick<Product, 'id' | 'sku' | 'qty_on_hand'>): Product => ({
  session_id: 's',
  name: partial.name ?? partial.sku,
  category_id: null,
  unit: 'ชิ้น',
  reorder_level: 0,
  cost_price: 0,
  sell_price: 1,
  ...partial,
})

describe('validateMovementQty', () => {
  it('rejects empty and zero', () => {
    expect(validateMovementQty('')).toMatch(/มากกว่า 0/)
    expect(validateMovementQty(0)).toMatch(/มากกว่า 0/)
  })

  it('accepts positive qty', () => {
    expect(validateMovementQty(1)).toBeUndefined()
    expect(validateMovementQty(20)).toBeUndefined()
  })
})

describe('validateIssueDraftLines', () => {
  const products = [
    product({ id: 'p1', sku: 'FT-010', qty_on_hand: 1 }),
    product({ id: 'p2', sku: 'EL-040', qty_on_hand: 0 }),
  ]

  it('hard-blocks when requested exceeds on-hand', () => {
    const result = validateIssueDraftLines([{ product_id: 'p1', qty: 20 }], products)
    expect(result.items).toEqual([])
    expect(result.lineErrors[0]?.qty).toContain('เหลือ')
    expect(result.lineErrors[0]?.qty).toContain('1')
    expect(result.lineErrors[0]?.qty).toContain('20')
    expect(result.formError).toBeTruthy()
  })

  it('hard-blocks when stock is zero', () => {
    const result = validateIssueDraftLines([{ product_id: 'p2', qty: 1 }], products)
    expect(result.lineErrors[0]?.qty).toMatch(/หมดสต็อก/)
  })

  it('passes when qty fits', () => {
    const result = validateIssueDraftLines([{ product_id: 'p1', qty: 1 }], products)
    expect(result.formError).toBeNull()
    expect(result.items).toEqual([{ product_id: 'p1', qty: 1 }])
  })

  it('rejects blank qty on selected product', () => {
    const result = validateIssueDraftLines([{ product_id: 'p1', qty: '' }], products)
    expect(result.lineErrors[0]?.qty).toMatch(/มากกว่า 0/)
  })
})

describe('validateReceiveDraftLines', () => {
  it('requires qty > 0 and does not check stock', () => {
    const bad = validateReceiveDraftLines([{ product_id: 'p1', qty: 0 }])
    expect(bad.lineErrors[0]?.qty).toMatch(/มากกว่า 0/)

    const ok = validateReceiveDraftLines([{ product_id: 'p1', qty: 5 }])
    expect(ok.items).toEqual([{ product_id: 'p1', qty: 5 }])
  })
})

describe('formatStockShort', () => {
  it('uses out-of-stock copy when on-hand is 0', () => {
    expect(formatStockShort('A', 0, 5)).toMatch(/หมดสต็อก/)
  })
})

describe('enrichInsufficientFromOrder', () => {
  it('adds on-hand and requested when message is short', () => {
    const products = [product({ id: 'p1', sku: 'FT-010', qty_on_hand: 1 })]
    const msg = enrichInsufficientFromOrder('คงเหลือไม่พอสำหรับ FT-010', [{ product_id: 'p1', qty_requested: 20 }], products)
    expect(msg).toContain('เหลือ')
    expect(msg).toContain('1')
    expect(msg).toContain('20')
  })
})
