import { describe, expect, it } from 'vitest'
import { friendlyError } from './format'

describe('friendlyError insufficient stock', () => {
  it('includes on-hand and requested when encoded', () => {
    const msg = friendlyError(new Error('INSUFFICIENT_STOCK:FT-010:1:20'))
    expect(msg).toContain('FT-010')
    expect(msg).toContain('1')
    expect(msg).toContain('20')
  })

  it('falls back to sku-only message', () => {
    expect(friendlyError(new Error('INSUFFICIENT_STOCK:FT-010'))).toBe('คงเหลือไม่พอสำหรับ FT-010')
  })
})
