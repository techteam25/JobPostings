import type { Server } from "http";
import app, { initializeInfrastructure } from "./app";
import { env, isDevelopment } from "./config/env";
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "./db/connection";

import { redisCacheService } from "@/infrastructure/redis-cache.service";
import { redisRateLimiterService } from "@/infrastructure/redis-rate-limiter.service";
import logger from "@/logger";
import { queueService } from "@/infrastructure/queue.service";

let server: Server | null = null;

async function startServer() {
  try {
    // Check database connection
    try {
      const isDbConnected = await checkDatabaseConnection();
      if (!isDbConnected) {
        logger.error("Failed to connect to database");
        process.exit(1);
      }
      logger.info("Database connection successful");
    } catch (err) {
      logger.error("Failed to connect to database");
      process.exit(1);
    }

    // Initialize all infrastructure before accepting requests
    await initializeInfrastructure();

    // Start the server
    server = app.listen(env.PORT, () => {
      logger.info(`Server is running on ${env.SERVER_URL}`);
      logger.info(`Health check available at ${env.SERVER_URL}/health`);
      logger.info(`API available at ${env.SERVER_URL}/api`);
      logger.info(
        `Auth routes available at ${env.SERVER_URL}/api/auth/reference`,
      );
      logger.info(`API Documentation available at ${env.SERVER_URL}/docs`);

      if (isDevelopment) {
        logger.info(`Environment: ${env.NODE_ENV}`);
        logger.info(
          `Database: ${env.DB_NAME} on ${env.DB_HOST}:${env.DB_PORT}`,
        );
      }
    });
  } catch (error) {
    logger.error(error, "Failed to start server:");
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);

  // Force exit after 30 seconds
  const forceExitTimeout = setTimeout(() => {
    logger.error("Forced exit after 30s timeout");
    process.exit(1);
  }, 30000);
  forceExitTimeout.unref();

  // 1. Stop accepting new connections
  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => {
        logger.info("HTTP server closed");
        resolve();
      });
    });
  }

  // 2. Close queue service (wait for in-flight jobs)
  try {
    await queueService.shutdown();
    logger.info("Queue service shut down");
  } catch (error) {
    logger.error("Error shutting down queue service", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 3. Close Redis cache
  try {
    await redisCacheService.disconnect();
  } catch (error) {
    logger.error("Error disconnecting Redis cache", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 4. Close Redis rate limiter
  try {
    await redisRateLimiterService.disconnect();
  } catch (error) {
    logger.error("Error disconnecting Redis rate limiter", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 5. Close database connection
  try {
    await closeDatabaseConnection();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error closing database connection", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  process.exit(0);
}

// Start the server
startServer().catch((err) => logger.error(err));

// Graceful shutdown on both signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
