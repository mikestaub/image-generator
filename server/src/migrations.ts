import { Database } from "@sqlitecloud/drivers";
import dotenv from "dotenv";

dotenv.config();

async function runMigrations() {
  const db = new Database(process.env.SQLITE_CLOUD_CONNECTION_STRING!);

  try {
    // Create images table
    await db.sql`
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        imageUrl TEXT NOT NULL,
        positionX REAL NOT NULL,
        positionY REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    db.close();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runMigrations };
