import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const EMPTY = {
  title: '',
  slug: '',
  price: '',
  stock: '',
  brand: '',
  tags: '',
  description: '',
  images: [],
  _imageUrl: '',
  categoryIds: [], // NEW: selected category ObjectIds
}

function toPayload(src) {
  const payload = {
    title: String(src.title || '').trim(),
    description: String(src.description || ''),
    brand: String(src.brand || ''),
    price: Number(src.price),
    stock: Number(src.stock || 0),
    images: Array.isArray(src.images) ? src.images : [],
    categories: Array.isArray(src.categoryIds) ? src.categoryIds : [], // send ObjectIds
  }
  const tagsArr = String(src.tags || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  if (tagsArr.length) payload.tags = tagsArr
  const slug = String(src.slug || '').trim()
  if (slug) payload.slug = slug
  return payload
}

export default function AdminProductsPage() {
  const [list, setList] = useState([])
  const [categories, setCategories] = useState([])
  const [catLoading, setCatLoading] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)

  const catMap = useMemo(
    () => new Map(categories.map(c => [String(c._id), c])),
    [categories]
  )

  async function fetchCategories() {
    setCatLoading(true)
    try {
      const { items } = await api.get('/categories?limit=200')
      setCategories(items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setCatLoading(false)
    }
  }

  async function fetchList() {
    setLoading(true)
    setErr('')
    try {
      const { items } = await api.get('/products?limit=100&status=active&sort=-createdAt')
      setList(items || [])
    } catch (e) {
      setErr(e.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchList()
  }, [])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function addImageUrl() {
    const url = String(form._imageUrl || '').trim()
    if (!url) return
    setForm(prev => ({ ...prev, images: [...(prev.images || []), url], _imageUrl: '' }))
  }

  function removeImage(url) {
    setForm(prev => ({ ...prev, images: (prev.images || []).filter(u => u !== url) }))
  }

  function toggleCategory(id) {
    setForm(prev => {
      const set = new Set(prev.categoryIds || [])
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return { ...prev, categoryIds: Array.from(set) }
    })
  }

  async function createProduct(e) {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const payload = toPayload(form)
      if (!payload.title || !Number.isFinite(payload.price)) {
        throw new Error('Title and a valid price are required')
      }
      await api.post('/products', payload)
      setForm(EMPTY)
      await fetchList()
    } catch (e) {
      setErr(e.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(item) {
    setEditingId(item._id)
    setForm({
      title: item.title || '',
      slug: item.slug || '',
      price: item.price ?? '',
      stock: item.stock ?? '',
      brand: item.brand || '',
      tags: (item.tags || []).join(', '),
      description: item.description || '',
      images: item.images || [],
      _imageUrl: '',
      categoryIds: (item.categories || []).map(String), // array of ObjectIds (strings)
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editingId) return
    setSaving(true); setErr('')
    try {
      const payload = toPayload(form)
      if (!payload.title || !Number.isFinite(payload.price)) {
        throw new Error('Title and a valid price are required')
      }
      await api.patch(`/products/${editingId}`, payload)
      setEditingId(null)
      setForm(EMPTY)
      await fetchList()
    } catch (e) {
      setErr(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function del(id) {
    // eslint-disable-next-line no-alert
    if (!confirm('Delete this product?')) return
    setErr('')
    try {
      await api.del(`/products/${id}`)
      await fetchList()
    } catch (e) {
      setErr(e.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Create, categorize, update and remove products.</p>
        </div>
      </div>

      {/* Create / Edit */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit product' : 'New product'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingId ? saveEdit : createProduct} className="grid gap-3 sm:grid-cols-2">
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Title" name="title" value={form.title} onChange={onChange} required />
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Slug (optional)" name="slug" value={form.slug} onChange={onChange} />

            <input className="h-10 rounded-md border bg-background px-3" placeholder="Price" name="price" type="number" step="0.01" value={form.price} onChange={onChange} required />
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Stock" name="stock" type="number" value={form.stock} onChange={onChange} />

            <input className="h-10 rounded-md border bg-background px-3" placeholder="Brand" name="brand" value={form.brand} onChange={onChange} />
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Tags (comma separated)" name="tags" value={form.tags} onChange={onChange} />

            {/* Images (URLs) */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium">Images (URL)</label>
              <div className="flex gap-2">
                <input className="h-10 flex-1 rounded-md border bg-background px-3" placeholder="https://example.com/image.jpg" name="_imageUrl" value={form._imageUrl} onChange={onChange} />
                <Button type="button" onClick={addImageUrl}>Add</Button>
              </div>
              <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-4">
                {(form.images || []).map(url => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="h-28 w-full object-cover rounded-md border" />
                    <Button type="button" size="sm" variant="destructive" className="absolute right-2 top-2 h-7 px-2" onClick={() => removeImage(url)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium">Categories</label>
              {catLoading ? (
                <p className="text-xs text-muted-foreground">Loading categories…</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {categories.map(c => {
                    const id = String(c._id)
                    const checked = form.categoryIds.includes(id)
                    return (
                      <label key={id} className="flex items-center gap-2 rounded-md border p-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(id)}
                        />
                        <span className="text-sm">{c.name}</span>
                      </label>
                    )
                  })}
                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">No categories yet. Create some in <span className="font-medium">Admin &gt; Categories</span>.</p>
                  )}
                </div>
              )}
            </div>

            <textarea className="min-h-[80px] rounded-md border bg-background px-3 py-2 sm:col-span-2" placeholder="Description" name="description" value={form.description} onChange={onChange} />

            <div className="sm:col-span-2 flex gap-2">
              <Button disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}</Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY) }}>
                  Cancel
                </Button>
              )}
            </div>

            {err && <p className="sm:col-span-2 text-sm text-red-600">{err}</p>}
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader><CardTitle>All products</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Price</th>
                    <th className="py-2 pr-3">Stock</th>
                    <th className="py-2 pr-3">Slug</th>
                    <th className="py-2 pr-3">Categories</th>
                    <th className="py-2 pr-3">Image</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(item => (
                    <tr key={item._id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{item.title}</td>
                      <td className="py-2 pr-3">${Number(item.price).toFixed(2)}</td>
                      <td className="py-2 pr-3">{item.stock}</td>
                      <td className="py-2 pr-3">{item.slug}</td>
                      <td className="py-2 pr-3">
                        {(item.categories || []).length
                          ? (item.categories || []).map(id => catMap.get(String(id))?.name || '—').join(', ')
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 pr-3">
                        {item.images?.[0]
                          ? (<img src={item.images[0]} alt="" className="h-12 w-12 object-cover rounded-md border" />)
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(item)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => del(item._id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-4 text-muted-foreground">No products yet — create your first one above.</td>
                    </tr>
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
