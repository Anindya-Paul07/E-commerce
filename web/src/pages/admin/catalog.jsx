import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notify } from '@/lib/notify';

const NEW_PRODUCT_TEMPLATE = {
  name: '',
  brand: '',
  description: '',
  status: 'draft',
  moderationState: 'pending',
  lifecycle: 'active',
  attributes: [{ key: '', value: '' }],
  variants: [
    {
      sku: '',
      title: '',
      status: 'draft',
      currency: 'USD',
      listPrice: '',
      compareAtPrice: '',
    },
  ],
};

const clone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

function toAttrArray(map = {}) {
  if (!map || typeof map !== 'object') return [];
  return Object.entries(map).map(([key, value]) => ({ key, value: String(value ?? '') }));
}

function toAttrObject(list = []) {
  return list
    .filter((item) => item.key)
    .reduce((acc, item) => {
      acc[item.key] = item.value ?? '';
      return acc;
    }, {});
}

function normalizeVariantForPayload(variant) {
  return {
    sku: variant.sku?.trim(),
    title: variant.title?.trim() || undefined,
    status: variant.status || 'draft',
    barcode: variant.barcode?.trim() || undefined,
    options: variant.options || {},
    attributes: variant.attributes || {},
    metadata: variant.metadata || {},
    pricing: {
      currency: variant.currency || 'USD',
      listPrice: Number(variant.listPrice),
      compareAtPrice:
        variant.compareAtPrice === '' || variant.compareAtPrice == null
          ? null
          : Number(variant.compareAtPrice),
    },
  };
}

export default function AdminCatalogPage() {
  const [products, setProducts] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [query, setQuery] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [productDetail, setProductDetail] = useState(null);
  const [variantForms, setVariantForms] = useState([]);

  const [newProduct, setNewProduct] = useState(clone(NEW_PRODUCT_TEMPLATE));
  const [creating, setCreating] = useState(false);

  const selectedProductName = useMemo(() => {
    if (!productDetail) return '';
    return productDetail.name;
  }, [productDetail]);

  async function fetchProducts(search = '') {
    setLoadingList(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search.trim()) params.set('q', search.trim());
      const data = await api.get(`/admin/catalog/products?${params.toString()}`);
      setProducts(data.items || []);
    } catch (error) {
      notify.error(error.message || 'Failed to load catalog');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function loadDetail(id) {
    setSelectedId(id);
    if (!id) {
      setProductDetail(null);
      setVariantForms([]);
      return;
    }
    setDetailLoading(true);
    try {
      const data = await api.get(`/admin/catalog/products/${id}`);
      const attr = toAttrArray(data.product?.attributes || {});
      const attributes = attr.length ? attr : [{ key: '', value: '' }];
      setProductDetail({ ...data.product, attributes });
      setVariantForms(
        (data.variants || []).map((item) => ({
          ...item,
          listPrice: item.pricing?.listPrice ?? '',
          compareAtPrice: item.pricing?.compareAtPrice ?? '',
          currency: item.pricing?.currency || 'USD',
        }))
      );
    } catch (error) {
      notify.error(error.message || 'Failed to load product detail');
    } finally {
      setDetailLoading(false);
    }
  }

  function updateProductField(field, value) {
    setProductDetail((prev) => ({ ...prev, [field]: value }));
  }

  function updateAttribute(idx, field, value) {
    setProductDetail((prev) => {
      const next = [...(prev?.attributes || [])];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, attributes: next };
    });
  }

  function addAttributeRow() {
    setProductDetail((prev) => ({ ...prev, attributes: [...(prev?.attributes || []), { key: '', value: '' }] }));
  }

  function removeAttribute(idx) {
    setProductDetail((prev) => {
      const next = [...(prev?.attributes || [])];
      next.splice(idx, 1);
      return { ...prev, attributes: next };
    });
  }

  async function saveProduct() {
    if (!productDetail?._id) return;
    try {
      const payload = {
        name: productDetail.name,
        description: productDetail.description,
        brand: productDetail.brand,
        status: productDetail.status,
        moderationState: productDetail.moderationState,
        lifecycle: productDetail.lifecycle,
        attributes: toAttrObject(productDetail.attributes),
      };
      await api.patch(`/admin/catalog/products/${productDetail._id}`, payload);
      notify.success('Catalog product updated');
      await fetchProducts(query);
    } catch (error) {
      notify.error(error.message || 'Failed to update product');
    }
  }

  function updateVariantField(idx, field, value) {
    setVariantForms((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  async function saveVariant(idx) {
    const variant = variantForms[idx];
    if (!variant?._id) return;
    try {
      const payload = {
        sku: variant.sku,
        status: variant.status,
        pricing: {
          currency: variant.currency,
          listPrice: Number(variant.listPrice),
          compareAtPrice:
            variant.compareAtPrice === '' || variant.compareAtPrice == null
              ? null
              : Number(variant.compareAtPrice),
        },
        title: variant.title,
      };
      await api.patch(`/admin/catalog/variants/${variant._id}`, payload);
      notify.success('Variant updated');
      await loadDetail(productDetail._id);
    } catch (error) {
      notify.error(error.message || 'Failed to update variant');
    }
  }

  async function deleteVariant(id) {
    if (!id) return;
    if (!window.confirm('Remove this variant?')) return;
    try {
      await api.delete(`/admin/catalog/variants/${id}`);
      notify.success('Variant removed');
      await loadDetail(productDetail._id);
    } catch (error) {
      notify.error(error.message || 'Failed to delete variant');
    }
  }

  function updateNewProduct(path, value) {
    setNewProduct((prev) => ({ ...prev, [path]: value }));
  }

  function updateNewAttribute(idx, field, value) {
    setNewProduct((prev) => {
      const next = [...prev.attributes];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, attributes: next };
    });
  }

function addNewAttributeRow() {
  setNewProduct((prev) => ({ ...prev, attributes: [...prev.attributes, { key: '', value: '' }] }));
}

function removeNewAttribute(idx) {
  setNewProduct((prev) => {
    const next = [...prev.attributes];
    next.splice(idx, 1);
    return { ...prev, attributes: next.length ? next : [{ key: '', value: '' }] };
  });
}

  function addVariantRow() {
    setNewProduct((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { sku: '', title: '', status: 'draft', currency: 'USD', listPrice: '', compareAtPrice: '' },
      ],
    }));
  }

  function updateNewVariant(idx, field, value) {
    setNewProduct((prev) => {
      const next = [...prev.variants];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, variants: next };
    });
  }

  function removeNewVariant(idx) {
    setNewProduct((prev) => {
      const next = [...prev.variants];
      next.splice(idx, 1);
      return { ...prev, variants: next.length ? next : clone(NEW_PRODUCT_TEMPLATE).variants };
    });
  }

  async function createProduct(evt) {
    evt.preventDefault();
    setCreating(true);
    try {
      const payload = {
        name: newProduct.name,
        brand: newProduct.brand,
        description: newProduct.description,
        status: newProduct.status,
        moderationState: newProduct.moderationState,
        lifecycle: newProduct.lifecycle,
        attributes: toAttrObject(newProduct.attributes),
        variants: newProduct.variants.map(normalizeVariantForPayload),
      };
      payload.variants = payload.variants.filter((variant) => variant.sku && Number.isFinite(variant.pricing.listPrice));
      if (!payload.name) throw new Error('Name is required');
      if (!payload.variants.length) throw new Error('At least one variant with price is required');
      await api.post('/admin/catalog/products', payload);
      notify.success('Catalog product created');
      setNewProduct(clone(NEW_PRODUCT_TEMPLATE));
      await fetchProducts(query);
    } catch (error) {
      notify.error(error.message || 'Failed to create product');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catalog products</h1>
          <p className="text-sm text-muted-foreground">
            Manage master catalog attributes and SKU pricing before sellers list products.
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            fetchProducts(query);
          }}
          className="flex gap-2"
        >
          <input
            type="search"
            placeholder="Search catalog"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 rounded-md border bg-background px-3"
          />
          <Button type="submit" variant="outline" disabled={loadingList}>
            Search
          </Button>
        </form>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="max-h-[75vh] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Catalog items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 overflow-y-auto">
            {loadingList && <div className="text-sm text-muted-foreground">Loading catalog…</div>}
            {!loadingList && !products.length && (
              <div className="text-sm text-muted-foreground">No catalog products found</div>
            )}
            <div className="space-y-2">
              {products.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => loadDetail(item._id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted ${
                    item._id === selectedId ? 'border-primary bg-primary/10 text-primary' : ''
                  }`}
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.brand || 'Unknown brand'} • {item.variantCount || 0} variants
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create catalog product</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={createProduct}>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Name *</label>
                  <input
                    value={newProduct.name}
                    onChange={(event) => updateNewProduct('name', event.target.value)}
                    className="h-10 rounded-md border px-3"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Brand</label>
                  <input
                    value={newProduct.brand}
                    onChange={(event) => updateNewProduct('brand', event.target.value)}
                    className="h-10 rounded-md border px-3"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(event) => updateNewProduct('description', event.target.value)}
                    className="min-h-[80px] rounded-md border px-3 py-2"
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={newProduct.status}
                      onChange={(event) => updateNewProduct('status', event.target.value)}
                      className="h-10 rounded-md border px-3"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Moderation</label>
                    <select
                      value={newProduct.moderationState}
                      onChange={(event) => updateNewProduct('moderationState', event.target.value)}
                      className="h-10 rounded-md border px-3"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Lifecycle</label>
                    <select
                      value={newProduct.lifecycle}
                      onChange={(event) => updateNewProduct('lifecycle', event.target.value)}
                      className="h-10 rounded-md border px-3"
                    >
                      <option value="active">Active</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Attributes</span>
                    <Button type="button" variant="outline" size="sm" onClick={addNewAttributeRow}>
                      Add row
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newProduct.attributes.map((attr, idx) => (
                      <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                        <input
                          placeholder="Attribute key"
                          value={attr.key}
                          onChange={(event) => updateNewAttribute(idx, 'key', event.target.value)}
                          className="h-10 rounded-md border px-3"
                        />
                        <input
                          placeholder="Attribute value"
                          value={attr.value}
                          onChange={(event) => updateNewAttribute(idx, 'value', event.target.value)}
                          className="h-10 rounded-md border px-3"
                        />
                        <Button type="button" variant="ghost" onClick={() => removeNewAttribute(idx)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Variants</span>
                    <Button type="button" variant="outline" size="sm" onClick={addVariantRow}>
                      Add variant
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {newProduct.variants.map((variant, idx) => (
                      <div key={idx} className="rounded-md border p-3">
                        <div className="grid gap-2 md:grid-cols-2">
                          <input
                            placeholder="SKU *"
                            value={variant.sku}
                            onChange={(event) => updateNewVariant(idx, 'sku', event.target.value)}
                            className="h-10 rounded-md border px-3"
                          />
                          <input
                            placeholder="Title"
                            value={variant.title}
                            onChange={(event) => updateNewVariant(idx, 'title', event.target.value)}
                            className="h-10 rounded-md border px-3"
                          />
                          <input
                            placeholder="List price *"
                            value={variant.listPrice}
                            onChange={(event) => updateNewVariant(idx, 'listPrice', event.target.value)}
                            className="h-10 rounded-md border px-3"
                          />
                          <input
                            placeholder="Compare at price"
                            value={variant.compareAtPrice}
                            onChange={(event) => updateNewVariant(idx, 'compareAtPrice', event.target.value)}
                            className="h-10 rounded-md border px-3"
                          />
                          <select
                            value={variant.status}
                            onChange={(event) => updateNewVariant(idx, 'status', event.target.value)}
                            className="h-10 rounded-md border px-3"
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                          </select>
                          <select
                            value={variant.currency}
                            onChange={(event) => updateNewVariant(idx, 'currency', event.target.value)}
                            className="h-10 rounded-md border px-3"
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="BDT">BDT</option>
                          </select>
                        </div>
                        {newProduct.variants.length > 1 && (
                          <div className="mt-3 text-right">
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeNewVariant(idx)}>
                              Remove variant
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating…' : 'Create product'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="min-h-[320px]">
            <CardHeader>
              <CardTitle className="text-base">{selectedProductName || 'Select a product'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailLoading && <div className="text-sm text-muted-foreground">Loading product details…</div>}
              {!detailLoading && productDetail && (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Name</label>
                      <input
                        value={productDetail.name || ''}
                        onChange={(event) => updateProductField('name', event.target.value)}
                        className="h-10 rounded-md border px-3"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Brand</label>
                      <input
                        value={productDetail.brand || ''}
                        onChange={(event) => updateProductField('brand', event.target.value)}
                        className="h-10 rounded-md border px-3"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Status</label>
                      <select
                        value={productDetail.status || 'draft'}
                        onChange={(event) => updateProductField('status', event.target.value)}
                        className="h-10 rounded-md border px-3"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Moderation</label>
                      <select
                        value={productDetail.moderationState || 'pending'}
                        onChange={(event) => updateProductField('moderationState', event.target.value)}
                        className="h-10 rounded-md border px-3"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={productDetail.description || ''}
                      onChange={(event) => updateProductField('description', event.target.value)}
                      className="min-h-[80px] rounded-md border px-3 py-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Attributes</span>
                      <Button type="button" variant="outline" size="sm" onClick={addAttributeRow}>
                        Add attribute
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(productDetail.attributes || []).map((attr, idx) => (
                        <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                          <input
                            value={attr.key}
                            onChange={(event) => updateAttribute(idx, 'key', event.target.value)}
                            placeholder="Key"
                            className="h-10 rounded-md border px-3"
                          />
                          <input
                            value={attr.value}
                            onChange={(event) => updateAttribute(idx, 'value', event.target.value)}
                            placeholder="Value"
                            className="h-10 rounded-md border px-3"
                          />
                          <Button type="button" variant="ghost" onClick={() => removeAttribute(idx)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <Button type="button" onClick={saveProduct}>
                      Save product
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium">Variants</div>
                    {variantForms.length === 0 && (
                      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        No variants available.
                      </div>
                    )}
                    <div className="space-y-3">
                      {variantForms.map((variant, idx) => (
                        <div key={variant._id} className="rounded-md border p-3">
                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="grid gap-2">
                              <label className="text-xs text-muted-foreground">SKU</label>
                              <input
                                value={variant.sku || ''}
                                onChange={(event) => updateVariantField(idx, 'sku', event.target.value)}
                                className="h-10 rounded-md border px-3"
                              />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs text-muted-foreground">Title</label>
                              <input
                                value={variant.title || ''}
                                onChange={(event) => updateVariantField(idx, 'title', event.target.value)}
                                className="h-10 rounded-md border px-3"
                              />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs text-muted-foreground">List price</label>
                              <input
                                value={variant.listPrice}
                                onChange={(event) => updateVariantField(idx, 'listPrice', event.target.value)}
                                className="h-10 rounded-md border px-3"
                              />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs text-muted-foreground">Compare at</label>
                              <input
                                value={variant.compareAtPrice ?? ''}
                                onChange={(event) => updateVariantField(idx, 'compareAtPrice', event.target.value)}
                                className="h-10 rounded-md border px-3"
                              />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs text-muted-foreground">Status</label>
                              <select
                                value={variant.status || 'draft'}
                                onChange={(event) => updateVariantField(idx, 'status', event.target.value)}
                                className="h-10 rounded-md border px-3"
                              >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="retired">Retired</option>
                              </select>
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs text-muted-foreground">Currency</label>
                              <input
                                value={variant.currency || 'USD'}
                                onChange={(event) => updateVariantField(idx, 'currency', event.target.value)}
                                className="h-10 rounded-md border px-3"
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <Button type="button" variant="outline" size="sm" onClick={() => saveVariant(idx)}>
                              Save variant
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => deleteVariant(variant._id)}>
                              Delete variant
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
