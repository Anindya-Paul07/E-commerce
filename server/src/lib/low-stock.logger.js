import InventoryItem from '../model/inventory-item.model.js';

export async function findLowStock(defaultThreshold = 5) {
  const items = await InventoryItem.find({})
    .populate({ path: 'variant', select: 'sku title product' })
    .populate({ path: 'warehouse', select: 'code name' });

  return items
    .map((it) => {
      const available = Math.max(0, (it.qtyOnHand || 0) - (it.qtyReserved || 0));
      const threshold = it.lowStockThreshold != null ? it.lowStockThreshold : defaultThreshold;
      return {
        variantId: it.variant?._id,
        sku: it.variant?.sku,
        title: it.variant?.title,
        product: it.variant?.product,
        warehouseCode: it.warehouse?.code,
        warehouseName: it.warehouse?.name,
        onHand: it.qtyOnHand,
        reserved: it.qtyReserved,
        available,
        threshold,
      };
    })
    .filter((entry) => entry.available <= entry.threshold);
}

export function scheduleLowStockLogger({ intervalMs = 10 * 60 * 1000, defaultThreshold = 5 } = {}) {
  setInterval(async () => {
    try {
      const lows = await findLowStock(defaultThreshold);
      if (lows.length > 0) {
        console.warn(`[low-stock] ${new Date().toISOString()} — ${lows.length} items below threshold`);
        lows.slice(0, 5).forEach((entry) => {
          console.warn(` - ${entry.sku} @ ${entry.warehouseCode}: avail=${entry.available} (<=${entry.threshold})`);
        });
      }
    } catch (error) {
      console.error('low-stock check failed:', error.message);
    }
  }, intervalMs);
}
