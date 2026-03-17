import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@shared/db/connection";
import { jobAlerts, jobAlertMatches, jobsDetails } from "@/db/schema";
import { seedUserScenario } from "@tests/utils/seedScenarios";
import { createOrganization } from "@tests/utils/seedBuilders";
import { eq } from "drizzle-orm";
import { createJobAlertProcessorWorker } from "@/modules/notifications/workers/job-alert-processor.worker";
import { NotificationsRepository } from "@/modules/notifications";
import { ok } from "@shared/result";
import type { JobMatchingServicePort } from "@/modules/notifications/ports/job-matching-service.port";

const mockRegisterWorker = vi.hoisted(() => vi.fn());

// Mock queue service to prevent actual email sending
vi.mock("@shared/infrastructure/queue.service", () => ({
  queueService: {
    addJob: vi.fn().mockResolvedValue(undefined),
    registerWorker: mockRegisterWorker,
  },
  QUEUE_NAMES: {
    EMAIL_QUEUE: "emailQueue",
    JOB_ALERT_QUEUE: "jobAlertQueue",
  },
}));

describe("Job Alert Processing Integration Tests", () => {
  let testUserId: number;
  let testOrgId: number;
  let testJobId: number;
  let processJobAlerts: (job: any) => Promise<any>;

  const mockFindMatchingJobsForAlert = vi.fn();

  beforeEach(async () => {
    // Seed test user (cleanAll() runs via setupTests.ts beforeEach)
    const { user: seededUser } = await seedUserScenario();
    testUserId = seededUser.id;

    // Create test organization for jobs
    const org = await createOrganization();
    testOrgId = org.id;

    // Create a test job that can be referenced in matches
    const [job] = await db
      .insert(jobsDetails)
      .values({
        title: "JavaScript Developer",
        description: "JS role",
        city: "Seattle",
        state: "Washington",
        country: "USA",
        jobType: "full-time",
        compensationType: "paid",
        experience: "mid",
        isRemote: false,
        isActive: true,
        employerId: testOrgId,
      })
      .$returningId();

    testJobId = job!.id;

    // Clear all mocks before each test
    vi.clearAllMocks();

    // Create worker with real NotificationsRepository and mock JobMatchingService
    const mockJobMatchingService: JobMatchingServicePort = {
      findMatchingJobsForAlert: mockFindMatchingJobsForAlert,
    };

    const notificationsRepository = new NotificationsRepository();

    const worker = createJobAlertProcessorWorker({
      notificationsRepository,
      jobMatchingService: mockJobMatchingService,
    });
    worker.initialize();

    // Capture the handler registered with the worker
    processJobAlerts = mockRegisterWorker.mock.calls[0]![1];
  });

  describe("End-to-End Alert Processing", () => {
    it("should process alerts and create matches", async () => {
      // Create alert
      const [alert] = await db
        .insert(jobAlerts)
        .values({
          userId: testUserId,
          name: "JavaScript Developer",
          description: "Looking for JS roles",
          searchQuery: "javascript developer",
          city: "Seattle",
          state: "Washington",
          frequency: "daily",
          isActive: true,
          isPaused: false,
          lastSentAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        })
        .$returningId();

      // Mock JobMatchingService to return matches (Result type)
      mockFindMatchingJobsForAlert.mockResolvedValue(
        ok([
          {
            job: {
              id: testJobId,
              title: "JavaScript Developer",
              description: "JS role",
              city: "Seattle",
              state: "Washington",
              country: "USA",
              jobType: "full-time",
              experience: "mid",
            },
            matchScore: 95.5,
          },
        ]),
      );

      // Run worker
      const result = await processJobAlerts({
        data: { frequency: "daily" },
      } as any);

      // Verify results
      expect(result.processed).toBeGreaterThan(0);
      expect(result.matchesFound).toBeGreaterThan(0);

      // Verify matches saved
      const savedMatches = await db.query.jobAlertMatches.findMany({
        where: eq(jobAlertMatches.jobAlertId, alert!.id),
      });

      expect(savedMatches.length).toBeGreaterThan(0);
      // Matches are marked as sent after email is queued
      expect(savedMatches[0]?.wasSent).toBe(true);
    });

    it("should skip paused alerts", async () => {
      const [alert] = await db
        .insert(jobAlerts)
        .values({
          userId: testUserId,
          name: "Paused Alert",
          description: "Test",
          searchQuery: "test",
          frequency: "daily",
          isActive: true,
          isPaused: true,
          lastSentAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        })
        .$returningId();

      await processJobAlerts({
        data: { frequency: "daily" },
      } as any);

      const matches = await db.query.jobAlertMatches.findMany({
        where: eq(jobAlertMatches.jobAlertId, alert!.id),
      });

      expect(matches.length).toBe(0);
    });

    it("should handle no matches gracefully", async () => {
      const [alert] = await db
        .insert(jobAlerts)
        .values({
          userId: testUserId,
          name: "No Matches",
          description: "Test",
          searchQuery: "very rare xyz123",
          frequency: "daily",
          isActive: true,
          isPaused: false,
          lastSentAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        })
        .$returningId();

      // Mock JobMatchingService to return empty matches
      mockFindMatchingJobsForAlert.mockResolvedValue(ok([]));

      const result = await processJobAlerts({
        data: { frequency: "daily" },
      } as any);

      expect(result.matchesFound).toBe(0);

      // Verify lastSentAt updated
      const updatedAlert = await db.query.jobAlerts.findFirst({
        where: eq(jobAlerts.id, alert!.id),
      });

      expect(new Date(updatedAlert!.lastSentAt!).getTime()).toBeGreaterThan(
        Date.now() - 5000,
      );
    });
  });
});
