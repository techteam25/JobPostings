import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { reset } from "drizzle-seed";
import { sql } from "drizzle-orm";

import * as schema from "./schema";
import { env } from "@/config/env";
import logger from "@/logger";

const connection = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

async function clearDatabase() {
  const db = drizzle(connection, { schema, mode: "default" });

  logger.info("Starting database reset - clearing all tables...");
  
  try {
    // Use drizzle-seed's reset function to clear all tables
    await reset(db, schema);
    
    // Reset auto-increment counters
    await db.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
    await db.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);
    await db.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);
    await db.execute(sql`ALTER TABLE user_profile AUTO_INCREMENT = 1`);
    
    logger.info("✓ All tables cleared successfully");
    logger.info("✓ Auto-increment counters reset");
  } catch (error) {
    logger.error(`Failed to clear database: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

clearDatabase()
  .then(() => {
    logger.info("Database clearing completed.");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Database clearing failed: ${error}`);
    process.exit(1);
  });

