<<<<<<< HEAD
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const TABS = ['Receive', 'Adjust', 'Transfer', 'Ledger']

export default function AdminInventory() {
  const [tab, setTab] = useState('Receive')

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <div className="inline-flex rounded-md border bg-background p-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-8 rounded px-3 text-sm ${tab === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Receive' && <ReceiveForm />}
      {tab === 'Adjust' && <AdjustForm />}
      {tab === 'Transfer' && <TransferForm />}
      {tab === 'Ledger' && <Ledger />}
=======
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notify } from '@/lib/notify';

const RECEIVE_DEFAULT = { qty: 0, warehouseCode: '', reason: 'receive' };
const ADJUST_DEFAULT = { qty: 0, warehouseCode: '', reason: 'adjust' };

export default function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [levels, setLevels] = useState([]);
  const [levelLoading, setLevelLoading] = useState(false);
  const [receiveForm, setReceiveForm] = useState(RECEIVE_DEFAULT);
  const [adjustForm, setAdjustForm] = useState(ADJUST_DEFAULT);
  const [lowStock, setLowStock] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [{ items: prodItems }, { items: whItems }, { items: low } ] = await Promise.all([
          api.get('/products?limit=200&status=active&sort=title'),
          api.get('/warehouses'),
          api.get('/inventory/low-stock'),
        ]);
        setProducts(prodItems || []);
        setWarehouses(whItems || []);
        setLowStock(low || []);
      } catch (err) {
        notify.error(err.message || 'Failed to load inventory metadata');
      }
    })();
  }, []);

  const fetchLevels = async (productId) => {
    if (!productId) {
      setLevels([]);
      return;
    }
    setLevelLoading(true);
    setError('');
    try {
      const { levels } = await api.get(`/inventory/levels/${productId}`);
      setLevels(levels || []);
    } catch (err) {
      setError(err.message || 'Failed to load stock levels');
      setLevels([]);
    } finally {
      setLevelLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      fetchLevels(selectedProduct);
    } else {
      setLevels([]);
    }
  }, [selectedProduct]);

  const onReceive = async (event) => {
    event.preventDefault();
    if (!selectedProduct || !receiveForm.qty) return;
    try {
      await api.post('/inventory/receive', {
        productIdOrSlug: selectedProduct,
        qty: Number(receiveForm.qty),
        warehouseCode: receiveForm.warehouseCode || undefined,
        reason: receiveForm.reason || 'receive',
      });
      notify.success('Stock received');
      setReceiveForm(RECEIVE_DEFAULT);
      await fetchLevels(selectedProduct);
      const refreshed = await api.get('/inventory/low-stock');
      setLowStock(refreshed.items || []);
    } catch (err) {
      notify.error(err.message || 'Failed to receive stock');
    }
  };

  const onAdjust = async (event) => {
    event.preventDefault();
    if (!selectedProduct || !adjustForm.qty) return;
    try {
      await api.post('/inventory/adjust', {
        productIdOrSlug: selectedProduct,
        qty: Number(adjustForm.qty),
        warehouseCode: adjustForm.warehouseCode || undefined,
        reason: adjustForm.reason || 'adjust',
      });
      notify.success('Inventory adjusted');
      setAdjustForm(ADJUST_DEFAULT);
      await fetchLevels(selectedProduct);
      const refreshed = await api.get('/inventory/low-stock');
      setLowStock(refreshed.items || []);
    } catch (err) {
      notify.error(err.message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory Control</h1>
        <p className="text-sm text-muted-foreground">Monitor stock across warehouses, receive new items, and adjust physical counts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select product</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            className="h-10 w-full sm:w-96 rounded-md border bg-background px-3"
            value={selectedProduct}
            onChange={(event) => setSelectedProduct(event.target.value)}
          >
            <option value="">Choose a product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.title}
              </option>
            ))}
          </select>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </CardContent>
      </Card>

      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Per-warehouse levels</CardTitle>
          </CardHeader>
          <CardContent>
            {levelLoading ? (
              <p className="text-sm text-muted-foreground">Loading stock levels…</p>
            ) : !levels.length ? (
              <p className="text-sm text-muted-foreground">No inventory records yet for this product.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="py-2 pr-3">Warehouse</th>
                      <th className="py-2 pr-3">Variant</th>
                      <th className="py-2 pr-3">On hand</th>
                      <th className="py-2 pr-3">Reserved</th>
                      <th className="py-2 pr-3">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((level) => (
                      <tr key={`${level.warehouse?.code}-${level.variant?.sku}`} className="border-b last:border-0">
                        <td className="py-2 pr-3">{level.warehouse?.name || level.warehouse?.code || '—'}</td>
                        <td className="py-2 pr-3">{level.variant?.sku || 'Default'}</td>
                        <td className="py-2 pr-3">{level.qtyOnHand}</td>
                        <td className="py-2 pr-3">{level.qtyReserved}</td>
                        <td className="py-2 pr-3">{level.qtyAvailable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedProduct && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Receive stock</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onReceive} className="grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={1}
                    className="h-10 rounded-md border bg-background px-3"
                    placeholder="Quantity"
                    value={receiveForm.qty}
                    onChange={(event) => setReceiveForm((prev) => ({ ...prev, qty: event.target.value }))}
                    required
                  />
                  <select
                    className="h-10 rounded-md border bg-background px-3"
                    value={receiveForm.warehouseCode}
                    onChange={(event) => setReceiveForm((prev) => ({ ...prev, warehouseCode: event.target.value }))}
                  >
                    <option value="">Default warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w.code}>{w.code}</option>
                    ))}
                  </select>
                </div>
                <input
                  className="h-10 rounded-md border bg-background px-3"
                  placeholder="Reason"
                  value={receiveForm.reason}
                  onChange={(event) => setReceiveForm((prev) => ({ ...prev, reason: event.target.value }))}
                />
                <Button>Receive</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adjust stock</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onAdjust} className="grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    className="h-10 rounded-md border bg-background px-3"
                    placeholder="Adjustment (use negative to remove)"
                    value={adjustForm.qty}
                    onChange={(event) => setAdjustForm((prev) => ({ ...prev, qty: event.target.value }))}
                    required
                  />
                  <select
                    className="h-10 rounded-md border bg-background px-3"
                    value={adjustForm.warehouseCode}
                    onChange={(event) => setAdjustForm((prev) => ({ ...prev, warehouseCode: event.target.value }))}
                  >
                    <option value="">Default warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w.code}>{w.code}</option>
                    ))}
                  </select>
                </div>
                <input
                  className="h-10 rounded-md border bg-background px-3"
                  placeholder="Reason"
                  value={adjustForm.reason}
                  onChange={(event) => setAdjustForm((prev) => ({ ...prev, reason: event.target.value }))}
                />
                <Button>Adjust</Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                Provide negative values to decrease on-hand counts. Adjustments respect available inventory and will fail if insufficient stock exists.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Low stock alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {!lowStock.length ? (
            <p className="text-sm text-muted-foreground">No low-stock items detected.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left">
                  <tr>
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3">Warehouse</th>
                    <th className="py-2 pr-3">Available</th>
                    <th className="py-2 pr-3">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((row) => (
                    <tr key={`${row.variant?.sku}-${row.warehouse?.code}`} className="border-b last:border-0">
                      <td className="py-2 pr-3">{row.variant?.sku || '—'}</td>
                      <td className="py-2 pr-3">{row.warehouse?.code || '—'}</td>
                      <td className="py-2 pr-3">{row.qtyAvailable ?? 0}</td>
                      <td className="py-2 pr-3">{row.lowStockThreshold ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
>>>>>>> 0eec417 (added moderinazation.)
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function Input(props) {
  return <input {...props} className={`h-9 w-full rounded-md border bg-background px-3 ${props.className || ''}`} />
}

function Select(props) {
  return <select {...props} className={`h-9 w-full rounded-md border bg-background px-3 ${props.className || ''}`} />
}

/* -------------------- Receive -------------------- */

function ReceiveForm() {
  const [product, setProduct] = useState('')         // id or slug
  const [qty, setQty] = useState(0)
  const [warehouseCode, setWarehouseCode] = useState('')
  const [reason, setReason] = useState('receive')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      await api.post('/inventory/receive', {
        productIdOrSlug: product.trim(),
        qty: Number(qty),
        warehouseCode: warehouseCode.trim() || undefined,
        reason: reason.trim() || undefined
      })
      setMsg('Stock received successfully.')
      setQty(0); // keep product for multiple receives
    } catch (e) {
      setMsg(e.message || 'Failed to receive stock')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Receive stock</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-xl">
          <Field label="Product (ID or slug)">
            <Input value={product} onChange={e=>setProduct(e.target.value)} placeholder="e.g. hoodie or 66ed…c4" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qty">
              <Input type="number" min={1} value={qty} onChange={e=>setQty(e.target.value)} required />
            </Field>
            <Field label="Warehouse code (optional)">
              <Input value={warehouseCode} onChange={e=>setWarehouseCode(e.target.value)} placeholder="MAIN" />
            </Field>
          </div>
          <Field label="Reason (optional)">
            <Input value={reason} onChange={e=>setReason(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2">
            <Button disabled={busy || !product || Number(qty) <= 0}>{busy ? 'Saving…' : 'Receive'}</Button>
            {!!msg && <span className="text-sm">{msg}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/* -------------------- Adjust -------------------- */

function AdjustForm() {
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState(0)                  // can be +/-
  const [warehouseCode, setWarehouseCode] = useState('')
  const [reason, setReason] = useState('adjust')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      await api.post('/inventory/adjust', {
        productIdOrSlug: product.trim(),
        qty: Number(qty),
        warehouseCode: warehouseCode.trim() || undefined,
        reason: reason.trim() || undefined
      })
      setMsg('Adjustment saved.')
      setQty(0)
    } catch (e) {
      setMsg(e.message || 'Failed to adjust stock')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Adjust stock (+ / −)</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-xl">
          <Field label="Product (ID or slug)">
            <Input value={product} onChange={e=>setProduct(e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qty (+ add / − subtract)">
              <Input type="number" value={qty} onChange={e=>setQty(e.target.value)} required />
            </Field>
            <Field label="Warehouse code (optional)">
              <Input value={warehouseCode} onChange={e=>setWarehouseCode(e.target.value)} placeholder="MAIN" />
            </Field>
          </div>
          <Field label="Reason (optional)">
            <Input value={reason} onChange={e=>setReason(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2">
            <Button disabled={busy || !product || Number(qty) === 0}>{busy ? 'Saving…' : 'Adjust'}</Button>
            {!!msg && <span className="text-sm">{msg}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/* -------------------- Transfer -------------------- */

function TransferForm() {
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState(0)
  const [fromCode, setFromCode] = useState('')
  const [toCode, setToCode] = useState('')
  const [reason, setReason] = useState('transfer')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      await api.post('/inventory/transfer', {
        productIdOrSlug: product.trim(),
        qty: Number(qty),
        fromCode: fromCode.trim(),
        toCode: toCode.trim(),
        reason: reason.trim() || undefined
      })
      setMsg('Transfer completed.')
      setQty(0)
    } catch (e) {
      setMsg(e.message || 'Failed to transfer stock')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Transfer stock (warehouse → warehouse)</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-xl">
          <Field label="Product (ID or slug)">
            <Input value={product} onChange={e=>setProduct(e.target.value)} required />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Qty">
              <Input type="number" min={1} value={qty} onChange={e=>setQty(e.target.value)} required />
            </Field>
            <Field label="From code">
              <Input value={fromCode} onChange={e=>setFromCode(e.target.value)} placeholder="MAIN" required />
            </Field>
            <Field label="To code">
              <Input value={toCode} onChange={e=>setToCode(e.target.value)} placeholder="DH-2" required />
            </Field>
          </div>
          <Field label="Reason (optional)">
            <Input value={reason} onChange={e=>setReason(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2">
            <Button disabled={busy || !product || !fromCode || !toCode || Number(qty) <= 0}>
              {busy ? 'Transferring…' : 'Transfer'}
            </Button>
            {!!msg && <span className="text-sm">{msg}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/* -------------------- Ledger -------------------- */

const TYPE_OPTIONS = ['', 'in', 'out', 'adjust', 'reserve', 'release', 'commit', 'transfer']

function Ledger() {
  const [product, setProduct] = useState('') // optional filter: product id
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  async function load() {
    setLoading(true); setErr('')
    try {
      const qs = new URLSearchParams()
      qs.set('page', String(page))
      qs.set('limit', String(limit))
      if (product.trim()) qs.set('product', product.trim())
      if (type) qs.set('type', type)
      const data = await api.get(`/inventory/moves?${qs.toString()}`)
      setRows(data.items || [])
      setTotal(data.total || 0)
    } catch (e) {
      setErr(e.message || 'Failed to load ledger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, limit, type]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card>
      <CardHeader><CardTitle>Movement ledger</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Product (optional, ID only)">
            <Input value={product} onChange={e=>setProduct(e.target.value)} placeholder="66ed…c4" />
          </Field>
          <Field label="Type">
            <Select value={type} onChange={e=>setType(e.target.value)}>
              {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Any'}</option>)}
            </Select>
          </Field>
          <Field label="Limit">
            <Select value={String(limit)} onChange={e=>setLimit(Number(e.target.value))}>
              {[25,50,100,200].map(n => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={()=>{ setPage(1); load() }}>Apply</Button>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}

        {!loading && !rows.length ? (
          <p className="text-sm text-muted-foreground">No movements found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Variant</th>
                  <th className="py-2 pr-3">From</th>
                  <th className="py-2 pr-3">To</th>
                  <th className="py-2 pr-3 text-right">Qty</th>
                  <th className="py-2 pr-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-b last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-3 capitalize">{r.type}</td>
                    <td className="py-2 pr-3">
                      {r.product?.title || '—'}
                      {r.product?.slug ? <span className="text-muted-foreground"> ({r.product.slug})</span> : null}
                    </td>
                    <td className="py-2 pr-3">{r.variant?.sku || '—'}{r.variant?.title ? ` / ${r.variant.title}` : ''}</td>
                    <td className="py-2 pr-3">{r.fromWarehouse?.code || '—'}</td>
                    <td className="py-2 pr-3">{r.toWarehouse?.code || '—'}</td>
                    <td className="py-2 pr-3 text-right">{r.qty}</td>
                    <td className="py-2 pr-3">{r.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {total} record{total === 1 ? '' : 's'}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
            <span className="text-sm">Page {page} / {pages}</span>
            <Button variant="outline" disabled={page >= pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
