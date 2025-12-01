import app from "./app.js";
import { config } from "./config/env.js";
import { getDb } from "./config/db.js";

const start = async () => {
  try {
    // test konekciju na bazu
    const db = getDb();
    await db.getConnection();
    console.log("✅ Connected to MySQL");

    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
};

start();
