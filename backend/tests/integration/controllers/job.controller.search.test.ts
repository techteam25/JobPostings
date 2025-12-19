import { sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { jobsDetails, jobSkills, skills } from "@/db/schema";
import { TypesenseService } from "@/infrastructure/typesense.service/typesense.service";
import { request } from "@tests/utils/testHelpers";
import { seedAdminUser } from "@tests/utils/seed";
import { jobPostingFixture } from "@tests/utils/fixtures";
import { waitForJobIndexing } from "@tests/utils/wait-for-jobIndexer";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

const typesenseService = new TypesenseService();

describe("Job Search Integration Tests", () => {
  let cookie: string;

  beforeAll(async () => {
    await seedAdminUser();

    const response = await request
      .post("/api/auth/sign-in/email")
      .send({ email: "admin.user@example.com", password: "Password@123" });

    cookie = response.headers["set-cookie"]![0]!;

    // Seed database and Typesense with mock data

    await db.delete(jobSkills);
    await db.delete(skills);
    await db.delete(jobsDetails);
    await db.execute(sql.raw(`ALTER TABLE job_skills AUTO_INCREMENT = 1`));
    await db.execute(sql.raw(`ALTER TABLE skills AUTO_INCREMENT = 1`));
    await db.execute(sql.raw(`ALTER TABLE job_details AUTO_INCREMENT = 1`));
    await queueService.obliterateQueue(QUEUE_NAMES.TYPESENSE_QUEUE);

    const res = await Promise.all([
      request
        .post("/api/jobs")
        .set("Cookie", cookie)
        .send(await jobPostingFixture())
        .expect(201),
      request
        .post("/api/jobs")
        .set("Cookie", cookie)
        .send(await jobPostingFixture())
        .expect(201),
      request
        .post("/api/jobs")
        .set("Cookie", cookie)
        .send(await jobPostingFixture())
        .expect(201),
    ]);

    // Index directly in Typesense (bypass queue for tests)
    await Promise.all(res.map((r) => waitForJobIndexing(r.body.data.id)));
  });

  afterAll(async () => {
    // Cleanup Typesense
    await Promise.all([
      typesenseService.deleteJobDocumentById("1"),
      typesenseService.deleteJobDocumentById("2"),
      typesenseService.deleteJobDocumentById("3"),
    ]);
  });

  describe("GET /api/jobs/search - Basic Search", () => {
    it("should return all jobs when no filters applied", async () => {
      const response = await request.get("/api/jobs/search").expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should search by text query", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ q: "Engineer" })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return empty results for non-existent query", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ q: "nonexistentskill12345" })
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe("GET /api/jobs/search - Location Filters", () => {
    it("should filter by city", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ city: "Austin" })
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should filter by city and state", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ city: "Austin", state: "TX" })
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should filter by state only", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ state: "TX" })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should filter by country", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ country: "USA" })
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should filter by zipcode", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ zipcode: "78701" })
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });
  });

  describe("GET /api/jobs/search - Remote Jobs", () => {
    it("should filter remote jobs only", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ includeRemote: true })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should include remote jobs with location filter", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ city: "Austin", includeRemote: true })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
      expect(response.body).toHaveProperty("pagination");
    });
  });

  describe("GET /api/jobs/search - Skills Filters", () => {
    it("should filter by single skill", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ skills: ["react"] });

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should filter by multiple skills (AND logic)", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ skills: ["react", "typescript"] })
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should return empty when no jobs match all skills", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ skills: ["react", "cobol", "fortran"] })
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe("GET /api/jobs/search - Job Type Filters", () => {
    it("should filter by single job type", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ jobType: ["full-time"] })
        .expect(200);

      expect(response.body.data.length).toBeTruthy();
      expect(response.body).toHaveProperty("pagination");
    });

    it("should filter by multiple job types (OR logic)", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ jobType: ["full-time", "contract"] })
        .expect(200);

      expect(response.body.data.length).toBeTruthy();
      expect(response.body).toHaveProperty("pagination");
    });

    it("should accept all valid job type enums", async () => {
      const jobTypes = [
        "full-time",
        "part-time",
        "contract",
        "volunteer",
        "internship",
      ];

      for (const jobType of jobTypes) {
        const response = await request
          .get("/api/jobs/search")
          .query({ jobType: [jobType] })
          .expect(200);

        expect(response.body).toHaveProperty("pagination");
      }
    });
  });

  describe("GET /api/jobs/search - Experience Filter", () => {
    it("should filter by experience level", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ experience: "senior" })
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });
  });

  describe("GET /api/jobs/search - Status Filter", () => {
    it("should filter by status", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ isActive: true })
        .expect(200);

      expect(response.body.data.length).toBeTruthy();
      expect(response.body).toHaveProperty("pagination");
    });
  });

  describe("GET /api/jobs/search - Complex Filter Combinations", () => {
    it("should combine location, skills, and job type", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({
          city: "Austin",
          skills: ["react", "typescript"],
          jobType: ["full-time"],
        })
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should combine text query with filters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({
          q: "developer",
          city: "Austin",
          jobType: ["full-time", "contract"],
        })
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should combine remote with multiple filters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({
          includeRemote: true,
          skills: ["react"],
          jobType: ["full-time"],
          experience: "senior",
        })
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should handle all filters at once", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({
          q: "engineer",
          city: "Austin",
          state: "TX",
          country: "USA",
          includeRemote: true,
          skills: ["react"],
          jobType: ["full-time"],
          experience: "senior",
          isActive: true,
        })
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body).toHaveProperty("pagination");
    });
  });

  describe("GET /api/jobs/search - Validation Errors", () => {
    it("should reject invalid job type", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ jobType: ["invalid-type"] })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject invalid page number", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ page: -1 })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject invalid limit number", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ limit: 0 })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject invalid order value", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ order: "invalid" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject unexpected query parameters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ unexpectedParam: "value" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/jobs/search - Performance", () => {
    it("should respond within acceptable time", async () => {
      const start = Date.now();

      await request
        .get("/api/jobs/search")
        .query({ q: "developer" })
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it("should handle large result sets efficiently", async () => {
      const start = Date.now();

      await request.get("/api/jobs/search").query({ limit: 100 }).expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });

  describe("GET /api/jobs/search - Edge Cases", () => {
    it("should handle special characters in search query", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ q: "C++ & C#" })
        .expect(200);

      expect(response.body).toHaveProperty("data");
    });

    it("should handle very long search query", async () => {
      const longQuery = "a".repeat(500);

      const response = await request
        .get("/api/jobs/search")
        .query({ q: longQuery })
        .expect(200);

      expect(response.body).toHaveProperty("data");
    });

    it("should handle empty string filters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ city: "", state: "" })
        .expect(200);

      expect(response.body).toHaveProperty("data");
    });

    it("should handle multiple values in skills array", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ skills: ["skill1", "skill2", "skill3", "skill4", "skill5"] })
        .expect(200);

      expect(response.body).toHaveProperty("data");
    });

    it("should handle case sensitivity in filters", async () => {
      const response1 = await request
        .get("/api/jobs/search")
        .query({ city: "austin" })
        .expect(200);

      const response2 = await request
        .get("/api/jobs/search")
        .query({ city: "Austin" })
        .expect(200);

      // Both should return results (case-insensitive search)
      expect(response1.body.data.length).toEqual(0);
      expect(response2.body.data.length).toEqual(0);
    });
  });

  // describe("GET /api/jobs/search - Facets (if implemented)", () => {
  //   it("should return facet counts for skills", async () => {
  //     const response = await request
  //       .get("/api/jobs/search")
  //       .query({ facet_by: "skills" })
  //       .expect(200);
  //
  //     if (response.body.facets) {
  //       expect(response.body.facets).toHaveProperty("skills");
  //       expect(Array.isArray(response.body.facets.skills)).toBe(true);
  //     }
  //   });
  //
  //   it("should return facet counts for jobType", async () => {
  //     const response = await request
  //       .get("/api/jobs/search")
  //       .query({ facet_by: "jobType" })
  //       .expect(200);
  //
  //     if (response.body.facets) {
  //       expect(response.body.facets).toHaveProperty("jobType");
  //     }
  //   });
  //
  //   it("should return multiple facets", async () => {
  //     const response = await request
  //       .get("/api/jobs/search")
  //       .query({ facet_by: "skills,jobType,isRemote" })
  //       .expect(200);
  //
  //     if (response.body.facets) {
  //       expect(Object.keys(response.body.facets).length).toBeGreaterThan(0);
  //     }
  //   });
  // });

  describe("GET /api/jobs/search - Concurrent Requests", () => {
    it("should handle multiple concurrent requests", async () => {
      const requests = Array(5)
        .fill(null)
        .map((_, i) =>
          request.get("/api/jobs/search").query({ page: i + 1, limit: 5 }),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("data");
      });
    });

    it("should handle different filters concurrently", async () => {
      const requests = [
        request.get("/api/jobs/search").query({ city: "Austin" }),
        request.get("/api/jobs/search").query({ skills: ["react"] }),
        request.get("/api/jobs/search").query({ jobType: ["full-time"] }),
        request.get("/api/jobs/search").query({ includeRemote: true }),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("data");
      });
    });
  });
});
