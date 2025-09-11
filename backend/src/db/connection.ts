import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env, isDevelopment } from '../config/env';
import * as schema from './schema';

// Create MySQL connection
const connection = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
});

// Create Drizzle instance
export const db = drizzle(connection, {
  schema,
  mode: 'default',
  logger: isDevelopment, // Enable logging in development
});

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const [result] = await connection.execute('SELECT 1 as healthy');
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await connection.end();
    console.log('📊 Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Export connection for direct use if needed
export { connection };
