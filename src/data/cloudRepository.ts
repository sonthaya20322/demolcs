import { getSupabase } from '../lib/supabase'
import { isSameLocalDay } from './stockLogic'
import type {
  Category,
  CategoryInput,
  CreateIssueInput,
  DailyReport,
  DashboardSummary,
  DemoRepository,
  IssueOrder,
  IssueStatus,
  Product,
  ProductInput,
  ReceiveItemInput,
  StockMovement,
} from './types'

function requireClient() {
  const sb = getSupabase()
  if (!sb) throw new Error('SUPABASE_NOT_CONFIGURED')
  return sb
}

export function createCloudRepository(sessionRef: { id: string }): DemoRepository {
  const sid = () => sessionRef.id

  return {
    async listCategories() {
      const { data, error } = await requireClient()
        .from('categories')
        .select('*')
        .eq('session_id', sid())
        .order('sort_order')
      if (error) throw error
      return data as Category[]
    },

    async createCategory(input: CategoryInput) {
      const { data, error } = await requireClient()
        .from('categories')
        .insert({
          session_id: sid(),
          name: input.name,
          sort_order: input.sort_order ?? 99,
        })
        .select()
        .single()
      if (error) throw error
      return data as Category
    },

    async listProducts() {
      const { data, error } = await requireClient()
        .from('products')
        .select('*')
        .eq('session_id', sid())
        .order('sku')
      if (error) throw error
      return (data as Product[]).map(normalizeProduct)
    },

    async createProduct(input: ProductInput) {
      const { data, error } = await requireClient()
        .from('products')
        .insert({ session_id: sid(), ...input })
        .select()
        .single()
      if (error) throw error
      return normalizeProduct(data as Product)
    },

    async updateProduct(id, input) {
      const { data, error } = await requireClient()
        .from('products')
        .update(input)
        .eq('id', id)
        .eq('session_id', sid())
        .select()
        .single()
      if (error) throw error
      return normalizeProduct(data as Product)
    },

    async listMovements(limit = 50) {
      const { data, error } = await requireClient()
        .from('stock_movements')
        .select('*, products(name, sku)')
        .eq('session_id', sid())
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []).map(mapMovement)
    },

    async receiveStock(items: ReceiveItemInput[]) {
      const { error } = await requireClient().rpc('receive_stock', {
        p_session_id: sid(),
        p_items: items,
      })
      if (error) throw error
    },

    async listIssueOrders() {
      const { data, error } = await requireClient()
        .from('issue_orders')
        .select('*, issue_order_items(*, products(*))')
        .eq('session_id', sid())
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(mapOrder)
    },

    async createIssueOrder(input: CreateIssueInput) {
      const sb = requireClient()
      const { data: order, error } = await sb
        .from('issue_orders')
        .insert({
          session_id: sid(),
          status: 'pending',
          ref_note: input.ref_note ?? null,
        })
        .select()
        .single()
      if (error) throw error

      const rows = input.items.map((it) => ({
        issue_order_id: order.id,
        product_id: it.product_id,
        qty_requested: it.qty,
        qty_issued: 0,
      }))
      const { error: itemErr } = await sb.from('issue_order_items').insert(rows)
      if (itemErr) throw itemErr

      const orders = await this.listIssueOrders()
      const found = orders.find((o) => o.id === order.id)
      if (!found) throw new Error('ORDER_NOT_FOUND')
      return found
    },

    async updateIssueStatus(orderId, status: Exclude<IssueStatus, 'completed'>) {
      const { error } = await requireClient()
        .from('issue_orders')
        .update({ status })
        .eq('id', orderId)
        .eq('session_id', sid())
      if (error) throw error
    },

    async completeIssueOrder(orderId) {
      const { error } = await requireClient().rpc('complete_issue_order', {
        p_order_id: orderId,
        p_session_id: sid(),
      })
      if (error) throw error
    },

    async getDashboard(): Promise<DashboardSummary> {
      const [products, orders, movements] = await Promise.all([
        this.listProducts(),
        this.listIssueOrders(),
        this.listMovements(30),
      ])
      const lowStockProducts = products.filter((p) => p.qty_on_hand <= p.reorder_level)
      const openIssues = orders.filter((o) => o.status === 'pending' || o.status === 'picking')
      const completedTodayCount = orders.filter(
        (o) => o.status === 'completed' && o.completed_at && isSameLocalDay(o.completed_at),
      ).length
      const todayMoves = movements.filter((m) => isSameLocalDay(m.created_at))
      return {
        lowStockCount: lowStockProducts.length,
        pendingIssueCount: openIssues.length,
        completedTodayCount,
        receiveTodayQty: todayMoves.filter((m) => m.type === 'receive').reduce((s, m) => s + m.qty, 0),
        issueTodayQty: todayMoves.filter((m) => m.type === 'issue').reduce((s, m) => s + m.qty, 0),
        lowStockProducts: lowStockProducts.slice(0, 8),
        recentMovements: movements.slice(0, 8),
        openIssues: openIssues.slice(0, 8),
      }
    },

    async getDailyReport(dateIso?: string): Promise<DailyReport> {
      const day = dateIso ? new Date(dateIso) : new Date()
      const [orders, movements] = await Promise.all([this.listIssueOrders(), this.listMovements(200)])
      const dayMoves = movements.filter((m) => isSameLocalDay(m.created_at, day))
      const completedIssueOrders = orders.filter(
        (o) => o.status === 'completed' && o.completed_at && isSameLocalDay(o.completed_at, day),
      )
      return {
        date: formatDateKey(day),
        completedOrders: completedIssueOrders.length,
        cancelledOrders: orders.filter((o) => o.status === 'cancelled' && isSameLocalDay(o.created_at, day)).length,
        openOrders: orders.filter((o) => o.status === 'pending' || o.status === 'picking').length,
        issueLineCount: dayMoves.filter((m) => m.type === 'issue').length,
        totalIssuedQty: dayMoves.filter((m) => m.type === 'issue').reduce((s, m) => s + m.qty, 0),
        totalReceivedQty: dayMoves.filter((m) => m.type === 'receive').reduce((s, m) => s + m.qty, 0),
        movements: dayMoves,
        completedIssueOrders,
      }
    },

    async reset() {
      const { data, error } = await requireClient().rpc('reset_demo_session', {
        p_session_id: sid(),
      })
      if (error) throw error
      sessionRef.id = data as string
      return sessionRef.id
    },

    async touch() {
      const { error } = await requireClient().rpc('touch_demo_session', {
        p_session_id: sid(),
      })
      if (error) throw error
    },
  }
}

function normalizeProduct(p: Product): Product {
  return {
    ...p,
    qty_on_hand: Number(p.qty_on_hand),
    reorder_level: Number(p.reorder_level),
    cost_price: Number(p.cost_price),
    sell_price: Number(p.sell_price),
  }
}

function mapMovement(row: Record<string, unknown>): StockMovement & {
  product_name?: string
  product_sku?: string
} {
  const products = row.products as { name?: string; sku?: string } | null
  return {
    id: row.id as string,
    session_id: row.session_id as string,
    product_id: row.product_id as string,
    type: row.type as StockMovement['type'],
    qty: Number(row.qty),
    ref_type: (row.ref_type as string) ?? null,
    ref_id: (row.ref_id as string) ?? null,
    note: (row.note as string) ?? null,
    created_at: row.created_at as string,
    product_name: products?.name,
    product_sku: products?.sku,
  }
}

function mapOrder(row: Record<string, unknown>): IssueOrder {
  const itemsRaw = (row.issue_order_items as Record<string, unknown>[]) ?? []
  return {
    id: row.id as string,
    session_id: row.session_id as string,
    status: row.status as IssueStatus,
    ref_note: (row.ref_note as string) ?? null,
    created_at: row.created_at as string,
    completed_at: (row.completed_at as string) ?? null,
    items: itemsRaw.map((it) => {
      const product = it.products as Product | null
      return {
        id: it.id as string,
        issue_order_id: it.issue_order_id as string,
        product_id: it.product_id as string,
        qty_requested: Number(it.qty_requested),
        qty_issued: Number(it.qty_issued),
        product: product ? normalizeProduct(product) : undefined,
      }
    }),
  }
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function createCloudSessionWithRetry(retries = 2): Promise<string> {
  const sb = requireClient()
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await sb.rpc('create_demo_session')
      if (error) throw error
      return data as string
    } catch (err) {
      lastError = err
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
    }
  }
  throw lastError
}

export async function sessionStillValid(sessionId: string): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return false
  const { data, error } = await sb
    .from('demo_sessions')
    .select('id, expires_at')
    .eq('id', sessionId)
    .maybeSingle()
  if (error || !data) return false
  return new Date(data.expires_at).getTime() > Date.now()
}
