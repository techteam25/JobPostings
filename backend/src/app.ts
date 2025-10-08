import path from "path";

import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

import pinoHttp from "pino-http";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { checkDatabaseConnection } from "./db/connection";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";

import apiRoutes from "./routes";
import logger from "@/logger";
import { redisClient } from "@/config/redis";
import authRoutes from "@/routes/auth.routes";

// Create Express application
const app: Application = express();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",

  // Important security settings
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false, // Count failed requests too

  // Redis store configuration
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
});

// Limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false, // Count failed attempts
  message: "Too many login attempts, please try again later.",
  // Redis store configuration
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
});

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express API Documentation",
      version: "1.0.0",
      description: "A simple Express API with Swagger documentation",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: `http://${env.HOST}:${env.PORT}`,
        description: "Development server",
      },
    ],
  },
  // Path to the API routes where JSDoc comments are
  apis: [path.join(__dirname, "./routes/*.ts")],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Attach pino HTTP logger middleware
app.use(pinoHttp({ logger }));

// Rate limiting middleware
// app.use(globalLimiter); // All routes

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS middleware (basic setup)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

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
app.get("/health", async (_: Request, res: Response) => {
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
});

// Mount API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", globalLimiter, apiRoutes);

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
