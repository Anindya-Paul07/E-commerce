import InventoryItem from '../model/inventoryItem.model.js'
import Variant from '../model/variant.model.js'
import Warehouse from '../model/warehouse.model.js'

// threshold: use item.lowStockThreshold if set, else defaultThreshold
export async function findLowStock(defaultThreshold = 5) {
  const items = await InventoryItem.find({})
    .populate({ path: 'variant', select: 'sku title product' })
    .populate({ path: 'warehouse', select: 'code name' })
  const lows = []
  for (const it of items) {
    const available = Math.max(0, (it.qtyOnHand || 0) - (it.qtyReserved || 0))
    const threshold = (it.lowStockThreshold != null) ? it.lowStockThreshold : defaultThreshold
    if (available <= threshold) {
      lows.push({
        variantId: it.variant?._id,
        sku: it.variant?.sku,
        title: it.variant?.title,
        warehouseCode: it.warehouse?.code,
        warehouseName: it.warehouse?.name,
        onHand: it.qtyOnHand,
        reserved: it.qtyReserved,
        available,
        threshold
      })
    }
  }
  return lows
}

// call this from app bootstrap
export function scheduleLowStockLogger({ intervalMs = 10 * 60 * 1000, defaultThreshold = 5 } = {}) {
  setInterval(async () => {
    try {
      const lows = await findLowStock(defaultThreshold)
      if (lows.length) {
        // Replace with real notifier (email/webhook) later
        console.warn(`[low-stock] ${new Date().toISOString()} — ${lows.length} items below threshold`)
        lows.slice(0, 5).forEach(l =>
          console.warn(` - ${l.sku} @ ${l.warehouseCode}: avail=${l.available} (<=${l.threshold})`))
      }
    } catch (e) {
      console.error('low-stock check failed:', e.message)
    }
  }, intervalMs)
}
