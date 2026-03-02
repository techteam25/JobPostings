// noinspection DuplicatedCode

import { request, TestHelpers } from "@tests/utils/testHelpers";
import {
  seedAdminScenario,
  seedJobsScenario,
  seedUserScenario,
  seedUserWithRoleScenario,
} from "@tests/utils/seedScenarios";
import { jobPostingFixture } from "@tests/utils/fixtures";

describe("Job Controller Integration Tests", () => {
  describe("GET /jobs", () => {
    beforeEach(async () => {
      await seedJobsScenario();
    });
    it("should retrieve a list of jobs returning 200", async () => {
      const response = await request.get("/api/jobs");

      TestHelpers.validateApiResponse(response, 200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("total", 3);
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 10);
      expect(response.body).toHaveProperty(
        "message",
        "Jobs retrieved successfully",
      );
    });

    it("should retrieve a single job by ID returning 200", async () => {
      const response = await request.get("/api/jobs/1");

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data).toHaveProperty("job");
      expect(response.body.data.job).toHaveProperty("id", 1);
      expect(response.body.data.job).toHaveProperty("title");
      expect(response.body.data.job).toHaveProperty("description");
      expect(response.body.data.job).toHaveProperty("city");
      expect(response.body.data.job).toHaveProperty("state");
      expect(response.body.data.job).toHaveProperty("country");
      expect(response.body.data.job).toHaveProperty("zipcode");
      expect(response.body.data.job).toHaveProperty("employerId");
      expect(response.body).toHaveProperty(
        "message",
        "Job retrieved successfully",
      );
    });
  });

  describe("POST /jobs", () => {
    let cookie: string;

    beforeEach(async () => {
      await seedAdminScenario();

      const response = await request
        .post("/api/auth/sign-in/email")
        .send({ email: "admin.user@example.com", password: "Password@123" });

      cookie = response.headers["set-cookie"]
        ? response.headers["set-cookie"][0]!
        : "";
    });

    it("should create a single job returning 201", async () => {
      const newJob = await jobPostingFixture();

      const response = await request
        .post("/api/jobs")
        .set("Cookie", cookie)
        .send(newJob);

      TestHelpers.validateApiResponse(response, 201);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("title", newJob.title);
      expect(response.body.data).toHaveProperty(
        "description",
        newJob.description,
      );

      expect(response.body.data).toHaveProperty("city", newJob.city);
      expect(response.body.data).toHaveProperty("state", newJob.state);
      expect(response.body.data).toHaveProperty("country", newJob.country);
      expect(response.body.data).toHaveProperty("jobType", newJob.jobType);
      expect(response.body.data).toHaveProperty(
        "compensationType",
        newJob.compensationType,
      );
      expect(response.body.data).toHaveProperty(
        "experience",
        newJob.experience,
      );
      expect(response.body.data).toHaveProperty("isRemote", newJob.isRemote);

      expect(response.body.data.skills).toEqual(
        expect.arrayContaining(newJob.skills),
      );
      expect(response.body.data).toHaveProperty("employerId", 1);
      expect(response.body).toHaveProperty(
        "message",
        "Job created successfully",
      );
    });

    it("should return 400 for invalid job creation payload", async () => {
      const invalidJob = {
        title: "SWE", // Too short
        description: "Short desc", // Too short
        city: "", // Required field
        state: "", // Required field
        country: "", // Required field
        jobType: "unknown-type", // Invalid enum value
        compensationType: "paid",
        experience: "mid",
        currency: "US", // Invalid length
        isRemote: false,
        applicationDeadline: "invalid-date", // Invalid date format
        skills: "JavaScript, TypeScript, Node.js",
      };

      const response = await request
        .post("/api/jobs")
        .set("Cookie", cookie)
        .send(invalidJob);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error).toHaveProperty(
        "message",
        "Request validation failed",
      );
      expect(response.body.error).toHaveProperty("details");
      expect(Array.isArray(response.body.error.details)).toBe(true);
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });

    it("should return 401 when creating a job without authentication", async () => {
      const newJob = await jobPostingFixture();

      const response = await request.post("/api/jobs").send(newJob);

      TestHelpers.validateApiResponse(response, 401);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required",
      );
      expect(response.body).toHaveProperty("status", "error");
    });

    it("should return 403 when a non-admin user attempts to create a job", async () => {
      // Seed a regular user
      await seedUserScenario();

      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]!
        : "";

      const newJob = await jobPostingFixture();

      const response = await request
        .post("/api/jobs")
        .set("Cookie", cookie)
        .send(newJob);

      TestHelpers.validateApiResponse(response, 403);
      expect(response.body).toHaveProperty(
        "message",
        "Insufficient permissions",
      );
    });

    describe("Authorization & Permission Tests", () => {
      it("should allow owner role to create a job", async () => {
        await seedUserWithRoleScenario("owner", "owner.user@example.com");

        const loginResponse = await request
          .post("/api/auth/sign-in/email")
          .send({
            email: "owner.user@example.com",
            password: "Password@123",
          });

        const ownerCookie = loginResponse.headers["set-cookie"]
          ? loginResponse.headers["set-cookie"][0]!
          : "";

        const newJob = await jobPostingFixture();
        const response = await request
          .post("/api/jobs")
          .set("Cookie", ownerCookie)
          .send(newJob);

        TestHelpers.validateApiResponse(response, 201);
        expect(response.body.data).toHaveProperty("id");
        expect(response.body).toHaveProperty(
          "message",
          "Job created successfully",
        );
      });

      it("should allow admin role to create a job", async () => {
        await seedUserWithRoleScenario("admin", "admin.role@example.com");

        const loginResponse = await request
          .post("/api/auth/sign-in/email")
          .send({
            email: "admin.role@example.com",
            password: "Password@123",
          });

        const adminCookie = loginResponse.headers["set-cookie"]
          ? loginResponse.headers["set-cookie"][0]!
          : "";

        const newJob = await jobPostingFixture();
        const response = await request
          .post("/api/jobs")
          .set("Cookie", adminCookie)
          .send(newJob);

        TestHelpers.validateApiResponse(response, 201);
        expect(response.body.data).toHaveProperty("id");
        expect(response.body).toHaveProperty(
          "message",
          "Job created successfully",
        );
      });

      it("should allow recruiter role to create a job", async () => {
        await seedUserWithRoleScenario("recruiter", "recruiter.user@example.com");

        const loginResponse = await request
          .post("/api/auth/sign-in/email")
          .send({
            email: "recruiter.user@example.com",
            password: "Password@123",
          });

        const recruiterCookie = loginResponse.headers["set-cookie"]
          ? loginResponse.headers["set-cookie"][0]!
          : "";

        const newJob = await jobPostingFixture();
        const response = await request
          .post("/api/jobs")
          .set("Cookie", recruiterCookie)
          .send(newJob);

        TestHelpers.validateApiResponse(response, 201);
        expect(response.body.data).toHaveProperty("id");
        expect(response.body).toHaveProperty(
          "message",
          "Job created successfully",
        );
      });

      it("should deny member role from creating a job", async () => {
        await seedUserWithRoleScenario("member", "member.user@example.com");

        const loginResponse = await request
          .post("/api/auth/sign-in/email")
          .send({
            email: "member.user@example.com",
            password: "Password@123",
          });

        const memberCookie = loginResponse.headers["set-cookie"]
          ? loginResponse.headers["set-cookie"][0]!
          : "";

        const newJob = await jobPostingFixture();
        const response = await request
          .post("/api/jobs")
          .set("Cookie", memberCookie)
          .send(newJob);

        TestHelpers.validateApiResponse(response, 403);
        expect(response.body).toHaveProperty(
          "message",
          "Insufficient permissions",
        );
      });
    });

    describe("Data Validation Tests", () => {
      it("should reject job with missing required fields", async () => {
        const invalidJob = {
          title: "Test Job",
          // Missing required fields: description, city, etc.
        };

        const response = await request
          .post("/api/jobs")
          .set("Cookie", cookie)
          .send(invalidJob);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      });

      it("should reject job with title too short", async () => {
        const invalidJob = await jobPostingFixture();

        const response = await request
          .post("/api/jobs")
          .set("Cookie", cookie)
          .send({ ...invalidJob, title: "ABC" });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body.error.details[0]).toHaveProperty(
          "message",
          "Title must be at least 5 characters",
        );
        expect(response.body.error.details[0]).toHaveProperty(
          "field",
          "body.title",
        );
      });

      it("should reject job with invalid date format", async () => {
        const invalidJob = await jobPostingFixture();
        invalidJob.applicationDeadline = "not-a-date";

        const response = await request
          .post("/api/jobs")
          .set("Cookie", cookie)
          .send(invalidJob);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("success", false);
      });

      it("should reject job with invalid skills format (not an array)", async () => {
        const invalidJob = await jobPostingFixture();
        // @ts-expect-error - Testing invalid input
        invalidJob.skills = "JavaScript, TypeScript"; // Should be an array

        const response = await request
          .post("/api/jobs")
          .set("Cookie", cookie)
          .send(invalidJob);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("success", false);
      });
    });

    describe("Security Tests", () => {
      it("should auto-populate employerId from authenticated user's organization", async () => {
        const newJob = await jobPostingFixture();

        const response = await request
          .post("/api/jobs")
          .set("Cookie", cookie)
          .send(newJob);

        TestHelpers.validateApiResponse(response, 201);
        expect(response.body.data).toHaveProperty("employerId", 1);
        expect(response.body.data.employerId).toBe(1);
      });

      it("should sanitize input to prevent XSS attacks", async () => {
        const fixture = await jobPostingFixture();
        // noinspection HtmlUnknownTarget,HtmlDeprecatedAttribute
        const xssJob = {
          ...fixture,
          title: "<script>alert('XSS')</script>Legitimate Title",
          description:
            "<img src=x onerror=alert('XSS') alt=''>Legitimate description",
        };

        const response = await request
          .post("/api/jobs")
          .set("Cookie", cookie)
          .send(xssJob);

        TestHelpers.validateApiResponse(response, 201);
        expect(response.body.data.title).not.toContain("<script>");
        expect(response.body.data.description).not.toContain("<img");
      });
    });
  });

  describe("PUT /jobs/:jobId", () => {
    let cookie: string;

    beforeEach(async () => {
      await seedAdminScenario();

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "admin.user@example.com",
        password: "Password@123",
      });

      cookie = response.headers["set-cookie"]![0]!;

      const newJob = await jobPostingFixture();

      await request.post("/api/jobs").set("Cookie", cookie).send(newJob);
    });

    it("should update a job returning 200", async () => {
      const updatedJob = {
        title: "Updated Software Engineer",
        description:
          "Updated description with more than fifty characters to pass validation.",
      };
      const response = await request
        .put("/api/jobs/1")
        .set("Cookie", cookie)
        .send(updatedJob);

      console.log(JSON.stringify(response.body, null, 2));

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body.data).toHaveProperty("id", 1);
      expect(response.body.data).toHaveProperty("title", updatedJob.title);
      expect(response.body.data).toHaveProperty(
        "description",
        updatedJob.description,
      );
      expect(response.body).toHaveProperty(
        "message",
        "Job updated successfully",
      );
    });
  });

  describe("DELETE /jobs/:jobId", () => {
    let cookie: string;

    beforeEach(async () => {
      await seedJobsScenario();

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "owner.user@example.com",
        password: "Password@123",
      });

      cookie = response.headers["set-cookie"]![0]!;
    });

    it("should delete a job when user is admin/owner with proper permissions returning 200", async () => {
      const response = await request
        .delete("/api/jobs/1")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Job deleted successfully",
      );

      // Verify the job is actually deleted
      const getResponse = await request.get("/api/jobs/1");

      TestHelpers.validateApiResponse(getResponse, 404);
      expect(getResponse.body).toHaveProperty(
        "message",
        "Job with Id: 1 not found",
      );
      expect(getResponse.body).toHaveProperty("errorCode", "NOT_FOUND");
    });

    it("should return 401 when user is not authenticated", async () => {
      const response = await request.delete("/api/jobs/1");

      TestHelpers.validateApiResponse(response, 401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error", "UNAUTHORIZED");
    });

    it("should return 404 when job does not exist", async () => {
      const response = await request
        .delete("/api/jobs/9999")
        .set("Cookie", cookie);

      console.log(JSON.stringify(response.body, null, 2));

      TestHelpers.validateApiResponse(response, 404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error", "NOT_FOUND");
    });

    it("should return 400 when job ID is invalid", async () => {
      const response = await request
        .delete("/api/jobs/invalid")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 400);
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /:organizationId/jobs - getJobsByEmployer", () => {
    let cookie: string;

    beforeEach(async () => {
      await seedJobsScenario(); // Seeds jobs for organization 1

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "org.member@example.com",
        password: "Password@123",
      });

      cookie = response.headers["set-cookie"]![0]!;
    });

    it("should retrieve all jobs for an organization with default pagination returning 200", async () => {
      const response = await request
        .get("/api/jobs/employer/1/jobs")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Jobs retrieved successfully",
      );
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Validate pagination metadata
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("page");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("totalPages");

      // Validate job structure
      const job = response.body.data[0];
      expect(job).toHaveProperty("id");
      expect(job).toHaveProperty("title");
      expect(job).toHaveProperty("description");
      expect(job).toHaveProperty("employerId", 1);
      expect(job).toHaveProperty("city");
      expect(job).toHaveProperty("state");
      expect(job).toHaveProperty("country");
    });

    it("should retrieve jobs with custom pagination parameters returning 200", async () => {
      const response = await request
        .get("/api/jobs/employer/1/jobs?page=1&limit=2")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Validate pagination respects custom parameters
      expect(response.body.pagination).toHaveProperty("page", "1");
      expect(response.body.pagination).toHaveProperty("limit", "2");
      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });

    it("should sort jobs by createdAt in ascending order returning 200", async () => {
      const response = await request
        .get("/api/jobs/employer/1/jobs?sortBy=createdAt&order=asc")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      const jobs = response.body.data;
      if (jobs.length > 1) {
        const firstDate = new Date(jobs[0].createdAt);
        const secondDate = new Date(jobs[1].createdAt);
        expect(firstDate.getTime()).toBeLessThanOrEqual(secondDate.getTime());
      }
    });

    it("should only return jobs for the specified organization", async () => {
      const response = await request
        .get("/api/jobs/employer/1/jobs")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      // All jobs should belong to organization with ID 1
      const jobs = response.body.data;
      jobs.forEach((job: any) => {
        expect(job.employerId).toBe(1);
      });
    });

    it("should return correct total count in pagination metadata", async () => {
      const response = await request
        .get("/api/jobs/employer/1/jobs")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      const { pagination } = response.body;
      expect(pagination.total).toBeGreaterThanOrEqual(
        response.body.data.length,
      );
      expect(pagination.totalPages).toBe(
        Math.ceil(pagination.total / pagination.limit),
      );
    });
  });

  describe("GET /employer/:organizationId/jobs/stats - getOrganizationJobsStats", () => {
    let cookie: string;

    beforeEach(async () => {
      await seedJobsScenario(); // Seeds jobs for organization 1

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "org.member@example.com",
        password: "Password@123",
      });

      cookie = response.headers["set-cookie"]![0]!;
    });

    it("should retrieve job statistics for an organization returning 200", async () => {
      const response = await request
        .get("/api/jobs/employer/1/jobs/stats")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Organization job statistics retrieved successfully",
      );
      expect(response.body).toHaveProperty("data");

      // Validate statistics structure
      const stats = response.body.data;
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("active");
      expect(stats).toHaveProperty("inactive");
      expect(stats).toHaveProperty("totalApplications");
      expect(stats).toHaveProperty("totalViews");

      // Validate data types
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.active).toBe("number");
      expect(typeof stats.inactive).toBe("number");
      expect(typeof stats.totalApplications).toBe("number");
      expect(typeof stats.totalViews).toBe("number");

      // Validate logical constraints
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.active).toBeGreaterThanOrEqual(0);
      expect(stats.inactive).toBeGreaterThanOrEqual(0);
      expect(stats.totalApplications).toBeGreaterThanOrEqual(0);
      expect(stats.totalViews).toBeGreaterThanOrEqual(0);

      // Total should equal active + inactive
      expect(stats.total).toBeGreaterThanOrEqual(stats.active);
    });

    it("should return 401 when user is not authenticated", async () => {
      const response = await request.get("/api/jobs/employer/1/jobs/stats");

      TestHelpers.validateApiResponse(response, 401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required",
      );
    });

    it("should include all required fields in the response", async () => {
      const response = await request
        .get("/api/jobs/employer/1/jobs/stats")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);

      const requiredFields = [
        "total",
        "active",
        "inactive",
        "totalApplications",
        "totalViews",
      ];

      const stats = response.body.data;
      requiredFields.forEach((field) => {
        expect(stats).toHaveProperty(field);
      });
    });

    it("should return consistent statistics across multiple requests", async () => {
      const response1 = await request
        .get("/api/jobs/employer/1/jobs/stats")
        .set("Cookie", cookie);

      const response2 = await request
        .get("/api/jobs/employer/1/jobs/stats")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response1, 200);
      TestHelpers.validateApiResponse(response2, 200);

      expect(response1.body.data).toEqual(response2.body.data);
    });
  });
});
