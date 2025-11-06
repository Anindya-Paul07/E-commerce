import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notify } from '@/lib/notify'
import { useConfirm } from '@/context/useConfirm'

const EMPTY = {
  name: '',
  code: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  },
  contact: {
    name: '',
    phone: '',
    email: '',
  },
  notes: '',
  active: true,
  isDefault: false,
}

function flatten(warehouse) {
  return {
    ...warehouse,
    address: {
      line1: warehouse?.address?.line1 || '',
      line2: warehouse?.address?.line2 || '',
      city: warehouse?.address?.city || '',
      state: warehouse?.address?.state || '',
      postalCode: warehouse?.address?.postalCode || '',
      country: warehouse?.address?.country || 'US',
    },
    contact: {
      name: warehouse?.contact?.name || '',
      phone: warehouse?.contact?.phone || '',
      email: warehouse?.contact?.email || '',
    },
    notes: warehouse?.notes || '',
    active: warehouse?.active ?? true,
    isDefault: warehouse?.isDefault ?? false,
  }
}

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const confirm = useConfirm()

  const load = useMemo(() => async () => {
    setLoading(true); setError('')
    try {
      const { items } = await api.get('/warehouses?limit=200')
      setWarehouses(items || [])
    } catch (e) {
      setError(e.message || 'Failed to load warehouses')
      notify.error(e.message || 'Failed to load warehouses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function updateNested(path, value) {
    setForm(prev => {
      const next = { ...prev }
      const keys = path.split('.')
      let ref = next
      for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i]
        ref[key] = { ...(ref[key] || {}) }
        ref = ref[key]
      }
      ref[keys[keys.length - 1]] = value
      return next
    })
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target
    if (name.startsWith('address.') || name.startsWith('contact.')) {
      updateNested(name, value)
    } else if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (editingId) {
        const { warehouse } = await api.patch(`/warehouses/${editingId}`, form)
        setWarehouses(prev => prev.map(w => (w._id === editingId ? warehouse : w)))
        notify.success('Warehouse updated')
      } else {
        const { warehouse } = await api.post('/warehouses', form)
        setWarehouses(prev => [warehouse, ...prev])
        notify.success('Warehouse created')
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

  async function removeWarehouse(id) {
    const ok = await confirm('Delete warehouse?', { description: 'This will remove the warehouse from your network.' })
    if (!ok) return
    try {
      await api.delete(`/warehouses/${id}`)
      setWarehouses(prev => prev.filter(w => w._id !== id))
      notify.success('Warehouse removed')
    } catch (e) {
      notify.error(e.message || 'Delete failed')
    }
  }

  function startEdit(w) {
    setEditingId(w._id)
    setForm(flatten(w))
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-sm text-muted-foreground">Manage fulfilment locations and availability.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit warehouse' : 'New warehouse'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <input className="h-10 rounded-md border bg-background px-3" name="name" value={form.name} onChange={onChange} placeholder="Warehouse name" required />
            <input className="h-10 rounded-md border bg-background px-3" name="code" value={form.code} onChange={onChange} placeholder="Code" required />

            <input className="h-10 rounded-md border bg-background px-3" name="address.line1" value={form.address.line1} onChange={onChange} placeholder="Address line 1" />
            <input className="h-10 rounded-md border bg-background px-3" name="address.line2" value={form.address.line2} onChange={onChange} placeholder="Address line 2" />

            <input className="h-10 rounded-md border bg-background px-3" name="address.city" value={form.address.city} onChange={onChange} placeholder="City" />
            <input className="h-10 rounded-md border bg-background px-3" name="address.state" value={form.address.state} onChange={onChange} placeholder="State" />
            <input className="h-10 rounded-md border bg-background px-3" name="address.postalCode" value={form.address.postalCode} onChange={onChange} placeholder="Postal code" />
            <input className="h-10 rounded-md border bg-background px-3" name="address.country" value={form.address.country} onChange={onChange} placeholder="Country" />

            <input className="h-10 rounded-md border bg-background px-3" name="contact.name" value={form.contact.name} onChange={onChange} placeholder="Contact name" />
            <input className="h-10 rounded-md border bg-background px-3" name="contact.phone" value={form.contact.phone} onChange={onChange} placeholder="Contact phone" />
            <input className="h-10 rounded-md border bg-background px-3" name="contact.email" value={form.contact.email} onChange={onChange} placeholder="Contact email" />

            <textarea className="min-h-[80px] rounded-md border bg-background px-3 py-2 sm:col-span-2" name="notes" value={form.notes} onChange={onChange} placeholder="Notes" />

            <div className="flex gap-6 sm:col-span-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="active" checked={form.active} onChange={onChange} /> Active
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={onChange} /> Default fulfillment hub
              </label>
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <Button disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create warehouse'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>}
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All warehouses</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : warehouses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No warehouses yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Location</th>
                    <th className="py-2 pr-3">Contact</th>
                    <th className="py-2 pr-3">Active</th>
                    <th className="py-2 pr-3">Default</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map(w => (
                    <tr key={w._id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{w.name}</td>
                      <td className="py-2 pr-3">{w.code}</td>
                      <td className="py-2 pr-3">{[w?.address?.city, w?.address?.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="py-2 pr-3">{w?.contact?.name || '—'}</td>
                      <td className="py-2 pr-3">{w.active ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-3">{w.isDefault ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(w)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => removeWarehouse(w._id)}>Delete</Button>
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
