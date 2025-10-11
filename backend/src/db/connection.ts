import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env, isDevelopment } from "@/config/env";
import * as schema from "./schema";
import logger from "@/logger";

// Create MySQL connection
const connection = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

// Create Drizzle instance
export const db = drizzle(connection, {
  schema,
  mode: "default",
  logger: isDevelopment, // Enable logging in development
});

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await connection.execute("SELECT 1 as healthy");
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    logger.error(`Database connection failed:, ${error}`);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await connection.end();
    logger.info("📊 Database connection closed");
  } catch (error) {
    logger.error(error, "Error closing database connection");
  }
}

// Export connection for direct use if needed
export { connection };
