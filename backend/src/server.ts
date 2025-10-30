import app from "./app";
import { env, isDevelopment } from "./config/env";
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "./db/connection";
import logger from "@/logger";

// Check database connection before starting server
async function startServer() {
  try {
    // Check database connection
    const isDbConnected = await checkDatabaseConnection();
    if (!isDbConnected) {
      logger.error("❌ Failed to connect to database");
      process.exit(1);
    }

    logger.info("✅ Database connection successful");

    // Start the server
    return app.listen(env.PORT, () => {
      logger.info(`🚀 Server is running on http://${env.HOST}:${env.PORT}`);
      logger.info(
        `📊 Health check available at http://${env.HOST}:${env.PORT}/health`,
      );
      logger.info(`🔗 API available at http://${env.HOST}:${env.PORT}/api`);
      logger.info(
        `📚 API Documentation available at http://${env.HOST}:${env.PORT}/docs`,
      );

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

// Start the server
startServer().catch((err) => logger.error(err));

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("\n🛑 Shutting down server gracefully...");
  await closeDatabaseConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("\n🛑 Shutting down server gracefully...");
  await closeDatabaseConnection();
  process.exit(0);
});
