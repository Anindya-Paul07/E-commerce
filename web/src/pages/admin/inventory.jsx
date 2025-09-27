import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notify } from '@/lib/notify'
import { useConfirm } from '@/context/ConfirmContext'

const EMPTY = {
  product: '',
  warehouse: '',
  onHand: 0,
  reserved: 0,
  incoming: 0,
  safetyStock: 0,
  notes: '',
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const confirm = useConfirm()

  const loadOptions = useMemo(() => async () => {
    try {
      const [{ items: prodItems }, { items: whItems }] = await Promise.all([
        api.get('/products?limit=200'),
        api.get('/warehouses?limit=200'),
      ])
      setProducts(prodItems || [])
      setWarehouses(whItems || [])
    } catch (e) {
      notify.error(e.message || 'Failed to load products or warehouses')
    }
  }, [])

  const loadInventory = useMemo(() => async () => {
    setLoading(true); setError('')
    try {
      const { items } = await api.get('/inventory?limit=200')
      setInventory(items || [])
    } catch (e) {
      const message = e.message || 'Failed to load inventory'
      setError(message)
      notify.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOptions()
    loadInventory()
  }, [loadOptions, loadInventory])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'product' || name === 'warehouse' ? value : Number(value) }))
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { ...form }
      if (!payload.product || !payload.warehouse) {
        throw new Error('Select product and warehouse')
      }
      if (editingId) {
        const { inventory: updated } = await api.patch(`/inventory/${editingId}`, payload)
        setInventory(prev => prev.map(i => (i._id === editingId ? updated : i)))
        notify.success('Inventory updated')
      } else {
        const { inventory: created } = await api.post('/inventory', payload)
        setInventory(prev => [created, ...prev])
        notify.success('Inventory created')
      }
      setForm(EMPTY)
      setEditingId(null)
    } catch (e) {
      const message = e.message || 'Save failed'
      setError(message)
      notify.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    const ok = await confirm('Delete inventory record?', { description: 'This will remove stock tracking for this product/warehouse.' })
    if (!ok) return
    try {
      await api.del(`/inventory/${id}`)
      setInventory(prev => prev.filter(i => i._id !== id))
      notify.success('Inventory record deleted')
    } catch (e) {
      notify.error(e.message || 'Delete failed')
    }
  }

  function startEdit(entry) {
    setEditingId(entry._id)
    setForm({
      product: entry.product?._id || entry.product,
      warehouse: entry.warehouse?._id || entry.warehouse,
      onHand: entry.onHand ?? 0,
      reserved: entry.reserved ?? 0,
      incoming: entry.incoming ?? 0,
      safetyStock: entry.safetyStock ?? 0,
      notes: entry.notes || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Track stock across warehouses and products.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit inventory' : 'Assign inventory'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select className="h-10 rounded-md border bg-background px-3" name="product" value={form.product} onChange={onChange} required>
              <option value="">Select product</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
            <select className="h-10 rounded-md border bg-background px-3" name="warehouse" value={form.warehouse} onChange={onChange} required>
              <option value="">Select warehouse</option>
              {warehouses.map(w => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
            <input className="h-10 rounded-md border bg-background px-3" name="onHand" type="number" min={0} value={form.onHand} onChange={onChange} placeholder="On hand" required />
            <input className="h-10 rounded-md border bg-background px-3" name="reserved" type="number" min={0} value={form.reserved} onChange={onChange} placeholder="Reserved" />
            <input className="h-10 rounded-md border bg-background px-3" name="incoming" type="number" min={0} value={form.incoming} onChange={onChange} placeholder="Incoming" />
            <input className="h-10 rounded-md border bg-background px-3" name="safetyStock" type="number" min={0} value={form.safetyStock} onChange={onChange} placeholder="Safety stock" />

            <textarea className="min-h-[80px] rounded-md border bg-background px-3 py-2 sm:col-span-2 lg:col-span-3" name="notes" value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes" />

            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <Button disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Assign inventory'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>}
            </div>
            {error && <p className="sm:col-span-2 lg:col-span-3 text-sm text-red-600">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Inventory overview</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : inventory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inventory records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">Warehouse</th>
                    <th className="py-2 pr-3">On hand</th>
                    <th className="py-2 pr-3">Reserved</th>
                    <th className="py-2 pr-3">Incoming</th>
                    <th className="py-2 pr-3">Available</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(entry => (
                    <tr key={entry._id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{entry.product?.title || '—'}</td>
                      <td className="py-2 pr-3">{entry.warehouse?.name || '—'}</td>
                      <td className="py-2 pr-3">{entry.onHand}</td>
                      <td className="py-2 pr-3">{entry.reserved}</td>
                      <td className="py-2 pr-3">{entry.incoming}</td>
                      <td className="py-2 pr-3">{Math.max(0, entry.onHand - entry.reserved)}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(entry)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => remove(entry._id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
