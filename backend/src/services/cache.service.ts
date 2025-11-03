import { redisClient } from "@/config/redis";
import { CacheKey, CachePattern } from "@/types/cache.types";
import logger from "@/logger";

// Public interface for cache service
export interface ICacheService {
  get<T>(key: CacheKey): Promise<T | null>;
  set<T>(key: CacheKey, value: T, expiryInSeconds?: number): Promise<void>;
  delete(key: CacheKey | CacheKey[]): Promise<void>;
  keys(pattern: CachePattern): Promise<string[]>;
  exists(key: CacheKey): Promise<boolean>;
  invalidate(pattern: CachePattern): Promise<void>;
}

// Implementation that wraps the global `redisClient`
export class CacheService implements ICacheService {
  private readonly client = redisClient;

  // GET
  async get<T>(key: CacheKey): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.error({ err, key }, "Cache GET error");
      return null;
    }
  }

  // SET
  async set<T>(
    key: CacheKey,
    value: T,
    expiryInSeconds?: number
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (expiryInSeconds != null && expiryInSeconds > 0) {
        await this.client.setEx(key, expiryInSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err) {
      logger.error({ err, key }, "Cache SET error");
    }
  }

  // DELETE
  async delete(key: CacheKey | CacheKey[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (err) {
      logger.error({ err, key }, "Cache DELETE error");
    }
  }

  // KEYS (pattern matching)
  async keys(pattern: CachePattern): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (err) {
      logger.error({ err, pattern }, "Cache KEYS error");
      return [];
    }
  }

  // EXISTS
  async exists(key: CacheKey): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      logger.error({ err, key }, "Cache EXISTS error");
      return false;
    }
  }

  // INVALIDATE (delete by pattern)
  async invalidate(pattern: CachePattern): Promise<void> {
    try {
      const matching = await this.client.keys(pattern);
      if (matching.length > 0) {
        await this.client.del(matching);
      }
    } catch (err) {
      logger.error({ err, pattern }, "Cache INVALIDATE error");
    }
  }
}

/* --------------------------------------------------------------------
 *  Export a **singleton** instance – every service that imports
 *  `cacheService` gets the same Redis connection.
 * -------------------------------------------------------------------- */
export const cacheService = new CacheService();
