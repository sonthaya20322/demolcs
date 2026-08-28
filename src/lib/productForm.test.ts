import { describe, expect, it } from 'vitest'
import { commitProductFormNumbers, validateProductFormNumbers } from './productForm'

describe('validateProductFormNumbers', () => {
  const base = {
    qty_on_hand: '' as const,
    reorder_level: '' as const,
    cost_price: '' as const,
    sell_price: '' as const,
  }

  it('requires sell price when empty (blocks save)', () => {
    const errors = validateProductFormNumbers(base)
    expect(errors.sell_price).toBe('กรุณากรอกราคาขาย')
  })

  it('allows explicit sell price 0 (not treated as empty)', () => {
    expect(validateProductFormNumbers({ ...base, sell_price: 0 })).toEqual({})
  })

  it('allows positive sell price', () => {
    expect(validateProductFormNumbers({ ...base, sell_price: 56 })).toEqual({})
  })

  it('rejects negative sell price', () => {
    expect(validateProductFormNumbers({ ...base, sell_price: -1 }).sell_price).toMatch(/ไม่ติดลบ/)
  })

  it('does not require qty, reorder, or cost when empty', () => {
    const errors = validateProductFormNumbers({
      qty_on_hand: '',
      reorder_level: '',
      cost_price: '',
      sell_price: 100,
    })
    expect(errors).toEqual({})
  })
})

describe('commitProductFormNumbers', () => {
  it('maps empty optional fields to 0 and keeps sell price', () => {
    expect(
      commitProductFormNumbers({
        qty_on_hand: '',
        reorder_level: '',
        cost_price: '',
        sell_price: 56,
      }),
    ).toEqual({
      qty_on_hand: 0,
      reorder_level: 0,
      cost_price: 0,
      sell_price: 56,
    })
  })

  it('preserves explicit zeros for optional and sell fields', () => {
    expect(
      commitProductFormNumbers({
        qty_on_hand: 0,
        reorder_level: 0,
        cost_price: 0,
        sell_price: 0,
      }),
    ).toEqual({
      qty_on_hand: 0,
      reorder_level: 0,
      cost_price: 0,
      sell_price: 0,
    })
  })
})
