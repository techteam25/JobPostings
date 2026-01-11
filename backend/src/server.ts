import app from "./app";
import { env, isDevelopment } from "./config/env";
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "./db/connection";

import { redisCacheService } from "@/infrastructure/redis-cache.service";
import { redisRateLimiterService } from "@/infrastructure/redis-rate-limiter.service";
import logger from "@/logger";
import { queueService } from "@/infrastructure/queue.service";

// Check database connection before starting server
async function startServer() {
  try {
    // Check database connection
    try {
      const isDbConnected = await checkDatabaseConnection();
      if (!isDbConnected) {
        logger.error("❌ Failed to connect to database");
        process.exit(1);
      }
      logger.info("✅ Database connection successful");
    } catch (err) {
      logger.error("❌ Failed to connect to database");
      process.exit(1);
    }

    // Start the server
    return app.listen(env.PORT, () => {
      logger.info(`🚀 Server is running on ${env.SERVER_URL}`);
      logger.info(`📊 Health check available at ${env.SERVER_URL}/health`);
      logger.info(`🔗 API available at ${env.SERVER_URL}/api`);
      logger.info(
        `🔗 Auth routes available at ${env.SERVER_URL}/api/auth/reference`,
      );
      logger.info(`📚 API Documentation available at ${env.SERVER_URL}/docs`);

      if (isDevelopment) {
        logger.info(`🎯 Environment: ${env.NODE_ENV}`);
        logger.info(
          `💾 Database: ${env.DB_NAME} on ${env.DB_HOST}:${env.DB_PORT}`,
        );
      }
    });
  } catch (error) {
    logger.error(error, "❌ Failed to start server:");
    process.exit(1);
  }
}

const queueShutdown = async () => {
  // Close queue service first (wait for jobs to complete)
  try {
    await queueService.shutdown();
    logger.info("Queue service shut down");
  } catch (error) {
    logger.error("Error shutting down queue service", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Start the server
startServer().catch((err) => logger.error(err));

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("\n🛑 Shutting down server gracefully...");
  await closeDatabaseConnection();

  // Close Redis connections
  await redisCacheService.disconnect();

  // Close Redis Rate Limiter connection
  await redisRateLimiterService.disconnect();

  // Close queue service first (wait for jobs to complete)
  await queueShutdown();

  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("\n🛑 Shutting down server gracefully...");
  await closeDatabaseConnection();

  // Close queue service first (wait for jobs to complete)
  await queueShutdown();

  // Close Redis connections
  await redisCacheService.disconnect();

  // Close Redis Rate Limiter connection
  await redisRateLimiterService.disconnect();

  process.exit(0);
});
