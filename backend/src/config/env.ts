import { z } from "zod";
import "dotenv/config";

enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

// Define the schema for environment variables
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("3000") // Changed from 3306 to 3000
    .transform((val) => parseInt(val, 10)),
  HOST: z.string().default("localhost"),

  // Database configuration
  DB_HOST: z.string().min(1, "Database host is required"),
  DB_PORT: z
    .string()
    .default("3306")
    .transform((val) => parseInt(val, 10)),
  DB_NAME: z.string().min(1, "Database name is required"),
  DB_USER: z.string().min(1, "Database user is required"),
  DB_PASSWORD: z.string().min(1, "Database password is required"),

  // JWT Secret - now required
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT REFRESH secret must be at least 32 characters"),

  // Logger Configuration
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // redis configuration
  REDIS_URL: z.url({ error: "REDIS_URL must be a valid URL" }),
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
      if (process.env.NODE_ENV === "test") {
        console.warn("⚠️  Environment validation failed in test mode:");
        if (error.issues && Array.isArray(error.issues)) {
          error.issues.forEach((err) => {
            console.warn(`  - ${err.path.join(".")}: ${err.message}`);
          });
        }

        // Return partial config for testing
        return {
          NODE_ENV: "development",
          PORT: 0,
          HOST: "1.1.1.1",
          DB_HOST: process.env.DB_HOST || "127.0.0.1",
          DB_PORT: parseInt(process.env.DB_PORT || "0000"),
          DB_NAME: process.env.DB_NAME || "",
          DB_USER: process.env.DB_USER || "",
          DB_PASSWORD: process.env.DB_PASSWORD || "",
          JWT_SECRET: process.env.JWT_SECRET || "",
          JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
          LOG_LEVEL: (process.env.LOG_LEVEL as LogLevel) || "info",
          REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
        };
      }

      console.error("❌ Environment validation failed:");
      if (error.issues && Array.isArray(error.issues)) {
        error.issues.forEach((err) => {
          console.error(`  - ${err.path.join(".")}: ${err.message}`);
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
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
