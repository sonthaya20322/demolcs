import { describe, expect, it } from 'vitest'
import { formatBootError } from './bootstrap'

describe('formatBootError', () => {
  it('formats Postgrest-like objects with message and details', () => {
    const msg = formatBootError({
      message: 'update or delete on table "products" violates foreign key constraint',
      details: 'Key (id)=(abc) is still referenced from table "issue_order_items".',
    })
    expect(msg).toContain('violates foreign key')
    expect(msg).toContain('issue_order_items')
  })

  it('uses message alone when details are missing', () => {
    expect(formatBootError({ message: 'SESSION_EXPIRED' })).toBe('SESSION_EXPIRED')
  })

  it('reads Error.message', () => {
    expect(formatBootError(new Error('เครือข่ายขาด'))).toBe('เครือข่ายขาด')
  })

  it('falls back for unknown values', () => {
    expect(formatBootError(null)).toBe('เชื่อมต่อคลาวด์ไม่สำเร็จ')
    expect(formatBootError(42)).toBe('เชื่อมต่อคลาวด์ไม่สำเร็จ')
  })
})
