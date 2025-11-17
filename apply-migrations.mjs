import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

console.log("📦 Applying database migrations...\n");

try {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  
  // Apply all pending migrations
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });
  
  console.log("✅ All migrations applied successfully!");
  
  await connection.end();
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}
