import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for rate limiter lazy initialization and store selection.
 *
 * - getStore() is tested directly for both Redis-ready and fallback paths
 * - apiLimiter lazy init is verified by mocking express-rate-limit and
 *   checking it's not called at import time
 */

const { mockIsReady, mockGetClient, mockRateLimit, MockRedisStore } = vi.hoisted(() => {
  class MockRedisStore {}
  return {
    mockIsReady: vi.fn<() => boolean>().mockReturnValue(false),
    mockGetClient: vi.fn(),
    mockRateLimit: vi.fn().mockReturnValue(vi.fn()),
    MockRedisStore,
  };
});

vi.mock("express-rate-limit", () => ({ default: mockRateLimit }));
vi.mock("rate-limit-redis", () => ({ RedisStore: MockRedisStore }));

vi.mock("@/infrastructure/redis-rate-limiter.service", () => ({
  redisRateLimiterService: {
    isReady: mockIsReady,
    getClient: mockGetClient,
  },
}));

import { getStore, apiLimiter } from "@/middleware/rate-limit.middleware";

describe("Rate Limiter Middleware", () => {
  beforeEach(() => {
    mockIsReady.mockReset().mockReturnValue(false);
    mockGetClient.mockReset();
  });

  describe("getStore", () => {
    it("should return a RedisStore when Redis is ready", () => {
      mockIsReady.mockReturnValue(true);
      mockGetClient.mockReturnValue({ sendCommand: vi.fn() });

      const store = getStore();

      expect(mockIsReady).toHaveBeenCalledOnce();
      expect(store).toBeInstanceOf(MockRedisStore);
    });

    it("should return undefined (memory fallback) when Redis is not ready", () => {
      mockIsReady.mockReturnValue(false);

      const store = getStore();

      expect(mockIsReady).toHaveBeenCalledOnce();
      expect(store).toBeUndefined();
    });

    it("should return undefined and not throw when isReady throws", () => {
      mockIsReady.mockImplementation(() => {
        throw new Error("connection refused");
      });

      const store = getStore();

      expect(store).toBeUndefined();
    });
  });

  describe("apiLimiter", () => {
    it("should not create the limiter at import time (lazy initialization)", () => {
      // rateLimit() should not have been called during module loading
      expect(mockRateLimit).not.toHaveBeenCalled();
    });

    it("should create the limiter on first request", () => {
      const req = { ip: "127.0.0.1", path: "/test" } as any;
      const res = { setHeader: vi.fn(), getHeader: vi.fn() } as any;
      const next = vi.fn();

      apiLimiter(req, res, next);

      // rateLimit was called once (lazy init triggered)
      expect(mockRateLimit).toHaveBeenCalledOnce();
    });

    it("should reuse the cached limiter on subsequent requests", () => {
      mockRateLimit.mockClear();

      const req = { ip: "127.0.0.1", path: "/test" } as any;
      const res = { setHeader: vi.fn(), getHeader: vi.fn() } as any;
      const next = vi.fn();

      apiLimiter(req, res, next);

      // rateLimit should NOT be called again — cached
      expect(mockRateLimit).not.toHaveBeenCalled();
    });
  });
});
