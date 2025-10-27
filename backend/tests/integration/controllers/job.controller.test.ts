// noinspection DuplicatedCode

import { request, TestHelpers } from "@tests/utils/testHelpers";
import { seedAdminUser, seedJobs, seedUser } from "@tests/utils/seed";
import { jobPostingFixture } from "@tests/utils/fixtures";
import { jobsDetails } from "@/db/schema";
import { sql } from "drizzle-orm";
import { db } from "@/db/connection";

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
    let cookie: string;

    beforeEach(async () => {
      await seedAdminUser();

      const response = await request
        .post("/api/auth/sign-in/email")
        .send({ email: "admin.user@example.com", password: "Password@123" });

      cookie = response.headers["set-cookie"]
        ? response.headers["set-cookie"][0]!
        : "";
    });

    it("should create a single job returning 200", async () => {
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
        employerId: 9999, // Assuming this org does not exist
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
      await seedUser();

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
  });

  describe("PUT /jobs/:jobId", () => {
    let cookie: string;

    beforeEach(async () => {
      await db.delete(jobsDetails);

      // Reset auto-increment counters
      await db.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);

      await seedAdminUser();

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
      await db.delete(jobsDetails);

      // Reset auto-increment counters
      await db.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);

      await seedAdminUser();

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "admin.user@example.com",
        password: "Password@123",
      });

      cookie = response.headers["set-cookie"]![0]!;

      const newJob = await jobPostingFixture();

      await request.post("/api/jobs").set("Cookie", cookie).send(newJob);
    });

    it("should delete a job returning 200", async () => {
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
        "error",
        "Job with ID 1 not found",
      );
      expect(getResponse.body).toHaveProperty(
        "message",
        "Failed to retrieve job",
      );
    });
  });
});
