import { describe, it, expect, vi, beforeEach } from "vitest";
import { emailJobSchemas } from "@/modules/notifications/workers/send-email.worker";
import {
  queueService,
  QUEUE_NAMES,
} from "@shared/infrastructure/queue.service";

// Mock auth module — IdentityService imports auth.ts at the top level
vi.mock("@/utils/auth", () => ({
  auth: { api: { updateUser: vi.fn(), deleteUser: vi.fn() } },
}));

import { JobBoardService } from "@/modules/job-board/services/job-board.service";
import { ApplicationsService } from "@/modules/applications/services/applications.service";
import { IdentityService } from "@/modules/identity/services/identity.service";

import type { JobBoardRepositoryPort } from "@/modules/job-board/ports/job-board-repository.port";
import type { JobInsightsRepositoryPort } from "@/modules/job-board/ports/job-insights-repository.port";
import type { TypesenseJobServicePort } from "@shared/ports/typesense-service.port";
import type { ApplicationStatusQueryPort } from "@/modules/job-board/ports/application-status-query.port";
import type { SavedJobsStatusQueryPort } from "@/modules/job-board/ports/saved-jobs-status-query.port";
import type { OrgMembershipForJobPort } from "@/modules/job-board/ports/org-membership-for-job.port";
import type { UserContactQueryPort } from "@/modules/job-board/ports/user-contact-query.port";

import type { ApplicationsRepositoryPort } from "@/modules/applications/ports/applications-repository.port";
import type { JobDetailsQueryPort } from "@/modules/applications/ports/job-details-query.port";
import type { OrgMembershipQueryPort } from "@/modules/applications/ports/org-membership-query.port";
import type { ApplicantQueryPort } from "@/modules/applications/ports/applicant-query.port";

import type { IdentityRepositoryPort } from "@/modules/identity/ports/identity-repository.port";
import type { EmailServicePort } from "@shared/ports/email-service.port";
import type { EventBusPort } from "@shared/events";

/**
 * Contract tests: verify that every service dispatching an email job
 * sends a payload that passes the worker's Zod schema.
 *
 * Services are constructed with mock dependencies via DI — no prototype
 * spying needed.
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

// ─── Mock factories ──────────────────────────────────────────────────

function createMockJobBoardRepository(): JobBoardRepositoryPort {
  return {
    createJob: vi.fn(),
    updateJob: vi.fn(),
    findJobById: vi.fn(),
    findActiveJobs: vi.fn(),
    findJobsByEmployer: vi.fn(),
    findJobByIdWithSkills: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as JobBoardRepositoryPort;
}

function createMockJobInsightsRepository(): JobInsightsRepositoryPort {
  return {
    incrementJobViews: vi.fn(),
    getJobInsightByOrganizationId: vi.fn(),
  } as unknown as JobInsightsRepositoryPort;
}

function createMockTypesenseService(): TypesenseJobServicePort {
  return {
    indexJobDocument: vi.fn(),
    indexManyJobDocuments: vi.fn(),
    retrieveJobDocumentById: vi.fn(),
    upsertJobDocument: vi.fn(),
    deleteJobDocumentById: vi.fn(),
    deleteJobDocumentByTitle: vi.fn(),
    searchJobsCollection: vi.fn(),
    searchJobsForAlert: vi.fn(),
  } as unknown as TypesenseJobServicePort;
}

function createMockApplicationStatusQuery(): ApplicationStatusQueryPort {
  return {
    getAppliedJobIds: vi.fn(),
    hasUserApplied: vi.fn(),
    hasApplicationsForJob: vi.fn(),
  };
}

function createMockSavedJobsStatusQuery(): SavedJobsStatusQueryPort {
  return {
    getSavedJobIds: vi.fn(),
    hasUserSavedJob: vi.fn(),
  };
}

function createMockOrgMembershipForJob(): OrgMembershipForJobPort {
  return {
    findByContact: vi.fn(),
    organizationExists: vi.fn(),
  };
}

function createMockUserContactQuery(): UserContactQueryPort {
  return {
    getUserContactInfo: vi.fn(),
  };
}

function createMockApplicationsRepository(): ApplicationsRepositoryPort {
  return {
    createApplication: vi.fn(),
    findApplicationsByJob: vi.fn(),
    findApplicationsByUser: vi.fn(),
    updateApplicationStatus: vi.fn(),
    findApplicationById: vi.fn(),
    hasUserAppliedToJob: vi.fn(),
    deleteJobApplicationsByUserId: vi.fn(),
    getJobApplicationForOrganization: vi.fn(),
    updateOrgJobApplicationStatus: vi.fn(),
    createJobApplicationNote: vi.fn(),
    getNotesForJobApplication: vi.fn(),
    getJobApplicationsForOrganization: vi.fn(),
    getApplicationsForOrganization: vi.fn(),
  } as unknown as ApplicationsRepositoryPort;
}

function createMockJobDetailsQuery(): JobDetailsQueryPort {
  return {
    getJobForApplication: vi.fn(),
    getJobWithEmployerId: vi.fn(),
    doesJobExist: vi.fn(),
  };
}

function createMockOrgMembershipQuery(): OrgMembershipQueryPort {
  return {
    findByContact: vi.fn(),
  };
}

function createMockApplicantQuery(): ApplicantQueryPort {
  return {
    findById: vi.fn(),
  };
}

function createMockIdentityRepository(): IdentityRepositoryPort {
  return {
    findByEmail: vi.fn(),
    findByIdWithPassword: vi.fn(),
    findUserById: vi.fn(),
    deactivateUserAccount: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findDeactivatedUserIds: vi.fn(),
    updateFullName: vi.fn(),
    syncIntent: vi.fn(),
  };
}

function createMockEmailService(): EmailServicePort {
  return {
    sendEmailVerification: vi.fn(),
    sendPasswordChangedEmail: vi.fn(),
    sendJobApplicationConfirmation: vi.fn(),
    sendApplicationWithdrawalConfirmation: vi.fn(),
    sendJobDeletionEmail: vi.fn(),
    sendOrganizationInvitation: vi.fn(),
    sendOrganizationWelcome: vi.fn(),
    sendApplicationStatusUpdate: vi.fn(),
    sendJobAlertNotification: vi.fn(),
    sendUnsubscribeConfirmation: vi.fn(),
    sendAccountDeactivationConfirmation: vi.fn(),
    sendAccountDeletionConfirmation: vi.fn(),
    sendDeleteAccountEmailVerification: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    sendWelcomeEmail: vi.fn(),
  };
}

function createMockEventBus(): EventBusPort {
  return {
    publish: vi.fn(),
  };
}

describe("Email Job Contract Tests", () => {
  beforeEach(() => {
    addJobMock.mockClear();
  });

  describe("JobBoardService email dispatches", () => {
    it("deleteJob sends a valid sendJobDeletionEmail payload", async () => {
      const jobBoardRepository = createMockJobBoardRepository();
      const applicationStatusQuery = createMockApplicationStatusQuery();
      const userContactQuery = createMockUserContactQuery();

      (
        jobBoardRepository.findJobById as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        job: { id: 1, title: "Test Job", employerId: 10 },
        employer: { id: 10, name: "Acme" },
      });
      (
        applicationStatusQuery.hasApplicationsForJob as ReturnType<typeof vi.fn>
      ).mockResolvedValue(false);
      (jobBoardRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(
        true,
      );
      (
        userContactQuery.getUserContactInfo as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        email: "user@test.com",
        fullName: "Test User",
      });

      const service = new JobBoardService(
        jobBoardRepository,
        createMockJobInsightsRepository(),
        createMockTypesenseService(),
        applicationStatusQuery,
        createMockSavedJobsStatusQuery(),
        createMockOrgMembershipForJob(),
        userContactQuery,
      );

      await service.deleteJob(1, 5);

      expectEmailDispatched("sendJobDeletionEmail");
    });
  });

  describe("ApplicationsService email dispatches", () => {
    it("applyForJob sends a valid sendJobApplicationConfirmation payload", async () => {
      const applicationsRepository = createMockApplicationsRepository();
      const jobDetailsQuery = createMockJobDetailsQuery();
      const applicantQuery = createMockApplicantQuery();
      const eventBus = createMockEventBus();

      (
        jobDetailsQuery.getJobForApplication as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: 1,
        title: "Test Job",
        isActive: true,
        applicationDeadline: null,
        employerId: 10,
      });
      (
        applicationsRepository.hasUserAppliedToJob as ReturnType<typeof vi.fn>
      ).mockResolvedValue(false);
      (
        applicationsRepository.createApplication as ReturnType<typeof vi.fn>
      ).mockResolvedValue(100);
      (applicantQuery.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
        email: "applicant@test.com",
        fullName: "Test Applicant",
      });

      const service = new ApplicationsService(
        applicationsRepository,
        jobDetailsQuery,
        createMockOrgMembershipQuery(),
        applicantQuery,
        eventBus,
      );

      await service.applyForJob(
        { jobId: 1, applicantId: 5, status: "pending" },
        "corr-123",
      );

      expectEmailDispatched("sendJobApplicationConfirmation");
    });

    it("withdrawApplication sends a valid sendApplicationWithdrawalConfirmation payload", async () => {
      const applicationsRepository = createMockApplicationsRepository();
      const applicantQuery = createMockApplicantQuery();

      (
        applicationsRepository.findApplicationById as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        application: { id: 100, jobId: 1, applicantId: 5, status: "pending" },
        job: { id: 1, title: "Test Job" },
      });
      (
        applicationsRepository.updateApplicationStatus as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue(true);
      (applicantQuery.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
        email: "user@test.com",
        fullName: "Test User",
      });

      const service = new ApplicationsService(
        applicationsRepository,
        createMockJobDetailsQuery(),
        createMockOrgMembershipQuery(),
        applicantQuery,
        createMockEventBus(),
      );

      await service.withdrawApplication(100, 5);

      expectEmailDispatched("sendApplicationWithdrawalConfirmation");
    });
  });

  describe("sendPasswordResetEmail schema", () => {
    it("accepts valid password reset email payload", () => {
      const payload = {
        userId: 1,
        email: "user@test.com",
        fullName: "Test User",
        resetUrl:
          "https://example.com/api/auth/reset-password/abc123?callbackURL=https://frontend.com/reset-password",
      };

      expectValidPayload("sendPasswordResetEmail", payload);
    });

    it("rejects payload missing resetUrl", () => {
      const payload = {
        userId: 1,
        email: "user@test.com",
        fullName: "Test User",
      };

      const schema = emailJobSchemas.sendPasswordResetEmail;
      const result = schema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("IdentityService email dispatches", () => {
    it("deactivateUser sends sendAccountDeactivationConfirmation (not Deletion)", async () => {
      const identityRepository = createMockIdentityRepository();
      const eventBus = createMockEventBus();

      (
        identityRepository.findById as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: 5,
        email: "user@test.com",
        fullName: "Test User",
        status: "active",
      });
      (identityRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        true,
      );
      (
        identityRepository.findUserById as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: 5,
        email: "user@test.com",
        fullName: "Test User",
        image: null,
        status: "deactivated",
      });

      const service = new IdentityService(
        identityRepository,
        createMockEmailService(),
        eventBus,
      );

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
