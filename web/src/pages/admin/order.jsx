import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STATUS = ['pending','paid','shipped','delivered','canceled']

export default function AdminOrdersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function load() {
    setLoading(true); setErr('')
    try {
      const q = statusFilter ? `?status=${statusFilter}` : ''
      const { items } = await api.get(`/orders${q}`)
      setItems(items || [])
    } catch (e) { setErr(e.message || 'Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [statusFilter])

  async function updateStatus(id, status) {
    try {
      const { order } = await api.patch(`/orders/${id}/status`, { status })
      setItems(prev => prev.map(o => o._id === id ? order : o))
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Manage and fulfill orders.</p>
        </div>
        <select className="h-10 rounded-md border bg-background px-3" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          err ? <p className="text-sm text-red-600">{err}</p> :
          !items.length ? <p className="text-sm text-muted-foreground">No orders yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Order #</th>
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Items</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(o => (
                    <tr key={o._id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{o.number}</td>
                      <td className="py-2 pr-3">{o.shippingAddress?.fullName || '—'}</td>
                      <td className="py-2 pr-3">{o.items?.reduce((s,i)=>s+i.qty,0)} items</td>
                      <td className="py-2 pr-3">${Number(o.total ?? o.subtotal).toFixed(2)}</td>
                      <td className="py-2 pr-3 capitalize">{o.status}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          {STATUS.map(s => (
                            <Button key={s} size="sm" variant={o.status===s?'default':'outline'} onClick={()=>updateStatus(o._id, s)}>
                              {s}
                            </Button>
                          ))}
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
