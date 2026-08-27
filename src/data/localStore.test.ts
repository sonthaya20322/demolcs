import { describe, expect, it } from 'vitest'
import { createFreshLocalDb, createLocalRepository } from './localStore'

describe('localRepository complete issue', () => {
  it('completes issue and reduces stock', async () => {
    let db = createFreshLocalDb()
    const repo = createLocalRepository(
      () => db,
      (next) => {
        db = next
      },
    )

    const products = await repo.listProducts()
    const target = products.find((p) => p.sku === 'FT-010')
    expect(target).toBeTruthy()
    const before = target!.qty_on_hand

    const order = await repo.createIssueOrder({
      ref_note: 'ทดสอบ',
      items: [{ product_id: target!.id, qty: 2 }],
    })

    await repo.completeIssueOrder(order.id)
    const afterProducts = await repo.listProducts()
    const after = afterProducts.find((p) => p.id === target!.id)!
    expect(after.qty_on_hand).toBe(before - 2)

    const orders = await repo.listIssueOrders()
    expect(orders.find((o) => o.id === order.id)?.status).toBe('completed')
  })

  it('blocks issue beyond on-hand', async () => {
    let db = createFreshLocalDb()
    const repo = createLocalRepository(
      () => db,
      (next) => {
        db = next
      },
    )
    const products = await repo.listProducts()
    const target = products.find((p) => p.sku === 'EL-040')!
    const order = await repo.createIssueOrder({
      items: [{ product_id: target.id, qty: target.qty_on_hand + 1 }],
    })
    await expect(repo.completeIssueOrder(order.id)).rejects.toThrow(/INSUFFICIENT_STOCK/)
  })
})
