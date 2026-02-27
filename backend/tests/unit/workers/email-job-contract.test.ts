import { describe, it, expect, vi, beforeEach } from "vitest";
import { emailJobSchemas } from "@/workers/send-email-worker";
import { queueService, QUEUE_NAMES } from "@/infrastructure/queue.service";
import { JobService } from "@/services/job.service";
import { JobRepository } from "@/repositories/job.repository";
import { UserRepository } from "@/repositories/user.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";

// Mock auth module to break circular dependency (auth.ts → UserService → auth.ts)
vi.mock("@/utils/auth", () => ({
  auth: { api: { updateUser: vi.fn(), deleteUser: vi.fn() } },
}));

// Import UserService after auth mock is set up
import { UserService } from "@/services/user.service";

/**
 * Contract tests: verify that every service dispatching an email job
 * sends a payload that passes the worker's Zod schema.
 *
 * These tests spy on repository prototypes (same pattern as existing tests),
 * call the service method, then validate the payload passed to
 * queueService.addJob against the email worker's Zod schema.
 */

const addJobMock = queueService.addJob as ReturnType<typeof vi.fn>;

/** Extract all EMAIL_QUEUE calls from the addJob mock */
function getEmailJobCalls() {
  return (addJobMock.mock.calls as [string, string, unknown][])
    .filter(([queueName]) => queueName === QUEUE_NAMES.EMAIL_QUEUE)
    .map(([, jobName, payload]) => ({ jobName, payload }));
}

/** Validate a single email job call against its Zod schema */
function expectValidPayload(jobName: string, payload: unknown) {
  const schema = emailJobSchemas[jobName as keyof typeof emailJobSchemas];
  expect(schema, `No schema found for email job "${jobName}"`).toBeDefined();

  const result = schema.safeParse(payload);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Email job "${jobName}" payload failed schema validation:\n${issues}\n\nPayload: ${JSON.stringify(payload, null, 2)}`,
    );
  }
}

/** Find and validate a specific email job dispatch */
function expectEmailDispatched(jobName: string) {
  const calls = getEmailJobCalls();
  const match = calls.find((c) => c.jobName === jobName);
  expect(
    match,
    `Expected "${jobName}" to be dispatched via EMAIL_QUEUE`,
  ).toBeDefined();
  expectValidPayload(match!.jobName, match!.payload);
}

describe("Email Job Contract Tests", () => {
  beforeEach(() => {
    addJobMock.mockClear();
    vi.restoreAllMocks();
  });

  describe("JobService email dispatches", () => {
    it("deleteJob sends a valid sendJobDeletionEmail payload", async () => {
      vi.spyOn(JobRepository.prototype, "findJobById").mockResolvedValue({
        job: { id: 1, title: "Test Job", employerId: 10 },
        employer: { id: 10, name: "Acme" },
      } as any);
      vi.spyOn(JobRepository.prototype, "findApplicationsByJob").mockResolvedValue({
        items: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrevious: false, nextPage: null, previousPage: null },
      });
      vi.spyOn(JobRepository.prototype, "delete").mockResolvedValue(true);
      vi.spyOn(UserRepository.prototype, "findById").mockResolvedValue({
        id: 5,
        email: "user@test.com",
        fullName: "Test User",
      } as any);

      const service = new JobService();
      await service.deleteJob(1, 5, 10);

      expectEmailDispatched("sendJobDeletionEmail");
    });

    it("applyForJob sends a valid sendJobApplicationConfirmation payload", async () => {
      vi.spyOn(JobRepository.prototype, "findJobById").mockResolvedValue({
        job: {
          id: 1,
          title: "Test Job",
          isActive: true,
          applicationDeadline: null,
          employerId: 10,
        },
        employer: { id: 10, name: "Acme" },
      } as any);
      vi.spyOn(
        JobRepository.prototype,
        "hasUserAppliedToJob",
      ).mockResolvedValue(false);
      vi.spyOn(
        JobRepository.prototype,
        "createApplication",
      ).mockResolvedValue(100);
      vi.spyOn(UserRepository.prototype, "findById").mockResolvedValue({
        id: 5,
        email: "applicant@test.com",
        fullName: "Test Applicant",
      } as any);

      const service = new JobService();
      await service.applyForJob(
        { jobId: 1, applicantId: 5, status: "pending" },
        "corr-123",
      );

      expectEmailDispatched("sendJobApplicationConfirmation");
    });

    it("withdrawApplication sends a valid sendApplicationWithdrawalConfirmation payload", async () => {
      vi.spyOn(
        JobRepository.prototype,
        "findApplicationById",
      ).mockResolvedValue({
        application: { id: 100, jobId: 1, applicantId: 5, status: "pending" },
        job: { title: "Test Job" },
      } as any);
      vi.spyOn(
        JobRepository.prototype,
        "updateApplicationStatus",
      ).mockResolvedValue(true);
      vi.spyOn(UserRepository.prototype, "findById").mockResolvedValue({
        id: 5,
        email: "user@test.com",
        fullName: "Test User",
      } as any);

      const service = new JobService();
      await service.withdrawApplication(100, 5);

      expectEmailDispatched("sendApplicationWithdrawalConfirmation");
    });
  });

  describe("UserService email dispatches", () => {
    it("deactivateUser sends sendAccountDeactivationConfirmation (not Deletion)", async () => {
      vi.spyOn(UserRepository.prototype, "findById").mockResolvedValue({
        id: 5,
        email: "user@test.com",
        fullName: "Test User",
        status: "active",
      } as any);
      vi.spyOn(UserRepository.prototype, "update").mockResolvedValue(true);
      vi.spyOn(
        UserRepository.prototype,
        "findByIdWithProfile",
      ).mockResolvedValue({
        id: 5,
        email: "user@test.com",
        fullName: "Test User",
        status: "deactivated",
      } as any);

      const service = new UserService();
      await service.deactivateUser(5, 1);

      // Verify correct job name (not sendAccountDeletionConfirmation)
      const calls = getEmailJobCalls();
      const deactivateCall = calls.find(
        (c) => c.jobName === "sendAccountDeactivationConfirmation",
      );
      const deleteCall = calls.find(
        (c) => c.jobName === "sendAccountDeletionConfirmation",
      );
      expect(
        deactivateCall,
        "Should dispatch sendAccountDeactivationConfirmation",
      ).toBeDefined();
      expect(
        deleteCall,
        "Should NOT dispatch sendAccountDeletionConfirmation for deactivation",
      ).toBeUndefined();

      expectValidPayload(deactivateCall!.jobName, deactivateCall!.payload);
    });
  });
});
