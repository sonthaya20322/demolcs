import { describe, expect, it } from 'vitest'
import { applyIssue, applyReceive, assertCanIssue, isLowStock } from './stockLogic'

describe('stockLogic', () => {
  it('cuts stock on issue', () => {
    expect(applyIssue(10, 3)).toBe(7)
  })

  it('rejects over-issue', () => {
    expect(() => assertCanIssue(2, 5, 'FT-010')).toThrow('INSUFFICIENT_STOCK:FT-010')
  })

  it('adds stock on receive', () => {
    expect(applyReceive(4, 6)).toBe(10)
  })

  it('detects low stock', () => {
    expect(isLowStock(5, 5)).toBe(true)
    expect(isLowStock(6, 5)).toBe(false)
  })
})
