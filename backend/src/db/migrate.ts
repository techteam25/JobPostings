import { migrate } from "drizzle-orm/mysql2/migrator";
import { db, closeDatabaseConnection } from "@shared/db/connection";

async function runMigrations() {
  console.log("Running database migrations...");

  await migrate(db, { migrationsFolder: "./migrations" });

  console.log("Migrations completed successfully.");
  await closeDatabaseConnection();
  process.exit(0);
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
