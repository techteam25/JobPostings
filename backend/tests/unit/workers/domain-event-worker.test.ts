import { describe, it, expect, vi, beforeEach } from "vitest";
import { DomainEventType } from "@shared/events";
import type { DomainEvent } from "@shared/events";
import type { ApplicationSubmittedPayload } from "@/modules/applications/events/application-submitted.event";
import type { UserDeactivatedPayload } from "@/modules/identity/events/user-deactivated.event";

const { mockIncrementJobApplications, mockPauseAlertsForUser } = vi.hoisted(
  () => ({
    mockIncrementJobApplications: vi.fn().mockResolvedValue(undefined),
    mockPauseAlertsForUser: vi.fn().mockResolvedValue(0),
  }),
);

vi.mock("@shared/infrastructure/queue.service", () => ({
  queueService: {
    registerWorker: vi.fn(),
  },
  QUEUE_NAMES: {
    DOMAIN_EVENTS_QUEUE: "domainEventsQueue",
  },
}));

vi.mock("@/modules/job-board", () => ({
  JobInsightsRepository: vi.fn().mockImplementation(() => ({
    incrementJobApplications: mockIncrementJobApplications,
  })),
}));

vi.mock("@/modules/notifications", () => ({
  NotificationsRepository: vi.fn().mockImplementation(() => ({
    pauseAlertsForUser: mockPauseAlertsForUser,
  })),
}));

vi.mock("@shared/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { processDomainEvent } from "@/workers/domain-event-worker";

describe("Domain Event Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("processDomainEvent", () => {
    it("should increment job application count for APPLICATION_SUBMITTED event", async () => {
      const payload: ApplicationSubmittedPayload = {
        applicationId: 1,
        jobId: 10,
        applicantId: 5,
      };

      const event: DomainEvent<ApplicationSubmittedPayload> = {
        eventType: DomainEventType.APPLICATION_SUBMITTED,
        payload,
        occurredAt: new Date().toISOString(),
        correlationId: "test-correlation-id",
      };

      const mockJob = {
        id: "job-1",
        data: event,
        name: DomainEventType.APPLICATION_SUBMITTED,
      } as any;

      await processDomainEvent(mockJob);

      expect(mockIncrementJobApplications).toHaveBeenCalledWith(10);
      expect(mockIncrementJobApplications).toHaveBeenCalledOnce();
    });

    it("should pause alerts for USER_DEACTIVATED event", async () => {
      mockPauseAlertsForUser.mockResolvedValueOnce(3);

      const payload: UserDeactivatedPayload = {
        userId: 1,
        email: "test@example.com",
        deactivatedAt: new Date().toISOString(),
      };

      const event: DomainEvent<UserDeactivatedPayload> = {
        eventType: DomainEventType.USER_DEACTIVATED,
        payload,
        occurredAt: new Date().toISOString(),
        correlationId: "deactivation-correlation-id",
      };

      const mockJob = {
        id: "job-2",
        data: event,
        name: DomainEventType.USER_DEACTIVATED,
      } as any;

      await processDomainEvent(mockJob);

      expect(mockPauseAlertsForUser).toHaveBeenCalledWith(1);
      expect(mockPauseAlertsForUser).toHaveBeenCalledOnce();
    });

    it("should log warning for unknown event types", async () => {
      const logger = (await import("@shared/logger")).default;

      const event: DomainEvent = {
        eventType: "unknown.EventType" as DomainEventType,
        payload: {},
        occurredAt: new Date().toISOString(),
      };

      const mockJob = {
        id: "job-3",
        data: event,
        name: "unknown.EventType",
      } as any;

      await processDomainEvent(mockJob);

      expect(logger.warn).toHaveBeenCalledWith(
        "Unknown domain event type",
        expect.objectContaining({ eventType: "unknown.EventType" }),
      );
    });

    it("should rethrow errors from APPLICATION_SUBMITTED handler", async () => {
      mockIncrementJobApplications.mockRejectedValueOnce(
        new Error("DB connection failed"),
      );

      const event: DomainEvent<ApplicationSubmittedPayload> = {
        eventType: DomainEventType.APPLICATION_SUBMITTED,
        payload: { applicationId: 1, jobId: 10, applicantId: 5 },
        occurredAt: new Date().toISOString(),
      };

      const mockJob = {
        id: "job-4",
        data: event,
        name: DomainEventType.APPLICATION_SUBMITTED,
      } as any;

      await expect(processDomainEvent(mockJob)).rejects.toThrow(
        "DB connection failed",
      );
    });

    it("should rethrow errors from USER_DEACTIVATED handler", async () => {
      mockPauseAlertsForUser.mockRejectedValueOnce(
        new Error("Failed to pause alerts"),
      );

      const event: DomainEvent<UserDeactivatedPayload> = {
        eventType: DomainEventType.USER_DEACTIVATED,
        payload: {
          userId: 1,
          email: "test@example.com",
          deactivatedAt: new Date().toISOString(),
        },
        occurredAt: new Date().toISOString(),
      };

      const mockJob = {
        id: "job-5",
        data: event,
        name: DomainEventType.USER_DEACTIVATED,
      } as any;

      await expect(processDomainEvent(mockJob)).rejects.toThrow(
        "Failed to pause alerts",
      );
    });
  });
});
