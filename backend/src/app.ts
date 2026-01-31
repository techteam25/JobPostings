import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";

import { toNodeHandler } from "better-auth/node";

import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import type { Application, Request, Response, NextFunction } from "express";

import logger from "@/logger";
import { auth } from "@/utils/auth";
import { env } from "@/config/env";

import { checkDatabaseConnection } from "@/db/connection";
import { registry } from "@/swagger/registry";
import apiRoutes from "@/routes";

import { errorHandler } from "@/middleware/error.middleware";
import { apiLimiter } from "@/middleware/rate-limit.middleware";
import { requestLogger } from "@/middleware/request-logger.middleware";

import { redisCacheService } from "@/infrastructure/redis-cache.service";
import { redisRateLimiterService } from "@/infrastructure/redis-rate-limiter.service";
import { queueService } from "@/infrastructure/queue.service";
import { initializeTypesenseSchema } from "@/config/typesense-client";
import { initializeEmailWorker } from "@/workers/send-email-worker";
import { initializeTypesenseWorker } from "@/workers/typesense-job-indexer";
import { initializeFileUploadWorker } from "@/workers/file-upload-worker";
import {
  initializeFileCleanupWorker,
  scheduleCleanupJob,
} from "@/workers/temp-file-cleanup-worker";
import { initializeAuditCleanupWorker } from "./workers/audit-cleanup-worker";
import {
  initializeJobAlertWorker,
  scheduleDailyAlertProcessing,
  scheduleWeeklyAlertProcessing,
} from "@/workers/job-alert-processor";
import {
  initializeInactiveUserAlertWorker,
  scheduleInactiveUserAlertPausing,
} from "@/workers/inactive-user-alert-pauser";
import {
  initializeInvitationExpirationWorker,
  scheduleInvitationExpirationJob,
} from "@/workers/invitation-expiration-worker";

// Initialize Typesense schema
try {
  initializeTypesenseSchema().catch((err) => logger.error(err));
  logger.info("✅ Typesense schema initialization successful");
} catch (error) {
  logger.error("❌ Failed to initialize Typesense schema");
  process.exit(1);
}

// Connect to Redis instances (all optional - server will continue if they fail)
try {
  redisCacheService.connect().catch((err) => logger.error(err));
  logger.info("Redis Cache connected");
} catch (error) {
  logger.warn("Redis Cache connection failed, continuing without cache", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
}

// Connect to Redis for Rate Limiting
try {
  redisRateLimiterService.connect().catch((err) => logger.error(err));
  logger.info("Redis Rate Limiter connected");
} catch (error) {
  logger.warn("Redis Rate Limiter connection failed, using memory store", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
}

// Initialize queue service and workers
try {
  queueService.initialize().catch((err) => logger.error(err));
  initializeTypesenseWorker();
  initializeFileUploadWorker();
  initializeEmailWorker();
  initializeFileCleanupWorker();
  initializeJobAlertWorker();
  initializeInactiveUserAlertWorker();
  initializeInvitationExpirationWorker();
  logger.info("Queue service and workers initialized");
} catch (error) {
  logger.warn(
    "Queue service initialization failed, image uploads will be synchronous",
    {
      error: error instanceof Error ? error.message : "Unknown error",
    },
  );
}

try {
  scheduleCleanupJob().catch((err) => logger.error(err));
  scheduleDailyAlertProcessing().catch((err) => logger.error(err));
  scheduleWeeklyAlertProcessing().catch((err) => logger.error(err));
  scheduleInactiveUserAlertPausing().catch((err) => logger.error(err));
  scheduleInvitationExpirationJob().catch((err) => logger.error(err));
} catch (error) {
  logger.warn("Failed to schedule background jobs", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
}

// Create Express application
const app: Application = express();

// Request logging middleware (should be early)
app.use(requestLogger);

// Security and CORS middleware
app.use(
  cors({
    origin: [env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"],
    exposedHeaders: ["set-cookie"],
    credentials: true,
  }),
);
app.use(helmet());

// Disable CSP for the API docs route
app.use("/api/auth/reference", (_req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});

// Mount Better-Auth routes
app.all("/api/auth/*splat", toNodeHandler(auth));

// Attach pino HTTP logger middleware
app.use(pinoHttp({ logger }));

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Generate the OpenAPI document
const generator = new OpenApiGeneratorV3(registry.definitions);
const swaggerOptions = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Express API Documentation",
    version: "1.0.0",
    description: "Job Postings API with Swagger documentation",
  },
  servers: [{ url: `${env.SERVER_URL}` }],
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerOptions));

// Request logging middleware (development only)
if (env.NODE_ENV === "development") {
  app.use((req: Request, _: Response, next: NextFunction) => {
    logger.info(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      `${req.method} ${req.path}`,
    );
    next();
  });
}

// Initialize audit log cleanup worker
initializeAuditCleanupWorker();

// Health check route
/*
 * @swagger
 *  /health:
 *    get:
 *      summary: Health check endpoint
 *      description: Returns the health status of the server and database
 *      responses:
 *        '200':
 *          description: Server and database are healthy
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                  message:
 *                    type: string
 *                  timestamp:
 *                    type: string
 *                  environment:
 *                    type: string
 *                  database:
 *                    type: object
 *                    properties:
 *                      connected:
 *                        type: boolean
 *                      host:
 *                        type: string
 *                      port:
 *                        type: string
 *                      name:
 *                        type: string
 *                  version:
 *                    type: string
 *        '503':
 *          description: Server or database is unhealthy
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                  message:
 *                    type: string
 *                  timestamp:
 *                    type: string
 *                  error:
 *                    type: string
 *
 */
app.get(
  "/health",
  apiLimiter,
  cors({ origin: "*" }),
  async (_: Request, res: Response) => {
    try {
      const isDatabaseHealthy = await checkDatabaseConnection();
      const healthStatus = {
        status: isDatabaseHealthy ? "OK" : "DEGRADED",
        message: "Server is running",
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        database: {
          connected: isDatabaseHealthy,
          host: env.DB_HOST,
          port: env.DB_PORT,
          name: env.DB_NAME,
        },
        version: "1.0.0",
      };

      const statusCode = isDatabaseHealthy ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: "ERROR",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Rate limiting middleware
app.use("/api", apiLimiter, apiRoutes); // All routes

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use(errorHandler);

export default app;
