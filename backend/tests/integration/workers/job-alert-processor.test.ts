import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/connection";
import {
  jobAlerts,
  jobAlertMatches,
  jobsDetails,
  user,
  organizations,
} from "@/db/schema";
import { seedUser } from "@tests/utils/seed";
import { eq } from "drizzle-orm";
import { processJobAlerts } from "@/workers/job-alert-processor";
import type { SearchResponse } from "typesense/lib/Typesense/Documents";
import type { JobDocumentType } from "@/validations/base.validation";
import { organizationFixture } from "@tests/utils/fixtures";

// Mock TypesenseService to control search results
const mockSearchJobsForAlert = vi.fn();
vi.mock("@/infrastructure/typesense.service/typesense.service", () => ({
  TypesenseService: vi.fn().mockImplementation(() => ({
    searchJobsForAlert: mockSearchJobsForAlert,
  })),
}));

// Mock queue service to prevent actual email sending
vi.mock("@/infrastructure/queue.service", () => ({
  queueService: {
    addJob: vi.fn().mockResolvedValue(undefined),
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

  beforeEach(async () => {
    // Seed test user
    await seedUser();

    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, "normal.user@example.com"),
    });

    if (foundUser) {
      testUserId = foundUser.id;
    }

    const orgFixture = await organizationFixture();

    // Create test organization for jobs
    const [org] = await db
      .insert(organizations)
      .values(orgFixture)
      .$returningId();

    testOrgId = org!.id;

    // Clean up existing alerts and matches
    if (testUserId) {
      await db
        .delete(jobAlertMatches)
        .where(eq(jobAlertMatches.jobAlertId, testUserId));
      await db.delete(jobAlerts).where(eq(jobAlerts.userId, testUserId));
    }

    // Clean up existing jobs
    await db.delete(jobsDetails).where(eq(jobsDetails.employerId, testOrgId));

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

      // Mock Typesense response
      const nowTimestamp = Math.floor(Date.now() / 1000);
      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 1,
        hits: [
          {
            document: {
              id: testJobId.toString(),
              title: "JavaScript Developer",
              company: "Test Company",
              description: "JS role",
              city: "Seattle",
              state: "Washington",
              country: "USA",
              isRemote: false,
              status: "open",
              jobType: "full-time",
              experience: "mid",
              skills: ["JavaScript"],
              createdAt: nowTimestamp - 3600,
            },
            text_match: 100,
            text_match_info: {
              best_field_score: "100",
              best_field_weight: 1,
              fields_matched: 3,
              score: "95.5",
              tokens_matched: 2,
            },
            highlight: {} as any,
          },
        ],
        out_of: 1,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 15,
      };

      mockSearchJobsForAlert.mockResolvedValue(mockSearchResponse);

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

      const mockSearchResponse: SearchResponse<JobDocumentType> = {
        found: 0,
        hits: [],
        out_of: 0,
        page: 1,
        request_params: { per_page: 50 },
        search_time_ms: 5,
      };

      mockSearchJobsForAlert.mockResolvedValue(mockSearchResponse);

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
