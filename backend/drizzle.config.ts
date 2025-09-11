import { defineConfig } from 'drizzle-kit';
import { env } from './src/config/env';

export default defineConfig({
  // Database connection
  dialect: 'mysql',
  dbCredentials: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },
  
  // Schema files
  schema: './src/db/schema/*',
  
  // Migration settings
  out: './src/db/migrations',
  
  // Additional settings
  verbose: true,
  strict: true,
});
