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
    </div>
  );
}
