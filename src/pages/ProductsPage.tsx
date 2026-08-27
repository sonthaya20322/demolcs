import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CostRevealButton } from '../components/CostRevealButton'
import { StockPill } from '../components/StatusPill'
import type { Category, Product } from '../data/types'
import { formatMoney, formatQty, friendlyError } from '../lib/format'
import { useSession } from '../session/SessionContext'

const emptyForm = {
  sku: '',
  name: '',
  category_id: '',
  unit: 'ชิ้น',
  qty_on_hand: 0,
  reorder_level: 5,
  cost_price: 0,
  sell_price: 0,
}

export function ProductsPage() {
  const { repository, refreshKey, bump } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filterCat, setFilterCat] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [newCategory, setNewCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!repository) return
    let cancelled = false
    ;(async () => {
      try {
        const [p, c] = await Promise.all([repository.listProducts(), repository.listCategories()])
        if (!cancelled) {
          setProducts(p)
          setCategories(c)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(friendlyError(err))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [repository, refreshKey])

  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])

  const filtered = filterCat ? products.filter((p) => p.category_id === filterCat) : products

  async function onCreateProduct(e: FormEvent) {
    e.preventDefault()
    if (!repository) return
    setBusy(true)
    setError(null)
    try {
      await repository.createProduct({
        sku: form.sku.trim(),
        name: form.name.trim(),
        category_id: form.category_id || null,
        unit: form.unit.trim() || 'ชิ้น',
        qty_on_hand: Number(form.qty_on_hand),
        reorder_level: Number(form.reorder_level),
        cost_price: Number(form.cost_price),
        sell_price: Number(form.sell_price),
      })
      setForm(emptyForm)
      bump()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function onCreateCategory(e: FormEvent) {
    e.preventDefault()
    if (!repository || !newCategory.trim()) return
    setBusy(true)
    try {
      await repository.createCategory({ name: newCategory.trim() })
      setNewCategory('')
      bump()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>สินค้า</h1>
          <p>รายละเอียดสินค้าและหมวดหมู่ — รวมราคาขายและต้นทุน (ซ่อนได้)</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="panel">
        <h2 className="panel-title">เพิ่มสินค้า</h2>
        <form className="form-grid" onSubmit={onCreateProduct}>
          <div className="field">
            <label>รหัสสินค้า (SKU)</label>
            <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="field">
            <label>ชื่อสินค้า</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>หมวดหมู่</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">- ไม่ระบุ -</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>หน่วย</label>
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="field">
            <label>คงเหลือเริ่มต้น</label>
            <input
              type="number"
              min={0}
              step="any"
              value={form.qty_on_hand}
              onChange={(e) => setForm({ ...form, qty_on_hand: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>จุดเตือนใกล้หมด</label>
            <input
              type="number"
              min={0}
              step="any"
              value={form.reorder_level}
              onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>ราคาทุน</label>
            <input
              type="number"
              min={0}
              step="any"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>ราคาขาย</label>
            <input
              type="number"
              min={0}
              step="any"
              value={form.sell_price}
              onChange={(e) => setForm({ ...form, sell_price: Number(e.target.value) })}
            />
          </div>
          <div className="actions">
            <button className="btn" type="submit" disabled={busy}>
              บันทึกสินค้า
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2 className="panel-title">เพิ่มหมวดหมู่</h2>
        <form className="actions" onSubmit={onCreateCategory}>
          <input
            placeholder="ชื่อหมวด เช่น ผ้าเบรก"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button className="btn btn-secondary" type="submit" disabled={busy}>
            เพิ่มหมวด
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="page-header" style={{ marginBottom: '0.75rem' }}>
          <h2 className="panel-title" style={{ margin: 0 }}>
            รายการสินค้า ({filtered.length})
          </h2>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">ทุกหมวด</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table className="data table-dense">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อ</th>
                <th className="col-hide-sm">หมวด</th>
                <th className="col-hide-sm">หน่วย</th>
                <th>คงเหลือ</th>
                <th className="col-hide-sm">จุดเตือน</th>
                <th>ราคาขาย</th>
                <th className="col-hide-sm">ต้นทุน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td className="col-hide-sm">{p.category_id ? catName[p.category_id] : '-'}</td>
                  <td className="col-hide-sm">{p.unit}</td>
                  <td>{formatQty(p.qty_on_hand)}</td>
                  <td className="col-hide-sm">{formatQty(p.reorder_level)}</td>
                  <td>{formatMoney(p.sell_price)}</td>
                  <td className="col-hide-sm">
                    <CostRevealButton cost={p.cost_price} />
                  </td>
                  <td>
                    <StockPill qty={p.qty_on_hand} reorder={p.reorder_level} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
