import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminBrandsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ name: '', slug: '', description: '', logo: '', website: '', status: 'active', sortOrder: 0 })
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null) // id being edited

  async function load() {
    setLoading(true); setErr('')
    try {
      const { items } = await api.get('/brands?limit=200&sort=sortOrder name')
      setItems(items || [])
    } catch (e) { setErr(e.message || 'Failed to load brands') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function createBrand(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.slug) delete payload.slug
      await api.post('/brands', payload)
      setForm({ name: '', slug: '', description: '', logo: '', website: '', status: 'active', sortOrder: 0 })
      await load()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function saveEdit(id, patch) {
    try {
      await api.patch(`/brands/${id}`, patch)
      setEditing(null)
      await load()
    } catch (e) { alert(e.message) }
  }

  async function del(id) {
    if (!confirm('Delete this brand?')) return
    try {
      await api.delete(`/brands/${id}`)
      await load()
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-6">
      {/* New brand */}
      <Card>
        <CardHeader><CardTitle>Create brand</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createBrand} className="grid gap-3 md:grid-cols-2">
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Name *"
              value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} required />
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Slug (optional)"
              value={form.slug} onChange={e=>setForm(f=>({...f, slug:e.target.value}))} />
            <input className="h-10 rounded-md border bg-background px-3 md:col-span-2" placeholder="Logo URL"
              value={form.logo} onChange={e=>setForm(f=>({...f, logo:e.target.value}))} />
            <input className="h-10 rounded-md border bg-background px-3 md:col-span-2" placeholder="Website"
              value={form.website} onChange={e=>setForm(f=>({...f, website:e.target.value}))} />
            <textarea className="min-h-[80px] rounded-md border bg-background px-3 py-2 md:col-span-2" placeholder="Description"
              value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} />
            <div className="flex gap-3 items-center">
              <select className="h-10 rounded-md border bg-background px-3"
                value={form.status} onChange={e=>setForm(f=>({...f, status:e.target.value}))}>
                <option value="active">active</option>
                <option value="draft">draft</option>
              </select>
              <input type="number" className="h-10 w-32 rounded-md border bg-background px-3" placeholder="Sort"
                value={form.sortOrder} onChange={e=>setForm(f=>({...f, sortOrder:Number(e.target.value||0)}))} />
            </div>
            <div className="md:col-span-2">
              <Button disabled={saving}>{saving ? 'Saving…' : 'Create brand'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader><CardTitle>Brands</CardTitle></CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {err && <p className="text-sm text-red-600">{err}</p>}
          {!loading && !err && !items.length && <p className="text-sm text-muted-foreground">No brands yet.</p>}

          {!loading && !err && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Logo</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Slug</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Sort</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(b => (
                    <tr key={b._id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        {b.logo ? <img src={b.logo} alt="" className="h-8 w-8 rounded object-cover border" /> : '—'}
                      </td>
                      <td className="py-2 pr-3">
                        {editing === b._id ? (
                          <input className="h-8 rounded-md border bg-background px-2 default:outline-none"
                            defaultValue={b.name}
                            onBlur={(e)=>saveEdit(b._id, { name: e.target.value })}
                            autoFocus />
                        ) : b.name}
                      </td>
                      <td className="py-2 pr-3">{b.slug}</td>
                      <td className="py-2 pr-3">
                        <select className="h-8 rounded-md border bg-background px-2"
                          value={b.status}
                          onChange={(e)=>saveEdit(b._id, { status: e.target.value })}>
                          <option value="active">active</option>
                          <option value="draft">draft</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" className="h-8 w-20 rounded-md border bg-background px-2"
                          defaultValue={b.sortOrder ?? 0}
                          onBlur={(e)=>saveEdit(b._id, { sortOrder: Number(e.target.value||0) })} />
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={()=>setEditing(b._id)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={()=>del(b._id)}>Delete</Button>
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
