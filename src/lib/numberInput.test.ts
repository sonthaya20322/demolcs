import { describe, expect, it } from 'vitest'
import { commitNumberInput, parseNumberInput } from './numberInput'

describe('parseNumberInput', () => {
  it('allows clearing the field (no forced zero)', () => {
    expect(parseNumberInput('')).toBe('')
    expect(parseNumberInput('   ')).toBe('')
  })

  it('strips leading-zero strings to a plain number', () => {
    expect(parseNumberInput('022')).toBe(22)
    expect(parseNumberInput('045')).toBe(45)
    expect(parseNumberInput('03')).toBe(3)
    expect(parseNumberInput('056')).toBe(56)
    expect(parseNumberInput('012')).toBe(12)
  })

  it('keeps zero when the user intentionally enters zero', () => {
    expect(parseNumberInput('0')).toBe(0)
    expect(parseNumberInput('0.5')).toBe(0.5)
  })

  it('rejects non-numeric input as empty', () => {
    expect(parseNumberInput('abc')).toBe('')
  })
})

describe('commitNumberInput', () => {
  it('uses fallback when empty', () => {
    expect(commitNumberInput('')).toBe(0)
    expect(commitNumberInput('', 5)).toBe(5)
  })

  it('returns the numeric value when set', () => {
    expect(commitNumberInput(12)).toBe(12)
    expect(commitNumberInput(0)).toBe(0)
  })
})
