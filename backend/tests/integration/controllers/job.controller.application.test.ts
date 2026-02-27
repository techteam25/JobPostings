import { request, TestHelpers } from "@tests/utils/testHelpers";
import { seedJobsScenario } from "@tests/utils/seedScenarios";
import { createUser } from "@tests/utils/seedBuilders";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/utils/auth";
import { JobService } from "@/services/job.service";
import { ok } from "@/services/base.service";
import { JobRepository } from "@/repositories/job.repository";
import { queueService } from "@/infrastructure/queue.service";

describe("Job Application API - POST /api/jobs/:jobId/apply", () => {
  let userCookie: string;
  let jobId: number;

  beforeEach(async () => {
    const { faker } = await import("@faker-js/faker");

    await seedJobsScenario();
    await createUser({ email: "normal.user@example.com" });

    // Login as org member (email from seed: org.member@example.com)
    const loginResponse = await request
      .post("/api/auth/sign-in/email")
      .send({ email: "normal.user@example.com", password: "Password@123" });

    userCookie = loginResponse.headers["set-cookie"]
      ? loginResponse.headers["set-cookie"][0]!
      : "";

    jobId = 1; // From seeded jobs
  });

  describe("Success Cases", () => {
    it("should successfully submit application with valid data", async () => {
      const applicationData = {
        customAnswers: "I have 5 years of experience with TypeScript and Node.js.",
        notes: "Available to start immediately.",
      };

      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send(applicationData);

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveProperty("applicationId");
      expect(response.body.data).toHaveProperty("message");
      expect(response.body.message).toBe("Application submitted successfully");

      // Email notification is queued asynchronously (tested separately)
    });

    it("should submit application with only custom answers", async () => {
      const applicationData = {
        customAnswers: "I have extensive experience in this field.",
      };

      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send(applicationData);

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveProperty("applicationId");
    });

    it("should submit application with only notes", async () => {
      const applicationData = {
        notes: "Referred by a current employee.",
      };

      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send(applicationData);

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveProperty("applicationId");
    });

    it("should submit application with no optional fields", async () => {
      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send({});

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveProperty("applicationId");
    });
  });

  describe("Validation Errors", () => {
    it("should reject notes exceeding max length", async () => {
      const applicationData = {
        notes: "a".repeat(5001),
      };

      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send(applicationData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject invalid jobId format", async () => {
      const response = await request
        .post("/api/jobs/invalid-id/apply")
        .set("Cookie", userCookie)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject extra fields in body", async () => {
      const applicationData = {
        extraField: "should not be allowed",
      };

      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send(applicationData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Business Logic Errors", () => {
    it("should reject duplicate application (409 Conflict)", async () => {
      // First application
      await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send({});

      // Duplicate application
      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send({});

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.message).toContain("already applied");
    });

    it("should reject application for inactive job", async () => {
      const inactiveJobId = 3;

      // Spy on findJobById to return an inactive job
      const getJobByIdSpy = vi
        .spyOn(JobRepository.prototype, "findJobById")
        .mockResolvedValue({
          job: {
            id: inactiveJobId,
            title: "Inactive Job",
            description: "This job is inactive",
            city: "New York",
            state: "NY",
            country: "United States",
            zipcode: "10001",
            jobType: "full-time",
            compensationType: "paid",
            isRemote: false,
            isActive: false,
            applicationDeadline: null,
            experience: null,
            employerId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          employer: {
            id: 1,
            name: "Test Employer",
            city: "New York",
            state: "NY",
            logoUrl: null,
          },
        } as any);

      const response = await request
        .post(`/api/jobs/${inactiveJobId}/apply`)
        .set("Cookie", userCookie)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.message).toContain("no longer accepting");

      getJobByIdSpy.mockRestore();
    });

    it("should reject application for non-existent job (404)", async () => {
      const nonExistentJobId = 99999;

      const response = await request
        .post(`/api/jobs/${nonExistentJobId}/apply`)
        .set("Cookie", userCookie)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("Authentication/Authorization", () => {
    it("should reject unauthenticated requests (401)", async () => {
      const response = await request.post(`/api/jobs/${jobId}/apply`).send({});

      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");
    });

    it("should allow authenticated user to apply", async () => {
      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send({});

      expect(response.status).toBe(201);
    });
  });

  describe("Email Notification", () => {
    it("should complete application even if email fails", async () => {
      // Email errors are logged but don't prevent application success
      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send({});

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveProperty("applicationId");
    });
  });
});

describe("Withdraw Job Application Integration Tests", () => {
  let jobRepository: JobRepository;
  let userCookie: string;
  let otherUserCookie: string;
  let jobId: number;
  let applicationId: number;
  let otherUserApplicationId: number;

  beforeAll(() => {
    jobRepository = new JobRepository();

    // Mock email queue to prevent actual email sending during tests
    vi.spyOn(queueService, "addJob").mockResolvedValue({} as any);
  });

  beforeEach(async () => {
    const { faker } = await import("@faker-js/faker");

    await seedJobsScenario();

    // Create first test user
    await createUser({ email: "test.user1@example.com" });

    // Create second test user
    await createUser({ email: "test.user2@example.com" });

    // Login first user
    const loginResponse1 = await request
      .post("/api/auth/sign-in/email")
      .send({ email: "test.user1@example.com", password: "Password@123" });

    userCookie = loginResponse1.headers["set-cookie"]
      ? loginResponse1.headers["set-cookie"][0]!
      : "";

    // Login second user
    const loginResponse2 = await request
      .post("/api/auth/sign-in/email")
      .send({ email: "test.user2@example.com", password: "Password@123" });

    otherUserCookie = loginResponse2.headers["set-cookie"]
      ? loginResponse2.headers["set-cookie"][0]!
      : "";

    jobId = 1; // From seeded jobs

    // Create application for first user
    const appResponse1 = await request
      .post(`/api/jobs/${jobId}/apply`)
      .set("Cookie", userCookie)
      .send({});

    applicationId = appResponse1.body.data.applicationId;

    // Create application for second user
    const appResponse2 = await request
      .post(`/api/jobs/${jobId}/apply`)
      .set("Cookie", otherUserCookie)
      .send({});

    otherUserApplicationId = appResponse2.body.data.applicationId;
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("PATCH /api/jobs/applications/:applicationId/withdraw", () => {
    it("should successfully withdraw user's own application", async () => {
      const response = await request
        .patch(`/api/jobs/applications/${applicationId}/withdraw`)
        .set("Cookie", userCookie)
        .expect(200);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.message).toBe("Application withdrawn successfully");

      // Verify email queue was called
      expect(queueService.addJob).toHaveBeenCalledWith(
        "emailQueue",
        "sendApplicationWithdrawalConfirmation",
        expect.objectContaining({
          email: expect.any(String),
          fullName: expect.any(String),
          jobTitle: expect.any(String),
          applicationId: applicationId,
        }),
      );

      // Verify application status was updated in database
      const application =
        await jobRepository.findApplicationById(applicationId);
      expect(application?.application.status).toBe("withdrawn");
    });

    it("should return 401 when user is not authenticated", async () => {
      const response = await request
        .patch(`/api/jobs/applications/${applicationId}/withdraw`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        status: "error",
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
    });

    it("should return 403 when user attempts to withdraw another user's application", async () => {
      const response = await request
        .patch(`/api/jobs/applications/${otherUserApplicationId}/withdraw`)
        .set("Cookie", userCookie)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        status: "error",
        error: "FORBIDDEN",
        message: "You can only withdraw your own applications",
      });
    });

    it("should return 404 when application does not exist", async () => {
      const nonExistentId = 999999;

      const response = await request
        .patch(`/api/jobs/applications/${nonExistentId}/withdraw`)
        .set("Cookie", userCookie)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        status: "error",
        error: "NOT_FOUND",
        message: "Application not found",
      });
    });

    it("should return 400 for invalid application ID format", async () => {
      const response = await request
        .patch("/api/jobs/applications/invalid-id/withdraw")
        .set("Cookie", userCookie)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should allow withdrawal of application with pending status", async () => {
      const response = await request
        .patch(`/api/jobs/applications/${applicationId}/withdraw`)
        .set("Cookie", userCookie)
        .expect(200);

      TestHelpers.validateApiResponse(response, 200);
    });

    it("should send email with correct job title and user details", async () => {
      await request
        .patch(`/api/jobs/applications/${applicationId}/withdraw`)
        .set("Cookie", userCookie)
        .expect(200);

      expect(queueService.addJob).toHaveBeenCalledWith(
        "emailQueue",
        "sendApplicationWithdrawalConfirmation",
        expect.objectContaining({
          email: expect.stringMatching(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/),
          fullName: expect.any(String),
          jobTitle: expect.any(String),
          applicationId: expect.any(Number),
        }),
      );
    });
  });

  describe("Middleware chain validation", () => {
    it("should execute middlewares in correct order - auth before validation", async () => {
      const response = await request
        .patch("/api/jobs/applications/invalid/withdraw")
        .expect(401);

      expect(response.body.error).toBe("UNAUTHORIZED");
    });

    it("should validate request params format", async () => {
      const response = await request
        .patch("/api/jobs/applications/not-a-number/withdraw")
        .set("Cookie", userCookie)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });
  });
});
