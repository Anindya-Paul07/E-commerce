import Warehouse from '../model/warehouse.model.js';

let DEFAULT_WAREHOUSE_ID = null;

export async function ensureDefaultWarehouse() {
  if (DEFAULT_WAREHOUSE_ID) return DEFAULT_WAREHOUSE_ID;

  let wh = await Warehouse.findOne({ isDefault: true, active: true });
  if (!wh) {
    wh = await Warehouse.create({
      name: 'Main Warehouse',
      code: 'MAIN',
      isDefault: true,
      active: true,
      address: { country: 'US' },
    });
  }
  DEFAULT_WAREHOUSE_ID = wh._id;
  return DEFAULT_WAREHOUSE_ID;
}

export function getDefaultWarehouseIdSync() {
  return DEFAULT_WAREHOUSE_ID;
}
