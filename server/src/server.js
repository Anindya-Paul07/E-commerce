import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

(async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`🚀 API running on http://localhost:${ENV.PORT}`);
  });
})();
