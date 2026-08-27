import { applyIssue, isSameLocalDay } from './stockLogic'
import type {
  Category,
  CreateIssueInput,
  DailyReport,
  DashboardSummary,
  DemoRepository,
  IssueOrder,
  IssueOrderItem,
  IssueStatus,
  Product,
  ProductInput,
  CategoryInput,
  ReceiveItemInput,
  StockMovement,
} from './types'
import { buildSeedData } from './seedData'

const STORAGE_KEY = 'demodainamo_local_db_v1'

export interface LocalDb {
  session_id: string
  created_at: string
  last_active_at: string
  expires_at: string
  categories: Category[]
  products: Product[]
  movements: StockMovement[]
  orders: IssueOrder[]
  items: IssueOrderItem[]
}

function uid(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

function plusHours(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString()
}

export function createFreshLocalDb(): LocalDb {
  const session_id = uid()
  const seed = buildSeedData(session_id)
  const created = nowIso()
  return {
    session_id,
    created_at: created,
    last_active_at: created,
    expires_at: plusHours(24),
    ...seed,
  }
}

export function loadLocalDb(): LocalDb | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LocalDb
  } catch {
    return null
  }
}

export function saveLocalDb(db: LocalDb): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function clearLocalDb(): void {
  localStorage.removeItem(STORAGE_KEY)
}

function touchDb(db: LocalDb): void {
  db.last_active_at = nowIso()
  db.expires_at = plusHours(24)
}

function withProduct(
  items: IssueOrderItem[],
  products: Product[],
): IssueOrderItem[] {
  return items.map((it) => ({
    ...it,
    product: products.find((p) => p.id === it.product_id),
  }))
}

export function createLocalRepository(getDb: () => LocalDb, setDb: (db: LocalDb) => void): DemoRepository {
  const mutate = (fn: (db: LocalDb) => void) => {
    const db = getDb()
    touchDb(db)
    fn(db)
    setDb(db)
  }

  return {
    async listCategories() {
      return [...getDb().categories].sort((a, b) => a.sort_order - b.sort_order)
    },

    async createCategory(input: CategoryInput) {
      let created!: Category
      mutate((db) => {
        created = {
          id: uid(),
          session_id: db.session_id,
          name: input.name,
          sort_order: input.sort_order ?? db.categories.length + 1,
        }
        db.categories.push(created)
      })
      return created
    },

    async listProducts() {
      return [...getDb().products].sort((a, b) => a.sku.localeCompare(b.sku))
    },

    async createProduct(input: ProductInput) {
      let created!: Product
      mutate((db) => {
        created = { id: uid(), session_id: db.session_id, ...input }
        db.products.push(created)
      })
      return created
    },

    async updateProduct(id, input) {
      let updated!: Product
      mutate((db) => {
        const idx = db.products.findIndex((p) => p.id === id)
        if (idx < 0) throw new Error('PRODUCT_NOT_FOUND')
        db.products[idx] = { ...db.products[idx], ...input }
        updated = db.products[idx]
      })
      return updated
    },

    async listMovements(limit = 50) {
      const db = getDb()
      return [...db.movements]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit)
        .map((m) => {
          const p = db.products.find((x) => x.id === m.product_id)
          return { ...m, product_name: p?.name, product_sku: p?.sku }
        })
    },

    async receiveStock(items: ReceiveItemInput[]) {
      mutate((db) => {
        for (const item of items) {
          const p = db.products.find((x) => x.id === item.product_id)
          if (!p) throw new Error('PRODUCT_NOT_FOUND')
          if (item.qty <= 0) throw new Error('INVALID_QTY')
          p.qty_on_hand += item.qty
          db.movements.push({
            id: uid(),
            session_id: db.session_id,
            product_id: p.id,
            type: 'receive',
            qty: item.qty,
            ref_type: 'receive',
            ref_id: null,
            note: item.note ?? 'รับเข้าสินค้า',
            created_at: nowIso(),
          })
        }
      })
    },

    async listIssueOrders() {
      const db = getDb()
      return [...db.orders]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((o) => ({
          ...o,
          items: withProduct(
            db.items.filter((i) => i.issue_order_id === o.id),
            db.products,
          ),
        }))
    },

    async createIssueOrder(input: CreateIssueInput) {
      let created!: IssueOrder
      mutate((db) => {
        if (!input.items.length) throw new Error('EMPTY_ITEMS')
        created = {
          id: uid(),
          session_id: db.session_id,
          status: 'pending',
          ref_note: input.ref_note ?? null,
          created_at: nowIso(),
          completed_at: null,
        }
        db.orders.push(created)
        for (const it of input.items) {
          if (it.qty <= 0) throw new Error('INVALID_QTY')
          if (!db.products.some((p) => p.id === it.product_id)) {
            throw new Error('PRODUCT_NOT_FOUND')
          }
          db.items.push({
            id: uid(),
            issue_order_id: created.id,
            product_id: it.product_id,
            qty_requested: it.qty,
            qty_issued: 0,
          })
        }
      })
      const items = getDb().items.filter((i) => i.issue_order_id === created.id)
      return { ...created, items: withProduct(items, getDb().products) }
    },

    async updateIssueStatus(orderId, status: Exclude<IssueStatus, 'completed'>) {
      mutate((db) => {
        const o = db.orders.find((x) => x.id === orderId)
        if (!o) throw new Error('ORDER_NOT_FOUND')
        if (o.status === 'completed') throw new Error('ORDER_NOT_COMPLETABLE')
        o.status = status
      })
    },

    async completeIssueOrder(orderId) {
      mutate((db) => {
        const o = db.orders.find((x) => x.id === orderId)
        if (!o || !['pending', 'picking'].includes(o.status)) {
          throw new Error('ORDER_NOT_COMPLETABLE')
        }
        const lines = db.items.filter((i) => i.issue_order_id === orderId)
        for (const line of lines) {
          const p = db.products.find((x) => x.id === line.product_id)
          if (!p) throw new Error('PRODUCT_NOT_FOUND')
          p.qty_on_hand = applyIssue(p.qty_on_hand, line.qty_requested)
          line.qty_issued = line.qty_requested
          db.movements.push({
            id: uid(),
            session_id: db.session_id,
            product_id: p.id,
            type: 'issue',
            qty: line.qty_requested,
            ref_type: 'issue_order',
            ref_id: orderId,
            note: 'เบิกสำเร็จ',
            created_at: nowIso(),
          })
        }
        o.status = 'completed'
        o.completed_at = nowIso()
      })
    },

    async getDashboard(): Promise<DashboardSummary> {
      const db = getDb()
      const lowStockProducts = db.products.filter((p) => p.qty_on_hand <= p.reorder_level)
      const openIssues = db.orders.filter((o) => o.status === 'pending' || o.status === 'picking')
      const completedTodayCount = db.orders.filter(
        (o) => o.status === 'completed' && o.completed_at && isSameLocalDay(o.completed_at),
      ).length
      const todayMoves = db.movements.filter((m) => isSameLocalDay(m.created_at))
      const recentMovements = [...db.movements]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 8)
        .map((m) => {
          const p = db.products.find((x) => x.id === m.product_id)
          return { ...m, product_name: p?.name, product_sku: p?.sku }
        })

      return {
        lowStockCount: lowStockProducts.length,
        pendingIssueCount: openIssues.length,
        completedTodayCount,
        receiveTodayQty: todayMoves.filter((m) => m.type === 'receive').reduce((s, m) => s + m.qty, 0),
        issueTodayQty: todayMoves.filter((m) => m.type === 'issue').reduce((s, m) => s + m.qty, 0),
        lowStockProducts: lowStockProducts.slice(0, 8),
        recentMovements,
        openIssues: openIssues.map((o) => ({
          ...o,
          items: withProduct(db.items.filter((i) => i.issue_order_id === o.id), db.products),
        })),
      }
    },

    async getDailyReport(dateIso?: string): Promise<DailyReport> {
      const db = getDb()
      const day = dateIso ? new Date(dateIso) : new Date()
      const movements = db.movements
        .filter((m) => isSameLocalDay(m.created_at, day))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((m) => {
          const p = db.products.find((x) => x.id === m.product_id)
          return { ...m, product_name: p?.name, product_sku: p?.sku }
        })
      const completedIssueOrders = db.orders
        .filter((o) => o.status === 'completed' && o.completed_at && isSameLocalDay(o.completed_at, day))
        .map((o) => ({
          ...o,
          items: withProduct(db.items.filter((i) => i.issue_order_id === o.id), db.products),
        }))
      const cancelledOrders = db.orders.filter(
        (o) => o.status === 'cancelled' && isSameLocalDay(o.created_at, day),
      ).length
      const openOrders = db.orders.filter((o) => o.status === 'pending' || o.status === 'picking').length

      return {
        date: startDateKey(day),
        completedOrders: completedIssueOrders.length,
        cancelledOrders,
        openOrders,
        issueLineCount: movements.filter((m) => m.type === 'issue').length,
        totalIssuedQty: movements.filter((m) => m.type === 'issue').reduce((s, m) => s + m.qty, 0),
        totalReceivedQty: movements.filter((m) => m.type === 'receive').reduce((s, m) => s + m.qty, 0),
        movements,
        completedIssueOrders,
      }
    },

    async reset() {
      const fresh = createFreshLocalDb()
      setDb(fresh)
      return fresh.session_id
    },

    async touch() {
      mutate(() => undefined)
    },
  }
}

function startDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
