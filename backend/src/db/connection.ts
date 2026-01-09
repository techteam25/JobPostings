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
/**
 * Drizzle ORM instance configured with the database schema and connection.
 */
export const db = drizzle(connection, {
  schema,
  mode: "default",
  logger: isDevelopment, // Enable logging in development
});

/**
 * Checks the health of the database connection by executing a simple query.
 * @returns A promise that resolves to true if the connection is healthy, false otherwise.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await connection.execute("SELECT 1 as healthy");
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    logger.error(`Database connection failed:, ${error}`);
    return false;
  }
}

let isDbClosed = false;

/**
 * Closes the database connection gracefully.
 * @returns A promise that resolves when the connection is closed.
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (isDbClosed) {
    logger.info("📊 Database connection already closed");
    return;
  }
  try {
    await connection.end();
    isDbClosed = true;
    logger.info("📊 Database connection closed");
  } catch (error) {
    logger.error(error, "Error closing database connection");
  }
}

// Export connection for direct use if needed
/**
 * MySQL connection pool for direct database operations if needed.
 */
export { connection };
