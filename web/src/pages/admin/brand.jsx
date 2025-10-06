import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notify } from '@/lib/notify';
import { useConfirm } from '@/context/ConfirmContext';
import { buildFormData } from '@/lib/form-data';

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  logo: '',
  website: '',
  status: 'active',
  sortOrder: 0,
};

export default function AdminBrandsPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoInputKey, setLogoInputKey] = useState(0);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { items } = await api.get('/brands?limit=200&sort=sortOrder name');
      setItems(items || []);
    } catch (err) {
      const message = err.message || 'Failed to load brands';
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const createBrand = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.slug) delete payload.slug;
      const formData = buildFormData(payload, { logo: logoFile || undefined });
      await api.postForm('/brands', formData);
      setForm(EMPTY);
      setLogoFile(null);
      setLogoInputKey((k) => k + 1);
      notify.success('Brand created');
      await load();
    } catch (err) {
      notify.error(err.message || 'Failed to create brand');
    } finally {
      setSaving(false);
    }
  };

  const saveField = async (id, patch) => {
    try {
      await api.patch(`/brands/${id}`, patch);
      await load();
    } catch (err) {
      notify.error(err.message || 'Update failed');
    }
  };

  const removeBrand = async (id) => {
    const ok = await confirm('Delete this brand?', { description: 'Products linked to this brand will retain their association.' });
    if (!ok) return;
    try {
      await api.delete(`/brands/${id}`);
      notify.success('Brand removed');
      await load();
    } catch (err) {
      notify.error(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create brand</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createBrand} className="grid gap-3 md:grid-cols-2" encType="multipart/form-data">
            <input
              className="h-10 rounded-md border bg-background px-3"
              placeholder="Name *"
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              required
            />
            <input
              className="h-10 rounded-md border bg-background px-3"
              placeholder="Slug (optional)"
              value={form.slug}
              onChange={(event) => updateForm('slug', event.target.value)}
            />
            <input
              className="h-10 rounded-md border bg-background px-3 md:col-span-2"
              placeholder="Logo URL"
              value={form.logo}
              onChange={(event) => updateForm('logo', event.target.value)}
            />
            <div className="flex flex-col gap-1 text-sm md:col-span-2">
              <label className="font-medium">Upload logo</label>
              <input
                key={logoInputKey}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setLogoFile(file);
                }}
                className="text-xs"
              />
              {logoFile && <span className="text-muted-foreground">Selected: {logoFile.name}</span>}
            </div>
            <input
              className="h-10 rounded-md border bg-background px-3 md:col-span-2"
              placeholder="Website"
              value={form.website}
              onChange={(event) => updateForm('website', event.target.value)}
            />
            <textarea
              className="min-h-[80px] rounded-md border bg-background px-3 py-2 md:col-span-2"
              placeholder="Description"
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="h-10 rounded-md border bg-background px-3"
                value={form.status}
                onChange={(event) => updateForm('status', event.target.value)}
              >
                <option value="active">active</option>
                <option value="draft">draft</option>
              </select>
              <input
                type="number"
                className="h-10 w-32 rounded-md border bg-background px-3"
                placeholder="Sort"
                value={form.sortOrder}
                onChange={(event) => updateForm('sortOrder', Number(event.target.value || 0))}
              />
            </div>
            <div className="md:col-span-2">
              <Button disabled={saving}>{saving ? 'Saving…' : 'Create brand'}</Button>
            </div>
            {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brands</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && !error && !items.length && <p className="text-sm text-muted-foreground">No brands yet.</p>}

          {!loading && !error && items.length > 0 && (
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
                  {items.map((brand) => (
                    <tr key={brand._id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        {brand.logo ? (
                          <img src={brand.logo} alt="" className="h-8 w-8 rounded object-cover border" />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 pr-3 font-medium">{brand.name}</td>
                      <td className="py-2 pr-3">{brand.slug}</td>
                      <td className="py-2 pr-3">
                        <select
                          className="h-8 rounded-md border bg-background px-2"
                          value={brand.status}
                          onChange={(event) => saveField(brand._id, { status: event.target.value })}
                        >
                          <option value="active">active</option>
                          <option value="draft">draft</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          className="h-8 w-20 rounded-md border bg-background px-2"
                          defaultValue={brand.sortOrder ?? 0}
                          onBlur={(event) => saveField(brand._id, { sortOrder: Number(event.target.value || 0) })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={() => removeBrand(brand._id)}>
                            Delete
                          </Button>
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
  );
}
