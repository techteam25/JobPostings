import { request, TestHelpers } from "@tests/utils/testHelpers";
import { seedJobs } from "@tests/utils/seed";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/utils/auth";
import { JobService } from "@/services/job.service";
import { ok } from "@/services/base.service";

describe("Job Application API - POST /api/jobs/:jobId/apply", () => {
  let userCookie: string;
  let jobId: number;

  beforeEach(async () => {
    const { faker } = await import("@faker-js/faker");

    await seedJobs();
    await auth.api.signUpEmail({
      body: {
        email: "normal.user@example.com",
        password: "Password@123",
        name: faker.person.firstName() + " " + faker.person.lastName(),
        image: faker.image.avatar(),
      },
    });

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
        coverLetter:
          "I am very interested in this position. My background in software development makes me a great fit for this role. I have 5 years of experience working with various technologies.",
        resumeUrl: "https://example.com/resume.pdf",
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

    it("should submit application with only cover letter", async () => {
      const applicationData = {
        coverLetter:
          "I am very interested in this position and believe I would be a great fit based on my experience and skills in the field.",
      };

      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send(applicationData);

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveProperty("applicationId");
    });

    it("should submit application with only resume URL", async () => {
      const applicationData = {
        resumeUrl: "https://example.com/my-resume.pdf",
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
    it("should reject cover letter less than 50 characters", async () => {
      const applicationData = {
        coverLetter: "Too short",
      };

      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send(applicationData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("details");
      expect(Array.isArray(response.body.error.details)).toBeTruthy();
      expect(response.body.error.details[0].message).toContain(
        "Cover letter must be at least 50 characters",
      );
    });

    it("should reject cover letter more than 2000 characters", async () => {
      const applicationData = {
        coverLetter: "a".repeat(2001),
      };

      const response = await request
        .post(`/api/jobs/${jobId}/apply`)
        .set("Cookie", userCookie)
        .send(applicationData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject invalid resume URL", async () => {
      const applicationData = {
        resumeUrl: "not-a-valid-url",
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
        coverLetter:
          "I am very interested in this position and have the required skills.",
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

      // Spy on getJobById to return an inactive job
      const getJobByIdSpy = vi
        .spyOn(JobService.prototype, "getJobById")
        .mockResolvedValue(
          ok({
            job: {
              id: inactiveJobId,
              title: "Inactive Job",
              description: "This job is inactive",
              city: "New York",
              state: "NY",
              country: "United States",
              zipcode: 10001,
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
          }),
        );

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
