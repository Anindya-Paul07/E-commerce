import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { Plus, Trash2 } from 'lucide-react'

const EMPTY_FORM = {
  id: '',
  code: '',
  description: '',
  status: 'active',
  discountType: 'percentage',
  discountValue: 10,
  minimumSubtotal: 0,
  maxRedemptions: '',
  perUserLimit: '',
  startAt: '',
  endAt: '',
}

export default function AdminCouponsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true)
      const { items: rows } = await api.get('/admin/coupons')
      setItems(rows || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCoupons()
  }, [loadCoupons])

  function startCreate() {
    setForm(EMPTY_FORM)
  }

  function startEdit(coupon) {
    setForm({
      id: coupon._id,
      code: coupon.code,
      description: coupon.description || '',
      status: coupon.status || 'active',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || 0,
      minimumSubtotal: coupon.minimumSubtotal ?? 0,
      maxRedemptions: coupon.maxRedemptions ?? '',
      perUserLimit: coupon.perUserLimit ?? '',
      startAt: coupon.startAt ? coupon.startAt.slice(0, 16) : '',
      endAt: coupon.endAt ? coupon.endAt.slice(0, 16) : '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = {
        code: form.code,
        description: form.description,
        status: form.status,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumSubtotal: Number(form.minimumSubtotal || 0),
        maxRedemptions: form.maxRedemptions === '' ? undefined : Number(form.maxRedemptions),
        perUserLimit: form.perUserLimit === '' ? undefined : Number(form.perUserLimit),
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
      }
      if (form.id) {
        await api.put(`/admin/coupons/${form.id}`, payload)
        notify.success('Coupon updated')
      } else {
        await api.post('/admin/coupons', payload)
        notify.success('Coupon created')
      }
      await loadCoupons()
      setForm(EMPTY_FORM)
    } catch (err) {
      notify.error(err.message || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this coupon?')) return
    try {
      await api.delete(`/admin/coupons/${id}`)
      notify.info('Coupon removed')
      await loadCoupons()
    } catch (err) {
      notify.error(err.message || 'Failed to delete coupon')
    }
  }

  const formTitle = form.id ? `Edit coupon ${form.code}` : 'Create coupon'

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Coupons</h1>
          <p className="text-sm text-muted-foreground">Manage promo codes and redemption rules.</p>
        </div>
        <Button onClick={startCreate} variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New coupon
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Existing coupons</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading coupons…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No coupons yet.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Value</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Redemptions</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((coupon) => (
                    <tr key={coupon._id} className="border-b last:border-none">
                      <td className="py-3 pr-4 font-semibold text-foreground">{coupon.code}</td>
                      <td className="py-3 pr-4 capitalize">{coupon.discountType}</td>
                      <td className="py-3 pr-4">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}</td>
                      <td className="py-3 pr-4 capitalize">{coupon.status}</td>
                      <td className="py-3 pr-4">{coupon.redemptionCount || 0}</td>
                      <td className="py-3 pr-0 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(coupon)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(coupon._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{formTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Coupon code</label>
                <input
                  className="h-9 rounded-md border bg-background px-3"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="WELCOME10"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Description</label>
                <textarea
                  className="min-h-[60px] rounded-md border bg-background px-3 py-2"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell admins what this coupon does"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border bg-background px-3"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Discount type</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border bg-background px-3"
                    value={form.discountType}
                    onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value }))}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Discount value</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 h-9 w-full rounded-md border bg-background px-3"
                    value={form.discountValue}
                    onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Minimum subtotal</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 h-9 w-full rounded-md border bg-background px-3"
                    value={form.minimumSubtotal}
                    onChange={(e) => setForm((prev) => ({ ...prev, minimumSubtotal: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Max redemptions</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 h-9 w-full rounded-md border bg-background px-3"
                    value={form.maxRedemptions}
                    onChange={(e) => setForm((prev) => ({ ...prev, maxRedemptions: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Per user limit</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 h-9 w-full rounded-md border bg-background px-3"
                    value={form.perUserLimit}
                    onChange={(e) => setForm((prev) => ({ ...prev, perUserLimit: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Starts at</label>
                  <input
                    type="datetime-local"
                    className="mt-1 h-9 w-full rounded-md border bg-background px-3"
                    value={form.startAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, startAt: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ends at</label>
                  <input
                    type="datetime-local"
                    className="mt-1 h-9 w-full rounded-md border bg-background px-3"
                    value={form.endAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, endAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {form.id && (
                  <Button type="button" variant="ghost" onClick={startCreate}>
                    Cancel edit
                  </Button>
                )}
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save coupon'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
