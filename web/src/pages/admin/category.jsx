import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notify } from '@/lib/notify'
import { useConfirm } from '@/context/useConfirm'
import { buildFormData } from '@/lib/form-data'

const EMPTY = {
  name: '', slug: '', description: '', image: '', parent: '', isActive: true, sortOrder: 0
}

function toPayload(f) {
  const p = {
    name: String(f.name || '').trim(),
    description: String(f.description || ''),
    image: String(f.image || ''),
    isActive: !!f.isActive,
    sortOrder: Number(f.sortOrder || 0),
  }
  const slug = String(f.slug || '').trim()
  if (slug) p.slug = slug
  const parent = String(f.parent || '').trim()
  if (parent) p.parent = parent // slug or ObjectId; backend resolves
  return p
}

export default function AdminCategoriesPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const confirm = useConfirm()

  async function load() {
    setLoading(true); setErr('')
    try {
      const { items } = await api.get('/categories?limit=200')
      setList(items || [])
    } catch (e) {
      const message = e.message || 'Failed to load'
      setErr(message)
      notify.error(message)
    }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const parentOptions = useMemo(
    () => [{ _id: '', name: '— Root —', slug: '' }, ...list],
    [list]
  )

  function onChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function onImageChange(event) {
    const file = event.target.files?.[0] || null
    setImageFile(file)
  }

  async function createCat(e) {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const payload = toPayload(form)
      if (!payload.name) throw new Error('Name is required')
      const formData = buildFormData(payload, { image: imageFile || undefined })
      await api.postForm('/categories', formData)
      setForm(EMPTY); setEditingId(null); setImageFile(null); setImageInputKey(k => k + 1)
      await load()
      notify.success('Category created')
    } catch (e) {
      const message = e.message || 'Create failed'
      setErr(message)
      notify.error(message)
    }
    finally { setSaving(false) }
  }

  function startEdit(item) {
    setEditingId(item._id)
    setForm({
      name: item.name || '',
      slug: item.slug || '',
      description: item.description || '',
      image: item.image || '',
      parent: item.parent || '',
      isActive: !!item.isActive,
      sortOrder: item.sortOrder ?? 0,
    })
    setImageFile(null)
    setImageInputKey(k => k + 1)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editingId) return
    setSaving(true); setErr('')
    try {
      const payload = toPayload(form)
      if (!payload.name) throw new Error('Name is required')
      const formData = buildFormData(payload, { image: imageFile || undefined })
      await api.patchForm(`/categories/${editingId}`, formData)
      setForm(EMPTY); setEditingId(null); setImageFile(null); setImageInputKey(k => k + 1)
      await load()
      notify.success('Category updated')
    } catch (e) {
      const message = e.message || 'Update failed'
      setErr(message)
      notify.error(message)
    }
    finally { setSaving(false) }
  }

  async function del(id) {
    const ok = await confirm('Delete this category?', { description: 'Categories in use must be reassigned before deletion.' })
    if (!ok) return
    setErr('')
    try {
      await api.delete(`/categories/${id}`)
      await load()
      notify.success('Category removed')
    }
    catch (e) {
      const message = e.message || 'Delete failed'
      setErr(message)
      notify.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">Organize your catalog. Nested categories supported.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{editingId ? 'Edit category' : 'New category'}</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={editingId ? saveEdit : createCat}
            className="grid gap-3 sm:grid-cols-2"
            encType="multipart/form-data"
          >
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Name" name="name" value={form.name} onChange={onChange} required />
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Slug (optional)" name="slug" value={form.slug} onChange={onChange} />
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Image URL (optional)" name="image" value={form.image} onChange={onChange} />
            <div className="flex flex-col gap-1 text-sm">
              <label className="font-medium">Upload image</label>
              <input
                key={imageInputKey}
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="text-xs"
              />
              {imageFile && <span className="text-muted-foreground">Selected: {imageFile.name}</span>}
            </div>
            <select className="h-10 rounded-md border bg-background px-3" name="parent" value={form.parent} onChange={onChange}>
              {parentOptions.map(p => (
                <option key={p._id || 'root'} value={p.slug || p._id}>{p.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange} /> Active
            </label>
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Sort order" name="sortOrder" type="number" value={form.sortOrder} onChange={onChange} />
            <textarea className="min-h-[80px] rounded-md border bg-background px-3 py-2 sm:col-span-2" placeholder="Description" name="description" value={form.description} onChange={onChange} />
            <div className="sm:col-span-2 flex gap-2">
              <Button disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create category'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY) }}>Cancel</Button>}
            </div>
            {err && <p className="sm:col-span-2 text-sm text-red-600">{err}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All categories</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Slug</th>
                    <th className="py-2 pr-3">Parent</th>
                    <th className="py-2 pr-3">Active</th>
                    <th className="py-2 pr-3">Sort</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(c => (
                    <tr key={c._id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{c.name}</td>
                      <td className="py-2 pr-3">{c.slug}</td>
                      <td className="py-2 pr-3">{parentOptions.find(p => (p._id === c.parent) || (p.slug && p.slug === c.parent))?.name || (c.parent ? String(c.parent) : '—')}</td>
                      <td className="py-2 pr-3">{c.isActive ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-3">{c.sortOrder ?? 0}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(c)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => del(c._id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr><td colSpan={6} className="py-4 text-muted-foreground">No categories yet — create your first one above.</td></tr>
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
