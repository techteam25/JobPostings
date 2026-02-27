import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests that workers and scheduled jobs are only initialized
 * when the queue service successfully connects.
 */

// Hoist all mocks so they survive vi.mock hoisting
const {
  mockQueueInit,
  mockInitEmailWorker,
  mockInitTypesenseWorker,
  mockInitFileUploadWorker,
  mockInitFileCleanupWorker,
  mockInitJobAlertWorker,
  mockInitInactiveUserAlertWorker,
  mockInitInvitationExpirationWorker,
  mockScheduleCleanupJob,
  mockScheduleDailyAlert,
  mockScheduleWeeklyAlert,
  mockScheduleMonthlyAlert,
  mockScheduleInactiveUserAlert,
  mockScheduleInvitationExpiration,
} = vi.hoisted(() => ({
  mockQueueInit: vi.fn(),
  mockInitEmailWorker: vi.fn(),
  mockInitTypesenseWorker: vi.fn(),
  mockInitFileUploadWorker: vi.fn(),
  mockInitFileCleanupWorker: vi.fn(),
  mockInitJobAlertWorker: vi.fn(),
  mockInitInactiveUserAlertWorker: vi.fn(),
  mockInitInvitationExpirationWorker: vi.fn(),
  mockScheduleCleanupJob: vi.fn().mockResolvedValue(undefined),
  mockScheduleDailyAlert: vi.fn().mockResolvedValue(undefined),
  mockScheduleWeeklyAlert: vi.fn().mockResolvedValue(undefined),
  mockScheduleMonthlyAlert: vi.fn().mockResolvedValue(undefined),
  mockScheduleInactiveUserAlert: vi.fn().mockResolvedValue(undefined),
  mockScheduleInvitationExpiration: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/infrastructure/queue.service", () => ({
  queueService: { initialize: mockQueueInit },
}));
vi.mock("@/workers/send-email-worker", () => ({
  initializeEmailWorker: mockInitEmailWorker,
}));
vi.mock("@/workers/typesense-job-indexer", () => ({
  initializeTypesenseWorker: mockInitTypesenseWorker,
}));
vi.mock("@/workers/file-upload-worker", () => ({
  initializeFileUploadWorker: mockInitFileUploadWorker,
}));
vi.mock("@/workers/temp-file-cleanup-worker", () => ({
  initializeFileCleanupWorker: mockInitFileCleanupWorker,
  scheduleCleanupJob: mockScheduleCleanupJob,
}));
vi.mock("@/workers/job-alert-processor", () => ({
  initializeJobAlertWorker: mockInitJobAlertWorker,
  scheduleDailyAlertProcessing: mockScheduleDailyAlert,
  scheduleWeeklyAlertProcessing: mockScheduleWeeklyAlert,
  scheduleMonthlyAlertProcessing: mockScheduleMonthlyAlert,
}));
vi.mock("@/workers/inactive-user-alert-pauser", () => ({
  initializeInactiveUserAlertWorker: mockInitInactiveUserAlertWorker,
  scheduleInactiveUserAlertPausing: mockScheduleInactiveUserAlert,
}));
vi.mock("@/workers/invitation-expiration-worker", () => ({
  initializeInvitationExpirationWorker: mockInitInvitationExpirationWorker,
  scheduleInvitationExpirationJob: mockScheduleInvitationExpiration,
}));

// Stub non-critical infra so initializeInfrastructure doesn't hit real services
vi.mock("@/config/typesense-client", () => ({
  initializeTypesenseSchema: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/infrastructure/redis-cache.service", () => ({
  redisCacheService: { connect: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@/infrastructure/redis-rate-limiter.service", () => ({
  redisRateLimiterService: { connect: vi.fn().mockResolvedValue(undefined) },
}));

import { initializeInfrastructure } from "@/app";

const allWorkerMocks = [
  mockInitEmailWorker,
  mockInitTypesenseWorker,
  mockInitFileUploadWorker,
  mockInitFileCleanupWorker,
  mockInitJobAlertWorker,
  mockInitInactiveUserAlertWorker,
  mockInitInvitationExpirationWorker,
];

const allSchedulerMocks = [
  mockScheduleCleanupJob,
  mockScheduleDailyAlert,
  mockScheduleWeeklyAlert,
  mockScheduleMonthlyAlert,
  mockScheduleInactiveUserAlert,
  mockScheduleInvitationExpiration,
];

describe("initializeInfrastructure queue guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize workers and schedule jobs when queue connects", async () => {
    mockQueueInit.mockResolvedValue(undefined);

    await initializeInfrastructure();

    for (const mock of allWorkerMocks) {
      expect(mock).toHaveBeenCalledOnce();
    }
    for (const mock of allSchedulerMocks) {
      expect(mock).toHaveBeenCalledOnce();
    }
  });

  it("should skip workers and scheduled jobs when queue fails", async () => {
    mockQueueInit.mockRejectedValue(new Error("Redis connection refused"));

    await initializeInfrastructure();

    for (const mock of allWorkerMocks) {
      expect(mock).not.toHaveBeenCalled();
    }
    for (const mock of allSchedulerMocks) {
      expect(mock).not.toHaveBeenCalled();
    }
  });
});
