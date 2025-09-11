import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  HOST: z.string().default('localhost'),

  // Database configuration
  DB_HOST: z.string().min(1, 'Database host is required'),
  DB_PORT: z.string().default('3306').transform((val) => parseInt(val, 10)),
  DB_NAME: z.string().min(1, 'Database name is required'),
  DB_USER: z.string().min(1, 'Database user is required'),
  DB_PASSWORD: z.string().min(1, 'Database password is required'),
  
  // Optional database configuration
  DB_SSL: z.string().transform((val) => val === 'true').default('false'),
  DB_CONNECTION_LIMIT: z.string().default('10').transform((val) => parseInt(val, 10)),
  
  // JWT Secret (optional for future use)
  JWT_SECRET: z.string().optional(),
  
  // API Keys (optional for future use)
  API_KEY: z.string().optional(),
});

// Type inference from the schema
export type Env = z.infer<typeof envSchema>;

// Validate and parse environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // In test environment, be more lenient with database configuration
      if (process.env.NODE_ENV === 'test') {
        console.warn('⚠️  Environment validation failed in test mode:');
        if (error.errors && Array.isArray(error.errors)) {
          error.errors.forEach((err) => {
            console.warn(`  - ${err.path.join('.')}: ${err.message}`);
          });
        }
        
        // Return partial config for testing
        return {
          NODE_ENV: 'test',
          PORT: 0,
          HOST: 'localhost',
          DB_HOST: process.env.DB_HOST || 'localhost',
          DB_PORT: parseInt(process.env.DB_PORT || '3306'),
          DB_NAME: process.env.DB_NAME || 'test_db',
          DB_USER: process.env.DB_USER || 'test',
          DB_PASSWORD: process.env.DB_PASSWORD || 'test',
          DB_SSL: false,
          DB_CONNECTION_LIMIT: 5,
          JWT_SECRET: process.env.JWT_SECRET,
          API_KEY: process.env.API_KEY,
        };
      }
      
      console.error('❌ Environment validation failed:');
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
      }
      process.exit(1);
    }
    throw error;
  }
}

// Export the validated environment variables
export const env = validateEnv();

// Helper function to check if we're in a specific environment
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
