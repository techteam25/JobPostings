import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { Request, Response } from "express";

import { redisRateLimiterService } from "@/infrastructure/redis-rate-limiter.service";
import logger from "@/logger";
import { isTest } from "@/config/env";

/**
 * Get Redis store for rate limiting
 * Falls back to memory store if Redis is not available
 */
const getStore = () => {
  try {
    if (redisRateLimiterService.isReady()) {
      return new RedisStore({
        sendCommand: (...args: string[]) =>
          redisRateLimiterService.getClient().sendCommand(args),
        prefix: "rate-limit:",
      });
    }
  } catch (error) {
    logger.warn(
      "Redis Rate Limiter not available, using memory store for rate limiting",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    );
  }
  return undefined; // Use default memory store
};

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  skip: () => isTest, // Skip rate limiting in test environment
  store: getStore(),
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      correlationId: req.correlationId,
    });
    res.status(429).json({
      status: "error",
      message: "Too many requests, please try again later.",
      retryAfter: res.getHeader("RateLimit-Reset"),
    });
  },
});
