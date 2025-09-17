import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import { ensureDefaultWarehouse } from './lib/warehouse.utils.js';
import { scheduleLowStockLogger } from "./lib/low-stock.logger.js";

(async () => {
  await connectDB();
  await ensureDefaultWarehouse();
  scheduleLowStockLogger({ intervalMs: 10 * 60 * 1000, defaultThreshold: 5 })
  app.listen(ENV.PORT, () => {
    console.log(`🚀 API running on http://localhost:${ENV.PORT}`);
  });
})();
