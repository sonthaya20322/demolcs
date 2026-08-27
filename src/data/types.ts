export type DemoMode = 'cloud' | 'local'

export type IssueStatus = 'pending' | 'picking' | 'completed' | 'cancelled'
export type MovementType = 'receive' | 'issue'

export interface Category {
  id: string
  session_id: string
  name: string
  sort_order: number
}

export interface Product {
  id: string
  session_id: string
  sku: string
  name: string
  category_id: string | null
  unit: string
  qty_on_hand: number
  reorder_level: number
  cost_price: number
  sell_price: number
}

export interface StockMovement {
  id: string
  session_id: string
  product_id: string
  type: MovementType
  qty: number
  ref_type: string | null
  ref_id: string | null
  note: string | null
  created_at: string
}

export interface IssueOrderItem {
  id: string
  issue_order_id: string
  product_id: string
  qty_requested: number
  qty_issued: number
  product?: Product
}

export interface IssueOrder {
  id: string
  session_id: string
  status: IssueStatus
  ref_note: string | null
  created_at: string
  completed_at: string | null
  items?: IssueOrderItem[]
}

export interface ReceiveItemInput {
  product_id: string
  qty: number
  note?: string
}

export interface CreateIssueInput {
  ref_note?: string
  items: { product_id: string; qty: number }[]
}

export interface ProductInput {
  sku: string
  name: string
  category_id: string | null
  unit: string
  qty_on_hand: number
  reorder_level: number
  cost_price: number
  sell_price: number
}

export interface CategoryInput {
  name: string
  sort_order?: number
}

export interface DashboardSummary {
  lowStockCount: number
  pendingIssueCount: number
  completedTodayCount: number
  receiveTodayQty: number
  issueTodayQty: number
  lowStockProducts: Product[]
  recentMovements: (StockMovement & { product_name?: string; product_sku?: string })[]
  openIssues: IssueOrder[]
}

export interface DailyReport {
  date: string
  completedOrders: number
  cancelledOrders: number
  openOrders: number
  issueLineCount: number
  totalIssuedQty: number
  totalReceivedQty: number
  movements: (StockMovement & { product_name?: string; product_sku?: string })[]
  completedIssueOrders: IssueOrder[]
}

export interface DemoRepository {
  listCategories(): Promise<Category[]>
  createCategory(input: CategoryInput): Promise<Category>
  listProducts(): Promise<Product[]>
  createProduct(input: ProductInput): Promise<Product>
  updateProduct(id: string, input: Partial<ProductInput>): Promise<Product>
  listMovements(limit?: number): Promise<(StockMovement & { product_name?: string; product_sku?: string })[]>
  receiveStock(items: ReceiveItemInput[]): Promise<void>
  listIssueOrders(): Promise<IssueOrder[]>
  createIssueOrder(input: CreateIssueInput): Promise<IssueOrder>
  updateIssueStatus(orderId: string, status: Exclude<IssueStatus, 'completed'>): Promise<void>
  completeIssueOrder(orderId: string): Promise<void>
  getDashboard(): Promise<DashboardSummary>
  getDailyReport(dateIso?: string): Promise<DailyReport>
  reset(): Promise<string>
  touch(): Promise<void>
}
