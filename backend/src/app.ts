import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";

import pinoHttp from "pino-http";

import { checkDatabaseConnection } from "./db/connection";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";

import apiRoutes from "./routes";
import logger from "@/logger";
import { store } from "@/config/redis";

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
  store,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,

  // Redis store configuration
  store,
});

// Attach pino HTTP logger middleware
app.use(pinoHttp({ logger }));

// Rate limiting middleware
app.use(globalLimiter); // All routes

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
    console.log(`${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  });
}

// Health check route
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
app.use("/api", apiLimiter, apiRoutes);

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
