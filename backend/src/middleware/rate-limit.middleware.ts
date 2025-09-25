import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../utils/errors';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  keyGenerator?: (req: Request) => string; // Function to generate unique keys for clients
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class RateLimitMiddleware {
  private stores: Map<string, RateLimitStore> = new Map();

  createRateLimit(config: RateLimitConfig) {
    const {
      windowMs,
      maxRequests,
      keyGenerator = (req: Request) => req.ip || 'unknown',
      message = 'Too many requests, please try again later',
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
    } = config;

    // Create a unique store for this rate limiter instance
    const storeId = `${windowMs}-${maxRequests}-${Date.now()}`;
    this.stores.set(storeId, {});
    const store = this.stores.get(storeId)!;

    return (req: Request, res: Response, next: NextFunction) => {
      const key = keyGenerator(req);
      const now = Date.now();
      const resetTime = now + windowMs;

      // Clean up expired entries
      if (store[key] && now > store[key].resetTime) {
        delete store[key];
      }

      // Initialize or get current count
      if (!store[key]) {
        store[key] = {
          count: 0,
          resetTime,
        };
      }

      const current = store[key];

      // Check if limit exceeded
      if (current.count >= maxRequests) {
        const error = new TooManyRequestsError(message);
        return res.status(429).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
          timestamp: new Date().toISOString(),
        });
      }

      // Increment counter
      current.count++;

      // Set headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current.count).toString(),
        'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
      });

      // Handle response tracking
      if (!skipSuccessfulRequests || !skipFailedRequests) {
        const originalSend = res.send;
        res.send = function(body) {
          const statusCode = res.statusCode;
          
          // Decrement if we should skip this request
          if (
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400)
          ) {
            current.count = Math.max(0, current.count - 1);
          }
          
          return originalSend.call(this, body);
        };
      }

      next();
    };
  }

  // Method to create a simple rate limiter with default settings
  createSimpleRateLimit(maxRequests: number, windowMinutes: number = 15) {
    return this.createRateLimit({
      windowMs: windowMinutes * 60 * 1000,
      maxRequests,
    });
  }

  // Method to clear all stored rate limit data
  clearAll(): void {
    this.stores.clear();
  }

  // Method to clear rate limit data for a specific key
  clearKey(storeId: string, key: string): void {
    const store = this.stores.get(storeId);
    if (store && store[key]) {
      delete store[key];
    }
  }

  // Cleanup expired entries across all stores
  cleanup(): void {
    const now = Date.now();
    
    for (const store of this.stores.values()) {
      for (const [key, data] of Object.entries(store)) {
        if (now > data.resetTime) {
          delete store[key];
        }
      }
    }
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimitMiddleware();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  globalRateLimiter.cleanup();
}, 5 * 60 * 1000); // 5 minutes in milliseconds
export default globalRateLimiter;