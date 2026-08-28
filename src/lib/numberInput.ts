/** Empty while editing so users can clear leading zeros; commit to number on submit. */
export type NumberInputValue = number | ''

export function parseNumberInput(raw: string): NumberInputValue {
  const trimmed = raw.trim()
  if (trimmed === '') return ''
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return ''
  return n
}

export function commitNumberInput(value: NumberInputValue, fallback = 0): number {
  if (value === '' || !Number.isFinite(value)) return fallback
  return value
}
