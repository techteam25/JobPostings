import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests that workers and scheduled jobs are only initialized
 * when the queue service successfully connects.
 */

// Hoist all mocks so they survive vi.mock hoisting
const { mockQueueInit, mockInitializeAll, mockScheduleAllJobs } = vi.hoisted(
  () => ({
    mockQueueInit: vi.fn(),
    mockInitializeAll: vi.fn(),
    mockScheduleAllJobs: vi.fn().mockResolvedValue(undefined),
  }),
);

vi.mock("@shared/infrastructure/queue.service", () => ({
  queueService: { initialize: mockQueueInit },
}));

vi.mock("@/composition-root", () => ({
  createCompositionRoot: vi.fn(() => ({
    workers: {
      initializeAll: mockInitializeAll,
      scheduleAllJobs: mockScheduleAllJobs,
    },
  })),
}));

vi.mock("@/routes", () => ({
  createApiRoutes: vi.fn(async () => {
    const { Router } = await import("express");
    return Router();
  }),
}));

// Stub non-critical infra so initializeInfrastructure doesn't hit real services
vi.mock("@shared/config/typesense-client", () => ({
  initializeTypesenseSchema: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@shared/infrastructure/redis-cache.service", () => ({
  redisCacheService: { connect: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@shared/infrastructure/redis-rate-limiter.service", () => ({
  redisRateLimiterService: { connect: vi.fn().mockResolvedValue(undefined) },
}));

import { initializeInfrastructure } from "@/app";

describe("initializeInfrastructure queue guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize workers and schedule jobs when queue connects", async () => {
    mockQueueInit.mockResolvedValue(undefined);

    await initializeInfrastructure();

    expect(mockInitializeAll).toHaveBeenCalledOnce();
    expect(mockScheduleAllJobs).toHaveBeenCalledOnce();
  });

  it("should skip workers and scheduled jobs when queue fails", async () => {
    mockQueueInit.mockRejectedValue(new Error("Redis connection refused"));

    await initializeInfrastructure();

    expect(mockInitializeAll).not.toHaveBeenCalled();
    expect(mockScheduleAllJobs).not.toHaveBeenCalled();
  });
});
