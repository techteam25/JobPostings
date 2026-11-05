import { describe, it, expect, vi, beforeEach } from "vitest";
import { DomainEventType } from "@shared/events";
import type { DomainEvent } from "@shared/events";
import type { ApplicationSubmittedPayload } from "@/modules/applications/events/application-submitted.event";
import type { ApplicationWithdrawnPayload } from "@/modules/applications/events/application-withdrawn.event";
import type { UserDeactivatedPayload } from "@/modules/identity/events/user-deactivated.event";
import type { OwnershipTransferredPayload } from "@/modules/organizations/events/ownership-transferred.event";
import { emailJobSchemas } from "@/modules/notifications/workers/send-email.worker";

const { mockRegisterWorker, mockAddJob } = vi.hoisted(() => ({
  mockRegisterWorker: vi.fn(),
  mockAddJob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@shared/infrastructure/queue.service", () => ({
  queueService: {
    registerWorker: mockRegisterWorker,
    addJob: mockAddJob,
  },
  QUEUE_NAMES: {
    DOMAIN_EVENTS_QUEUE: "domainEventsQueue",
    EMAIL_QUEUE: "emailQueue",
    TYPESENSE_USER_PROFILE_QUEUE: "typesenseUserProfileQueue",
  },
}));

vi.mock("@shared/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { createDomainEventWorker } from "@shared/workers/domain-event.worker";

describe("Domain Event Worker", () => {
  const mockSyncJobApplicationCount = vi.fn().mockResolvedValue(undefined);
  const mockPauseAlertsForUser = vi.fn().mockResolvedValue(0);
  let processDomainEvent: (job: any) => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncJobApplicationCount.mockResolvedValue(undefined);
    mockPauseAlertsForUser.mockResolvedValue(0);
    mockAddJob.mockResolvedValue(undefined);

    const worker = createDomainEventWorker({
      applicationInsights: {
        syncJobApplicationCount: mockSyncJobApplicationCount,
      },
      notificationsRepository: {
        pauseAlertsForUser: mockPauseAlertsForUser,
      },
    });
    worker.initialize();

    processDomainEvent = mockRegisterWorker.mock.calls[0]![1];
  });

  describe("processDomainEvent", () => {
    it("should sync job application count for APPLICATION_SUBMITTED event", async () => {
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

      await processDomainEvent({
        id: "job-1",
        data: event,
        name: DomainEventType.APPLICATION_SUBMITTED,
      } as any);

      expect(mockSyncJobApplicationCount).toHaveBeenCalledWith(10);
      expect(mockSyncJobApplicationCount).toHaveBeenCalledOnce();
    });

    it("should sync job application count for APPLICATION_WITHDRAWN event", async () => {
      const payload: ApplicationWithdrawnPayload = {
        applicationId: 2,
        jobId: 11,
        applicantId: 6,
      };

      const event: DomainEvent<ApplicationWithdrawnPayload> = {
        eventType: DomainEventType.APPLICATION_WITHDRAWN,
        payload,
        occurredAt: new Date().toISOString(),
        correlationId: "withdraw-correlation-id",
      };

      await processDomainEvent({
        id: "job-1b",
        data: event,
        name: DomainEventType.APPLICATION_WITHDRAWN,
      } as any);

      expect(mockSyncJobApplicationCount).toHaveBeenCalledWith(11);
      expect(mockSyncJobApplicationCount).toHaveBeenCalledOnce();
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

      await processDomainEvent({
        id: "job-2",
        data: event,
        name: DomainEventType.USER_DEACTIVATED,
      } as any);

      expect(mockPauseAlertsForUser).toHaveBeenCalledWith(1);
      expect(mockPauseAlertsForUser).toHaveBeenCalledOnce();
    });

    it("should enqueue successor ownership email for OWNERSHIP_TRANSFERRED event", async () => {
      const payload: OwnershipTransferredPayload = {
        organizationId: 42,
        organizationName: "Acme Corp",
        previousOwnerUserId: 10,
        previousOwnerFullName: "Former Owner",
        newOwnerUserId: 20,
        newOwnerEmail: "new.owner@example.com",
        newOwnerFullName: "New Owner",
      };

      const event: DomainEvent<OwnershipTransferredPayload> = {
        eventType: DomainEventType.OWNERSHIP_TRANSFERRED,
        payload,
        occurredAt: new Date().toISOString(),
        correlationId: "ownership-transfer-correlation-id",
      };

      await processDomainEvent({
        id: "job-ownership-1",
        data: event,
        name: DomainEventType.OWNERSHIP_TRANSFERRED,
      } as any);

      expect(mockAddJob).toHaveBeenCalledWith(
        "emailQueue",
        "sendOwnershipTransferredEmail",
        {
          userId: 20,
          email: "new.owner@example.com",
          fullName: "New Owner",
          organizationId: 42,
          organizationName: "Acme Corp",
          previousOwnerFullName: "Former Owner",
        },
      );

      const emailPayload = mockAddJob.mock.calls[0]![2];
      const parsed =
        emailJobSchemas.sendOwnershipTransferredEmail.safeParse(emailPayload);
      expect(parsed.success).toBe(true);
    });

    it("should log warning for unknown event types", async () => {
      const logger = (await import("@shared/logger")).default;

      const event: DomainEvent = {
        eventType: "unknown.EventType" as DomainEventType,
        payload: {},
        occurredAt: new Date().toISOString(),
      };

      await processDomainEvent({
        id: "job-3",
        data: event,
        name: "unknown.EventType",
      } as any);

      expect(logger.warn).toHaveBeenCalledWith(
        "Unknown domain event type",
        expect.objectContaining({ eventType: "unknown.EventType" }),
      );
    });

    it("should rethrow errors from APPLICATION_SUBMITTED handler", async () => {
      mockSyncJobApplicationCount.mockRejectedValueOnce(
        new Error("DB connection failed"),
      );

      const event: DomainEvent<ApplicationSubmittedPayload> = {
        eventType: DomainEventType.APPLICATION_SUBMITTED,
        payload: { applicationId: 1, jobId: 10, applicantId: 5 },
        occurredAt: new Date().toISOString(),
      };

      await expect(
        processDomainEvent({
          id: "job-4",
          data: event,
          name: DomainEventType.APPLICATION_SUBMITTED,
        } as any),
      ).rejects.toThrow("DB connection failed");
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

      await expect(
        processDomainEvent({
          id: "job-5",
          data: event,
          name: DomainEventType.USER_DEACTIVATED,
        } as any),
      ).rejects.toThrow("Failed to pause alerts");
    });
  });
});
