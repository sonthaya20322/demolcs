import type { Category, IssueOrder, IssueOrderItem, Product, StockMovement } from './types'

function id(): string {
  return crypto.randomUUID()
}

type SeedProduct = {
  category: string
  sku: string
  name: string
  unit: string
  qty_on_hand: number
  reorder_level: number
  cost_price: number
  sell_price: number
}

const PRODUCT_DEFS: SeedProduct[] = [
  { category: 'ท่อยาง / ยาง', sku: 'HS-010', name: 'ท่อยางหม้อน้ำ 16 มม.', unit: 'ม้วน', qty_on_hand: 12, reorder_level: 5, cost_price: 85, sell_price: 140 },
  { category: 'ท่อยาง / ยาง', sku: 'HS-011', name: 'ท่อยางหม้อน้ำ 20 มม.', unit: 'ม้วน', qty_on_hand: 8, reorder_level: 5, cost_price: 95, sell_price: 155 },
  { category: 'ท่อยาง / ยาง', sku: 'HS-020', name: 'สายยางเบรก (เมตร)', unit: 'ม้วน', qty_on_hand: 4, reorder_level: 3, cost_price: 120, sell_price: 210 },
  { category: 'ท่อยาง / ยาง', sku: 'HS-030', name: 'ซีลยางฝาครอบวาล์ว', unit: 'ชิ้น', qty_on_hand: 25, reorder_level: 10, cost_price: 35, sell_price: 65 },
  { category: 'ท่อยาง / ยาง', sku: 'HS-040', name: 'ปะเก็นยางออยล์แพน', unit: 'ชิ้น', qty_on_hand: 18, reorder_level: 8, cost_price: 45, sell_price: 80 },
  { category: 'ท่อยาง / ยาง', sku: 'HS-050', name: 'คลิปยึดท่อยาง 12–16', unit: 'ชิ้น', qty_on_hand: 2, reorder_level: 10, cost_price: 8, sell_price: 18 },
  { category: 'น็อต / สกรู', sku: 'BT-M6', name: 'น็อตหัวเหลี่ยม M6', unit: 'ชิ้น', qty_on_hand: 200, reorder_level: 50, cost_price: 1.5, sell_price: 3 },
  { category: 'น็อต / สกรู', sku: 'BT-M8', name: 'น็อตหัวเหลี่ยม M8', unit: 'ชิ้น', qty_on_hand: 180, reorder_level: 50, cost_price: 2, sell_price: 4 },
  { category: 'น็อต / สกรู', sku: 'BT-M10', name: 'น็อตหัวเหลี่ยม M10', unit: 'ชิ้น', qty_on_hand: 40, reorder_level: 40, cost_price: 3, sell_price: 6 },
  { category: 'น็อต / สกรู', sku: 'BT-M12', name: 'น็อตหัวเหลี่ยม M12', unit: 'ชิ้น', qty_on_hand: 3, reorder_level: 20, cost_price: 4, sell_price: 8 },
  { category: 'น็อต / สกรู', sku: 'BT-W8', name: 'แหวนอัด M8', unit: 'ชิ้น', qty_on_hand: 150, reorder_level: 40, cost_price: 0.8, sell_price: 2 },
  { category: 'น็อต / สกรู', sku: 'BT-SC6', name: 'สกรูหัวจม M6x20', unit: 'ชิ้น', qty_on_hand: 90, reorder_level: 30, cost_price: 1.2, sell_price: 2.5 },
  { category: 'เครื่องมือ', sku: 'TL-001', name: 'ประแจรวม 10 มม.', unit: 'ชิ้น', qty_on_hand: 15, reorder_level: 5, cost_price: 45, sell_price: 89 },
  { category: 'เครื่องมือ', sku: 'TL-002', name: 'ประแจรวม 12 มม.', unit: 'ชิ้น', qty_on_hand: 14, reorder_level: 5, cost_price: 48, sell_price: 95 },
  { category: 'เครื่องมือ', sku: 'TL-010', name: 'ชุดลูกบล็อก 1/2"', unit: 'ชุด', qty_on_hand: 6, reorder_level: 3, cost_price: 650, sell_price: 990 },
  { category: 'เครื่องมือ', sku: 'TL-020', name: 'คีมล็อกปากตรง', unit: 'ชิ้น', qty_on_hand: 10, reorder_level: 4, cost_price: 120, sell_price: 199 },
  { category: 'เครื่องมือ', sku: 'TL-030', name: 'ไขควงแฉก #2', unit: 'ชิ้น', qty_on_hand: 22, reorder_level: 8, cost_price: 35, sell_price: 69 },
  { category: 'เครื่องมือ', sku: 'TL-040', name: 'ประแจถอดไส้กรอง', unit: 'ชิ้น', qty_on_hand: 4, reorder_level: 3, cost_price: 160, sell_price: 280 },
  { category: 'น้ำมัน / ของเหลว', sku: 'FL-001', name: 'น้ำมันเครื่อง 5W-30 (ลิตร)', unit: 'ลิตร', qty_on_hand: 36, reorder_level: 12, cost_price: 95, sell_price: 160 },
  { category: 'น้ำมัน / ของเหลว', sku: 'FL-002', name: 'น้ำมันเกียร์ ATF', unit: 'ลิตร', qty_on_hand: 20, reorder_level: 8, cost_price: 110, sell_price: 185 },
  { category: 'น้ำมัน / ของเหลว', sku: 'FL-010', name: 'น้ำยาหล่อเย็นเขียว', unit: 'ลิตร', qty_on_hand: 15, reorder_level: 6, cost_price: 70, sell_price: 120 },
  { category: 'น้ำมัน / ของเหลว', sku: 'FL-020', name: 'น้ำมันเบรก DOT4', unit: 'ขวด', qty_on_hand: 9, reorder_level: 5, cost_price: 85, sell_price: 145 },
  { category: 'น้ำมัน / ของเหลว', sku: 'FL-030', name: 'จารบีแบริ่ง', unit: 'กระปุก', qty_on_hand: 11, reorder_level: 4, cost_price: 60, sell_price: 110 },
  { category: 'น้ำมัน / ของเหลว', sku: 'FL-040', name: 'น้ำยาล้างคาร์บู', unit: 'กระป๋อง', qty_on_hand: 2, reorder_level: 5, cost_price: 55, sell_price: 95 },
  { category: 'ไส้กรอง', sku: 'FT-001', name: 'ไส้กรองอากาศเก๋ง', unit: 'ชิ้น', qty_on_hand: 16, reorder_level: 6, cost_price: 120, sell_price: 220 },
  { category: 'ไส้กรอง', sku: 'FT-002', name: 'ไส้กรองอากาศกระบะ', unit: 'ชิ้น', qty_on_hand: 10, reorder_level: 5, cost_price: 150, sell_price: 260 },
  { category: 'ไส้กรอง', sku: 'FT-010', name: 'ไส้กรองน้ำมันเครื่อง', unit: 'ชิ้น', qty_on_hand: 28, reorder_level: 10, cost_price: 55, sell_price: 99 },
  { category: 'ไส้กรอง', sku: 'FT-020', name: 'ไส้กรองน้ำมันเชื้อเพลิง', unit: 'ชิ้น', qty_on_hand: 12, reorder_level: 5, cost_price: 90, sell_price: 160 },
  { category: 'ไส้กรอง', sku: 'FT-030', name: 'ไส้กรองแอร์ Cabin', unit: 'ชิ้น', qty_on_hand: 7, reorder_level: 4, cost_price: 130, sell_price: 240 },
  { category: 'ไฟฟ้า / แบตเตอรี่', sku: 'EL-001', name: 'แบตเตอรี่ 12V 60Ah', unit: 'ลูก', qty_on_hand: 5, reorder_level: 3, cost_price: 1800, sell_price: 2650 },
  { category: 'ไฟฟ้า / แบตเตอรี่', sku: 'EL-002', name: 'แบตเตอรี่ 12V 80Ah', unit: 'ลูก', qty_on_hand: 3, reorder_level: 2, cost_price: 2400, sell_price: 3450 },
  { category: 'ไฟฟ้า / แบตเตอรี่', sku: 'EL-010', name: 'หัวเทียน Iridium', unit: 'ชิ้น', qty_on_hand: 24, reorder_level: 8, cost_price: 180, sell_price: 320 },
  { category: 'ไฟฟ้า / แบตเตอรี่', sku: 'EL-020', name: 'ฟิวส์ใบมีด 15A', unit: 'ชิ้น', qty_on_hand: 80, reorder_level: 20, cost_price: 5, sell_price: 12 },
  { category: 'ไฟฟ้า / แบตเตอรี่', sku: 'EL-030', name: 'สายพานไดชาร์จ', unit: 'เส้น', qty_on_hand: 8, reorder_level: 4, cost_price: 220, sell_price: 380 },
  { category: 'ไฟฟ้า / แบตเตอรี่', sku: 'EL-040', name: 'รีเลย์ไฟเลี้ยว', unit: 'ชิ้น', qty_on_hand: 1, reorder_level: 3, cost_price: 95, sell_price: 170 },
  { category: 'อะไหล่มอเตอร์ไซค์', sku: 'BK-001', name: 'โซ่ขับ 428H', unit: 'เส้น', qty_on_hand: 9, reorder_level: 4, cost_price: 280, sell_price: 450 },
  { category: 'อะไหล่มอเตอร์ไซค์', sku: 'BK-002', name: 'สเตอร์หน้า 14T', unit: 'ชิ้น', qty_on_hand: 12, reorder_level: 5, cost_price: 90, sell_price: 160 },
  { category: 'อะไหล่มอเตอร์ไซค์', sku: 'BK-003', name: 'สเตอร์หลัง 42T', unit: 'ชิ้น', qty_on_hand: 10, reorder_level: 4, cost_price: 180, sell_price: 310 },
  { category: 'อะไหล่มอเตอร์ไซค์', sku: 'BK-010', name: 'ผ้าเบรกหน้ามอไซค์', unit: 'คู่', qty_on_hand: 14, reorder_level: 6, cost_price: 95, sell_price: 175 },
  { category: 'อะไหล่มอเตอร์ไซค์', sku: 'BK-011', name: 'ผ้าเบรกหลังมอไซค์', unit: 'คู่', qty_on_hand: 13, reorder_level: 6, cost_price: 85, sell_price: 155 },
  { category: 'อะไหล่มอเตอร์ไซค์', sku: 'BK-020', name: 'ไส้กรองอากาศมอไซค์', unit: 'ชิ้น', qty_on_hand: 18, reorder_level: 8, cost_price: 70, sell_price: 130 },
  { category: 'อะไหล่มอเตอร์ไซค์', sku: 'BK-030', name: 'น้ำมันเครื่อง 2T', unit: 'ลิตร', qty_on_hand: 22, reorder_level: 8, cost_price: 80, sell_price: 140 },
  { category: 'อะไหล่มอเตอร์ไซค์', sku: 'BK-040', name: 'ยางใน 275-17', unit: 'เส้น', qty_on_hand: 6, reorder_level: 4, cost_price: 110, sell_price: 190 },
  { category: 'อะไหล่มอเตอร์ไซค์', sku: 'BK-050', name: 'สายคันเร่งมอไซค์', unit: 'เส้น', qty_on_hand: 8, reorder_level: 3, cost_price: 65, sell_price: 120 },
  { category: 'อะไหล่มอเตอร์ไซค์', sku: 'BK-060', name: 'หลอดไฟหน้า LED H4', unit: 'ชิ้น', qty_on_hand: 11, reorder_level: 5, cost_price: 150, sell_price: 280 },
]

const CATEGORY_NAMES = [
  'ท่อยาง / ยาง',
  'น็อต / สกรู',
  'เครื่องมือ',
  'น้ำมัน / ของเหลว',
  'ไส้กรอง',
  'ไฟฟ้า / แบตเตอรี่',
  'อะไหล่มอเตอร์ไซค์',
]

export function buildSeedData(session_id: string): {
  categories: Category[]
  products: Product[]
  movements: StockMovement[]
  orders: IssueOrder[]
  items: IssueOrderItem[]
} {
  const categories: Category[] = CATEGORY_NAMES.map((name, i) => ({
    id: id(),
    session_id,
    name,
    sort_order: i + 1,
  }))
  const byName = Object.fromEntries(categories.map((c) => [c.name, c.id]))

  const products: Product[] = PRODUCT_DEFS.map((d) => ({
    id: id(),
    session_id,
    sku: d.sku,
    name: d.name,
    category_id: byName[d.category] ?? null,
    unit: d.unit,
    qty_on_hand: d.qty_on_hand,
    reorder_level: d.reorder_level,
    cost_price: d.cost_price,
    sell_price: d.sell_price,
  }))
  const bySku = Object.fromEntries(products.map((p) => [p.sku, p]))

  const order1: IssueOrder = {
    id: id(),
    session_id,
    status: 'pending',
    ref_note: 'อ้างอิงงาน: เปลี่ยนถ่ายน้ำมันเก๋ง',
    created_at: new Date().toISOString(),
    completed_at: null,
  }
  const order2: IssueOrder = {
    id: id(),
    session_id,
    status: 'picking',
    ref_note: 'ทะเบียน กข-1234 (มอไซค์)',
    created_at: new Date().toISOString(),
    completed_at: null,
  }

  const items: IssueOrderItem[] = [
    { id: id(), issue_order_id: order1.id, product_id: bySku['FT-010'].id, qty_requested: 2, qty_issued: 0 },
    { id: id(), issue_order_id: order1.id, product_id: bySku['FL-001'].id, qty_requested: 4, qty_issued: 0 },
    { id: id(), issue_order_id: order1.id, product_id: bySku['BT-M8'].id, qty_requested: 6, qty_issued: 0 },
    { id: id(), issue_order_id: order2.id, product_id: bySku['BK-010'].id, qty_requested: 1, qty_issued: 0 },
    { id: id(), issue_order_id: order2.id, product_id: bySku['BK-001'].id, qty_requested: 1, qty_issued: 0 },
  ]

  const movements: StockMovement[] = ['FL-001', 'BT-M6', 'FT-010'].map((sku) => ({
    id: id(),
    session_id,
    product_id: bySku[sku].id,
    type: 'receive' as const,
    qty: 10,
    ref_type: 'seed',
    ref_id: null,
    note: 'รับเข้าตั้งต้น demo',
    created_at: new Date().toISOString(),
  }))

  return {
    categories,
    products,
    movements,
    orders: [order1, order2],
    items,
  }
}
