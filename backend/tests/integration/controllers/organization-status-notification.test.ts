import { eq } from "drizzle-orm";
import { db } from "@/db/connection";
import {
  user,
  jobsDetails,
} from "@/db/schema";
import { JobRepository } from "@/repositories/job.repository";
import { request, TestHelpers } from "@tests/utils/testHelpers";
import {
  expect,
  vi,
  describe,
  it,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";
import { auth } from "@/utils/auth";
import { seedUserWithRoleScenario } from "@tests/utils/seedScenarios";
import { createJobApplication } from "@tests/utils/seedBuilders";

describe("Application Status Change Notification Integration Tests", () => {
  let cookie: string;
  let organizationId: number;
  let jobId: number;
  let applicationId: number;
  let applicantEmail: string;
  let applicantFullName: string;
  let jobTitle: string;
  let jobRepository: JobRepository;

  // Helper function to seed test data
  async function seedTestApplicationData() {
    const { faker } = await import("@faker-js/faker");

    // Create organization owner using seedUserWithRoleScenario
    const { user: ownerUser, org } = await seedUserWithRoleScenario("owner", "org.owner@example.com");

    // Create job
    const jobTitle = faker.person.jobTitle();
    const [jobResult] = await db
      .insert(jobsDetails)
      .values({
        title: jobTitle,
        description: faker.lorem.paragraphs(3),
        city: faker.location.city(),
        state: faker.location.state(),
        country: "United States",
        zipcode: parseInt(faker.location.zipCode("#####")),
        employerId: org.id,
        jobType: "full-time",
        compensationType: "paid",
        isRemote: false,
        isActive: true,
      })
      .$returningId();

    if (!jobResult) {
      throw new Error("Failed to create job");
    }

    const job = {
      id: jobResult.id,
      title: jobTitle,
    };

    // Create applicant
    const applicant = await auth.api.signUpEmail({
      body: {
        email: "applicant.user@example.com",
        password: "Password@123",
        name: faker.person.firstName() + " " + faker.person.lastName(),
        image: faker.image.avatar(),
      },
    });

    // Create application
    const application = await createJobApplication(job.id, Number(applicant.user.id));

    // Fetch applicant details
    const applicantRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, Number(applicant.user.id)))
      .limit(1);

    return {
      ownerUser: {
        id: ownerUser.id,
        email: ownerUser.email,
      },
      organization: {
        id: org.id,
      },
      job: {
        id: job.id,
        title: job.title,
      },
      applicant: {
        id: Number(applicant.user.id),
        email: applicant.user.email,
        fullName: applicantRecord[0]?.fullName || "",
      },
      application: {
        id: application.id,
      },
    };
  }

  beforeAll(() => {
    jobRepository = new JobRepository();

    // Mock email queue to prevent actual email sending during tests
    vi.spyOn(queueService, "addJob").mockResolvedValue({} as any);
  });

  beforeEach(async () => {
    // Seed data (cleanAll() runs via setupTests.ts beforeEach)
    const { ownerUser, organization, job, applicant, application } =
      await seedTestApplicationData();

    // Login to get cookie
    const loginResponse = await request.post("/api/auth/sign-in/email").send({
      email: ownerUser.email,
      password: "Password@123",
    });
    cookie = loginResponse.headers["set-cookie"]
      ? loginResponse.headers["set-cookie"][0]!
      : "";

    // Store IDs and data for tests
    organizationId = organization.id;
    jobId = job.id;
    applicationId = application.id;
    applicantEmail = applicant.email;
    applicantFullName = applicant.fullName;
    jobTitle = job.title;

    // Clear mock calls before each test to ensure isolation
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("Status Update Notification - Happy Path", () => {
    it("should queue email notification when status changes from pending to reviewed", async () => {

      const newStatus = "reviewed";
      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: newStatus });

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data.status).toBe(newStatus);

      expect(queueService.addJob).toHaveBeenCalledTimes(1);
      const callArgs = (queueService.addJob as any).mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs![0]).toBe(QUEUE_NAMES.EMAIL_QUEUE);
      expect(callArgs![1]).toBe("sendApplicationStatusUpdate");
      expect(callArgs![2]).toMatchObject({
        email: applicantEmail,
        fullName: applicantFullName,
        jobTitle: expect.any(String),
        oldStatus: "pending",
        newStatus: newStatus,
        applicationId: applicationId,
      });
    });

    it("should queue email notification when status changes from reviewed to shortlisted", async () => {

      // First update to reviewed
      await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      vi.clearAllMocks();

      // Then update to shortlisted
      const newStatus = "shortlisted";
      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: newStatus });

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data.status).toBe(newStatus);

      expect(queueService.addJob).toHaveBeenCalledTimes(1);
      expect(queueService.addJob).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendApplicationStatusUpdate",
        expect.objectContaining({
          oldStatus: "reviewed",
          newStatus: newStatus,
        }),
      );
    });

    it("should queue email notification when status changes to rejected", async () => {

      // First transition to reviewed (required before rejected)
      await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      vi.clearAllMocks();

      // Then transition to rejected
      const newStatus = "rejected";
      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: newStatus });

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data.status).toBe(newStatus);

      expect(queueService.addJob).toHaveBeenCalledTimes(1);
      expect(queueService.addJob).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendApplicationStatusUpdate",
        expect.objectContaining({
          newStatus: newStatus,
        }),
      );
    });

    it("should queue email notification when status changes to hired", async () => {

      // First transition through the required path: reviewed → shortlisted → interviewing
      await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "shortlisted" });

      await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "interviewing" });

      vi.clearAllMocks();

      // Then transition to hired
      const newStatus = "hired";
      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: newStatus });

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data.status).toBe(newStatus);

      expect(queueService.addJob).toHaveBeenCalledTimes(1);
      expect(queueService.addJob).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendApplicationStatusUpdate",
        expect.objectContaining({
          newStatus: newStatus,
        }),
      );
    });

    it("should queue email notification when status changes to interviewing", async () => {

      // First transition to shortlisted (required before interviewing)
      await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "shortlisted" });

      vi.clearAllMocks();

      // Then transition to interviewing
      const newStatus = "interviewing";
      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: newStatus });

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data.status).toBe(newStatus);

      expect(queueService.addJob).toHaveBeenCalledTimes(1);
      expect(queueService.addJob).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendApplicationStatusUpdate",
        expect.objectContaining({
          newStatus: newStatus,
        }),
      );
    });

    it("should queue email notification for multiple status transitions", async () => {

      // First transition: pending → reviewed
      await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      expect(queueService.addJob).toHaveBeenCalledTimes(1);
      expect(queueService.addJob).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendApplicationStatusUpdate",
        expect.objectContaining({
          oldStatus: "pending",
          newStatus: "reviewed",
        }),
      );

      vi.clearAllMocks();

      // Second transition: reviewed → shortlisted
      await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "shortlisted" });

      expect(queueService.addJob).toHaveBeenCalledTimes(1);
      expect(queueService.addJob).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendApplicationStatusUpdate",
        expect.objectContaining({
          oldStatus: "reviewed",
          newStatus: "shortlisted",
        }),
      );
    });
  });

  describe("Status Update Notification - No Notification Cases", () => {
    it("should not queue email notification when status does not change", async () => {

      // First update to reviewed
      await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      vi.clearAllMocks();

      // Try to update to the same status (this should be allowed by the API)
      // Note: The API might return 200 even if status doesn't change
      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      // The API should handle this gracefully (either 200 or 400)
      // The important part is that no email is queued
      expect([200, 400]).toContain(response.status);

      // Should not queue email since status didn't change
      expect(queueService.addJob).not.toHaveBeenCalled();
    });
  });

  describe("Status Update Notification - Error Handling", () => {
    it("should succeed status update even if queue service fails", async () => {

      // Mock queue service to throw an error
      vi.spyOn(queueService, "addJob").mockRejectedValueOnce(
        new Error("Queue service error"),
      );

      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      // Status update should still succeed
      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("status", "reviewed");

      // Verify status was actually updated in database
      const application =
        await jobRepository.findApplicationById(applicationId);
      expect(application?.application.status).toBe("reviewed");
    });
  });

  describe("Status Update Notification - Data Verification", () => {
    it("should pass correct applicant email and full name to queue", async () => {

      vi.clearAllMocks();

      // Fetch current application data before the test
      const currentApplication =
        await jobRepository.findApplicationById(applicationId);
      if (!currentApplication) {
        throw new Error("Test application not found");
      }

      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      TestHelpers.validateApiResponse(response, 200);

      // Verify the queue was called with correct structure
      expect(queueService.addJob).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendApplicationStatusUpdate",
        expect.objectContaining({
          email: expect.stringMatching(/@/), // Valid email format
          fullName: expect.any(String), // Any string for full name
        }),
      );

      // Verify it matches the actual applicant data from database
      const callArgs = (queueService.addJob as any).mock.calls[0];
      if (callArgs && callArgs[2]) {
        const jobData = callArgs[2] as any;
        expect(jobData.email).toBe(currentApplication.applicant.email);
        expect(jobData.fullName).toBe(currentApplication.applicant.fullName);
      }
    });

    it("should pass correct job title to queue", async () => {

      vi.clearAllMocks();

      // Fetch current application data before the test
      const currentApplication =
        await jobRepository.findApplicationById(applicationId);
      if (!currentApplication) {
        throw new Error("Test application not found");
      }

      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      TestHelpers.validateApiResponse(response, 200);

      // Verify job title is passed (structure check)
      expect(queueService.addJob).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendApplicationStatusUpdate",
        expect.objectContaining({
          jobTitle: expect.any(String), // Any string for job title
        }),
      );

      // Verify it matches the actual job title from database
      const callArgs = (queueService.addJob as any).mock.calls[0];
      if (callArgs && callArgs[2]) {
        const jobData = callArgs[2] as any;
        expect(jobData.jobTitle).toBe(currentApplication.job.title);
      }
    });

    it("should pass correct application ID to queue", async () => {

      vi.clearAllMocks();

      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: "reviewed" });

      TestHelpers.validateApiResponse(response, 200);

      // Verify application ID is passed (structure check)
      expect(queueService.addJob).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendApplicationStatusUpdate",
        expect.objectContaining({
          applicationId: expect.any(Number), // Any number for application ID
        }),
      );

      // Verify it matches the actual application ID
      const callArgs = (queueService.addJob as any).mock.calls[0];
      if (callArgs && callArgs[2]) {
        const jobData = callArgs[2] as any;
        expect(jobData.applicationId).toBe(applicationId);
      }
    });

    it("should pass correct old and new status to queue", async () => {

      vi.clearAllMocks();

      const newStatus = "reviewed";
      const response = await request
        .patch(
          `/api/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        )
        .set("Cookie", cookie)
        .send({ status: newStatus });

      TestHelpers.validateApiResponse(response, 200);

      // Verify status values are passed correctly
      const callArgs = (queueService.addJob as any).mock.calls[0];
      if (callArgs && callArgs[2]) {
        const jobData = callArgs[2] as any;
        expect(jobData.oldStatus).toBe("pending");
        expect(jobData.newStatus).toBe(newStatus);
      }
    });
  });
});
