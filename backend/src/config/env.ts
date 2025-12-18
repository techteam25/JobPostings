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
  SERVER_URL: z.url(),
  FRONTEND_URL: z.url(),
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
  REDIS_CACHE_URL: z.url({ error: "REDIS_URL must be a valid URL" }),
  REDIS_QUEUE_URL: z.url({ error: "REDIS_URL must be a valid URL" }),
  REDIS_RATE_LIMITER_URL: z.url({ error: "REDIS_URL must be a valid URL" }),

  // email service configuration could be added here
  SMTP_HOST: z.string().min(1, "SMTP host is required"),
  SMTP_PORT: z.coerce.number("SMTP port must be a number"),
  SMTP_SECURE: z.coerce.boolean().default(true),
  SMTP_USER: z.string().min(1, "SMTP user is required"),
  SMTP_PASS: z.string().min(1, "SMTP password is required"),
  EMAIL_FROM: z.email("EMAIL_FROM must be a valid email address"),

  // Better auth configuration
  BETTER_AUTH_SECRET: z.string(),

  // GOOGLE AUTH
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),

  // LinkedIn AUTH
  LINKEDIN_CLIENT_ID: z.string().min(1, "LinkedIn Client ID is required"),
  LINKEDIN_CLIENT_SECRET: z
    .string()
    .min(1, "LinkedIn Client Secret is required"),

  // Firebase Configuration
  FIREBASE_PROJECT_ID: z.string().min(1, "Firebase Project Id is required"),
  FIREBASE_API_KEY: z.string().min(1, "Firebase API Key is required"),
  FIREBASE_AUTH_DOMAIN: z.string().min(1, "Firebase Auth domain is required"),
  FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, "Firebase storage bucket is required"),
  FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, "Firebase Messaging Sender Id is required"),
  FIREBASE_APP_ID: z.string().min(1, "Firebase App Id is required"),
  FIREBASE_MEASUREMENT_ID: z
    .string()
    .min(1, "Firebase Measurement Id is required"),

  // Typesense Configuration
  TYPESENSE_API_KEY: z.string().min(1, "Typesense API Key is required"),
  TYPESENSE_HOST: z.string().min(1, "Typesense Host is required"),
  TYPESENSE_PORT: z.coerce.number("Typesense Port must be a number"),
  TYPESENSE_PROTOCOL: z.enum(["http", "https"]).default("http"),
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
          // Server configuration
          SERVER_URL: process.env.SERVER_URL || "http://localhost:5500",
          FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
          NODE_ENV: "development",
          PORT: 0,
          HOST: "1.1.1.1",

          // Database configuration
          DB_HOST: process.env.DB_HOST || "127.0.0.1",
          DB_PORT: parseInt(process.env.DB_PORT || "0000"),
          DB_NAME: process.env.DB_NAME || "",
          DB_USER: process.env.DB_USER || "",
          DB_PASSWORD: process.env.DB_PASSWORD || "",

          // JWT Secret configuration
          JWT_SECRET: process.env.JWT_SECRET || "",
          JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",

          // Logger Configuration
          LOG_LEVEL: (process.env.LOG_LEVEL as LogLevel) || "info",

          // Redis configuration
          REDIS_CACHE_URL: process.env.REDIS_URL || "redis://localhost:6379",
          REDIS_QUEUE_URL: process.env.REDIS_URL || "redis://localhost:6379",
          REDIS_RATE_LIMITER_URL:
            process.env.REDIS_URL || "redis://localhost:6379",

          // Email service configuration
          SMTP_HOST: process.env.SMTP_HOST || "smtp.example.com",
          SMTP_PORT: parseInt(process.env.SMTP_PORT || "587"),
          SMTP_SECURE: process.env.SMTP_SECURE === "true",
          SMTP_USER: process.env.SMTP_USER || "",
          SMTP_PASS: process.env.SMTP_PASS || "",
          EMAIL_FROM: process.env.EMAIL_FROM || "",

          // Better auth configuration
          BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "",

          // OAuth configuration
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
          LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || "",
          LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || "",

          // Firebase Configuration
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
          FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || "",
          FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || "",
          FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "",
          FIREBASE_MESSAGING_SENDER_ID:
            process.env.FIREBASE_MESSAGING_SENDER_ID || "",
          FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || "",
          FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || "",

          // Typesense Configuration
          TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY || "",
          TYPESENSE_HOST: process.env.TYPESENSE_HOST || "",
          TYPESENSE_PORT: parseInt(process.env.TYPESENSE_PORT || "8108"),
          TYPESENSE_PROTOCOL:
            (process.env.TYPESENSE_PROTOCOL as "http" | "https") || "http",
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
