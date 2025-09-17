import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminWarehousesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [form, setForm] = useState({ name: '', code: '', country: 'US', active: true, isDefault: false })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true); setErr('')
    try {
      const { items } = await api.get('/warehouses?limit=200')
      setItems(items || [])
    } catch (e) { setErr(e.message || 'Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function createWh(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/warehouses', {
        name: form.name,
        code: form.code,
        address: { country: form.country },
        active: !!form.active,
        isDefault: !!form.isDefault,
      })
      setForm({ name: '', code: '', country: 'US', active: true, isDefault: false })
      await load()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function save(id, patch) {
    try { await api.patch(`/warehouses/${id}`, patch); await load() } catch (e) { alert(e.message) }
  }
  async function del(id) {
    if (!confirm('Delete this warehouse?')) return
    try { await api.delete(`/warehouses/${id}`); await load() } catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Warehouses</h1>
        <p className="text-sm text-muted-foreground">Manage locations for inventory.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>New warehouse</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createWh} className="grid gap-3 md:grid-cols-2">
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Name *" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} required />
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Code *" value={form.code} onChange={e=>setForm(f=>({...f, code:e.target.value}))} required />
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Country" value={form.country} onChange={e=>setForm(f=>({...f, country:e.target.value}))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={e=>setForm(f=>({...f, active:e.target.checked}))} /> Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={e=>setForm(f=>({...f, isDefault:e.target.checked}))} /> Default
            </label>
            <div className="md:col-span-2">
              <Button disabled={saving}>{saving ? 'Saving…' : 'Create warehouse'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All warehouses</CardTitle></CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {err && <p className="text-sm text-red-600">{err}</p>}
          {!loading && !err && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Country</th>
                    <th className="py-2 pr-3">Active</th>
                    <th className="py-2 pr-3">Default</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(w => (
                    <tr key={w._id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono">{w.code}</td>
                      <td className="py-2 pr-3">{w.name}</td>
                      <td className="py-2 pr-3">{w.address?.country || '—'}</td>
                      <td className="py-2 pr-3">
                        <input type="checkbox" checked={!!w.active} onChange={e=>save(w._id, { active: e.target.checked })} />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="checkbox" checked={!!w.isDefault} onChange={e=>save(w._id, { isDefault: e.target.checked })} />
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={()=>del(w._id)} disabled={w.isDefault}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={6} className="py-4 text-muted-foreground">No warehouses yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

