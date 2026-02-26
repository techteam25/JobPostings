import { createClient, RedisClientType } from "redis";
import logger from "@/logger";
import { env } from "@/config/env";

class RedisRateLimiterService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      logger.info("Redis Rate Limiter already connected");
      return;
    }

    try {
      this.client = createClient({
        url: env.REDIS_RATE_LIMITER_URL,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries) => {
            const delay = Math.min(retries * 500, 30000);
            if (retries <= 10 || retries % 10 === 0) {
              logger.warn(`Redis Rate Limiter reconnecting in ${delay}ms`, {
                attempt: retries,
              });
            }
            return delay;
          },
        },
      });

      this.client.on("error", (err) => {
        logger.error("Redis Rate Limiter Client Error", { error: err.message });
      });

      this.client.on("connect", () => {
        logger.info("Redis Rate Limiter connecting...");
      });

      this.client.on("ready", () => {
        logger.info("Redis Rate Limiter client ready");
        this.isConnected = true;
      });

      this.client.on("reconnecting", () => {
        logger.warn("Redis Rate Limiter reconnecting...");
      });

      this.client.on("end", () => {
        logger.info("Redis Rate Limiter connection closed");
        this.isConnected = false;
      });

      await this.client.connect();
      logger.info("Redis Rate Limiter connected successfully", {
        url: env.REDIS_RATE_LIMITER_URL.replace(/\/\/.*@/, "//***@"),
      });
    } catch (error) {
      logger.error("Failed to connect to Redis Rate Limiter", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected && this.client.isOpen) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info("Redis Rate Limiter disconnected");
    }
  }

  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis Rate Limiter client not connected");
    }
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export const redisRateLimiterService = new RedisRateLimiterService();
