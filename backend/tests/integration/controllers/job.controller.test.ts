import { request, TestHelpers } from "@tests/utils/testHelpers";
import { seedAdminUser, seedJobs, seedOrganizations } from "@tests/utils/seed";
import { AuthTokens } from "@/types";
import { expect } from "vitest";

describe("Job Controller Integration Tests", () => {
  describe("GET /jobs", () => {
    beforeEach(async () => {
      await seedJobs(); // Seed 3 jobs for testing
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
      expect(response.body.data).toHaveProperty("id", 1);
      expect(response.body.data).toHaveProperty("title");
      expect(response.body.data).toHaveProperty("description");
      expect(response.body.data).toHaveProperty("location");
      expect(response.body.data).toHaveProperty("employerId");
      expect(response.body).toHaveProperty(
        "message",
        "Job retrieved successfully",
      );
    });
  });

  describe("POST /jobs", () => {
    let userResponse: { data: { tokens: AuthTokens } };

    beforeEach(async () => {
      await seedOrganizations();
      await seedAdminUser();

      const response = await request
        .post("/api/auth/login")
        .send({ email: "admin@example.com", password: "Password@123" });

      userResponse = response.body;
    });

    it("should create a single job returning 200", async () => {
      const newJob = {
        title: "Software Engineer",
        description:
          "We are looking for a skilled Software Engineer to join our team. The ideal candidate will have experience in building high-quality applications.",
        location: "New York, NY",
        jobType: "full-time",
        compensationType: "paid",
        experience: "mid",
        salaryMin: 60000.0,
        salaryMax: 90000.0,
        currency: "USD",
        isRemote: false,
        applicationDeadline: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days from now
        skills: "JavaScript, TypeScript, Node.js",
        employerId: 1, // Assuming organization with ID 1 exists
      };

      const response = await request
        .post("/api/jobs")
        .set("Authorization", `Bearer ${userResponse.data.tokens.accessToken}`)
        .send(newJob);

      TestHelpers.validateApiResponse(response, 201);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("title", newJob.title);
      expect(response.body.data).toHaveProperty(
        "description",
        newJob.description,
      );

      expect(response.body.data).toHaveProperty("location", newJob.location);
      expect(response.body.data).toHaveProperty("jobType", newJob.jobType);
      expect(response.body.data).toHaveProperty(
        "compensationType",
        newJob.compensationType,
      );
      expect(response.body.data).toHaveProperty(
        "experience",
        newJob.experience,
      );

      expect(response.body.data).toHaveProperty(
        "salaryMin",
        newJob.salaryMin.toFixed(2),
      );
      expect(response.body.data).toHaveProperty(
        "salaryMax",
        newJob.salaryMax.toFixed(2),
      );
      expect(response.body.data).toHaveProperty("isRemote", newJob.isRemote);

      expect(JSON.parse(response.body.data.skills)).toEqual(
        newJob.skills.split(",").map((skill) => skill.trim()),
      );
      expect(response.body.data).toHaveProperty(
        "employerId",
        newJob.employerId,
      );
      expect(response.body).toHaveProperty(
        "message",
        "Job created successfully",
      );
    });

    it("should return 400 for invalid job creation payload", async () => {
      const invalidJob = {
        title: "SWE", // Too short
        description: "Short desc", // Too short
        location: "", // Required field
        jobType: "unknown-type", // Invalid enum value
        compensationType: "paid",
        experience: "mid",
        salaryMin: -5000, // Invalid negative salary
        salaryMax: 3000, // Max less than min
        currency: "US", // Invalid length
        isRemote: false,
        applicationDeadline: "invalid-date", // Invalid date format
        skills: "JavaScript, TypeScript, Node.js",
        employerId: 9999, // Assuming this org does not exist
      };

      const response = await request
        .post("/api/jobs")
        .set("Authorization", `Bearer ${userResponse.data.tokens.accessToken}`)
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
      const newJob = {
        title: "Software Engineer",
        description:
          "We are looking for a skilled Software Engineer to join our team. The ideal candidate will have experience in building high-quality applications.",
        location: "New York, NY",
        jobType: "full-time",
        compensationType: "paid",
        experience: "mid",
        salaryMin: 60000.0,
        salaryMax: 90000.0,
        currency: "USD",
        isRemote: false,
        applicationDeadline: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days from now
        skills: "JavaScript, TypeScript, Node.js",
        employerId: 1, // Assuming organization with ID 1 exists
      };

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
      await request.post("/api/auth/register").send({
        name: "Regular User",
        email: "regular@example.com",
        password: "Password@123",
        firstName: "Regular",
        lastName: "User",
        role: "user",
        organizationId: 1,
      });

      const loginResponse = await request.post("/api/auth/login").send({
        email: "regular@example.com",
        password: "Password@123",
      });

      const newJob = {
        title: "Software Engineer",
        description:
          "We are looking for a skilled Software Engineer to join our team. The ideal candidate will have experience in building high-quality applications.",
        location: "New York, NY",
        jobType: "full-time",
        compensationType: "paid",
        experience: "mid",
        salaryMin: 60000.0,
        salaryMax: 90000.0,
        currency: "USD",
        isRemote: false,
        applicationDeadline: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days from now
        skills: "JavaScript, TypeScript, Node.js",
        employerId: 1, // Assuming organization with ID 1 exists
      };

      const response = await request
        .post("/api/jobs")
        .set(
          "Authorization",
          `Bearer ${loginResponse.body.data.tokens.accessToken}`,
        )
        .send(newJob);

      TestHelpers.validateApiResponse(response, 403);
      expect(response.body).toHaveProperty(
        "message",
        "Insufficient permissions",
      );
    });
  });
});
