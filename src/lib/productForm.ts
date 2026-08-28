import { commitNumberInput, type NumberInputValue } from './numberInput'

export type ProductFormNumbers = {
  qty_on_hand: NumberInputValue
  reorder_level: NumberInputValue
  cost_price: NumberInputValue
  sell_price: NumberInputValue
}

export type ProductFormFieldErrors = {
  sell_price?: string
}

/**
 * Master-data rules for demo (aligned with real parts back-office):
 * - Sell price required (empty blocks save). Explicit 0 is allowed.
 * - Opening qty / reorder / cost optional → commit as 0 when empty.
 * - Cost stays optional: many shops open the SKU first, fill cost later.
 */
export function validateProductFormNumbers(fields: ProductFormNumbers): ProductFormFieldErrors {
  const errors: ProductFormFieldErrors = {}
  if (fields.sell_price === '') {
    errors.sell_price = 'กรุณากรอกราคาขาย'
  } else if (fields.sell_price < 0) {
    errors.sell_price = 'ราคาขายต้องไม่ติดลบ'
  }
  return errors
}

export function commitProductFormNumbers(fields: ProductFormNumbers): {
  qty_on_hand: number
  reorder_level: number
  cost_price: number
  sell_price: number
} {
  return {
    qty_on_hand: commitNumberInput(fields.qty_on_hand),
    reorder_level: commitNumberInput(fields.reorder_level),
    cost_price: commitNumberInput(fields.cost_price),
    sell_price: commitNumberInput(fields.sell_price),
  }
}
