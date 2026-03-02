import { Pool } from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/config/env";
import * as schema from "@/db/schema";

let testConnection: mysql.Pool | null = null;
let testDb: (MySql2Database<typeof schema> & { $client: Pool }) | null = null;

/**
 * Create test database connection
 */
export function createTestDatabase() {
  if (testConnection && testDb) {
    return { connection: testConnection, db: testDb };
  }

  // Create test database connection with suffix
  const testDbName = `${env.DB_NAME}`;

  testConnection = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: testDbName,
    connectionLimit: 5, // Smaller pool for tests
  });

  testDb = drizzle(testConnection, {
    schema,
    mode: "default",
    logger: false, // Disable logging in tests
  });

  return { connection: testConnection, db: testDb };
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase() {
  if (testConnection) {
    await testConnection.end();
    testConnection = null;
    testDb = null;
  }
}

/**
 * Check if test database exists and is accessible
 */
export async function checkTestDatabase(): Promise<boolean> {
  try {
    const { connection } = createTestDatabase();
    const [result] = await connection.execute("SELECT 1 as healthy");
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error("Test database check failed:", error);
    return false;
  }
}
