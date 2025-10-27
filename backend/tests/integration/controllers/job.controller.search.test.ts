import { request } from "@tests/utils/testHelpers";
import { seedAdminUser } from "@tests/utils/seed";
import { jobPostingFixture } from "@tests/utils/fixtures";
import { db } from "@/db/connection";
import { jobsDetails, jobSkills, skills } from "@/db/schema";
import { sql } from "drizzle-orm";
import { TypesenseService } from "@/services/typesense.service/typesense.service";
import { waitForJobIndexing } from "@tests/utils/wait-for-jobIndexer";
import { jobIndexerQueue } from "@/utils/bullmq.utils";
import logger from "@/logger";

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
    await db.execute(sql`ALTER TABLE job_skills AUTO_INCREMENT = 1`);
    await db.execute(sql`ALTER TABLE skills AUTO_INCREMENT = 1`);
    await db.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);
    await jobIndexerQueue.obliterate({ force: true });

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

    await Promise.all([res.map((r) => waitForJobIndexing(r.body.data.id))]);
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

      console.log(JSON.stringify(response.body, null, 2));

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
      expect(response.body.data.length).toBeGreaterThan(0);
      // Should contain React-related jobs
      expect(
        response.body.data.some((job: any) =>
          job.title.toLowerCase().includes("engineer"),
        ),
      ).toBe(true);
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

      expect(response.body.jobs.length).toBeGreaterThan(0);
      response.body.jobs.forEach((job: any) => {
        expect(job.city).toBe("Austin");
      });
    });

    it("should filter by city and state", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ city: "Austin", state: "TX" })
        .expect(200);

      response.body.data.forEach((job: any) => {
        expect(job.city).toBe("Austin");
        expect(job.state).toBe("TX");
      });
    });

    it("should filter by state only", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ state: "TX" })
        .expect(200);

      response.body.jobs.forEach((job: any) => {
        expect(job.state).toBe("TX");
      });
    });

    it("should filter by country", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ country: "USA" })
        .expect(200);

      response.body.jobs.forEach((job: any) => {
        expect(job.country).toBe("USA");
      });
    });

    it("should filter by zipcode", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ zipcode: "78701" })
        .expect(200);

      response.body.jobs.forEach((job: any) => {
        expect(job.zipcode).toBe(78701);
      });
    });
  });

  describe("GET /api/jobs/search - Remote Jobs", () => {
    it("should filter remote jobs only", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ includeRemote: true })
        .expect(200);

      expect(response.body.jobs.length).toBeGreaterThan(0);
      response.body.jobs.forEach((job: any) => {
        expect(job.isRemote).toBe(true);
      });
    });

    it("should include remote jobs with location filter", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ city: "Austin", includeRemote: true })
        .expect(200);

      // Should return both Austin jobs AND remote jobs
      const hasAustinJobs = response.body.jobs.some(
        (job: any) => job.city === "Austin" && !job.isRemote,
      );
      const hasRemoteJobs = response.body.jobs.some((job: any) => job.isRemote);

      expect(hasAustinJobs || hasRemoteJobs).toBe(true);
    });
  });

  describe("GET /api/jobs/search - Skills Filters", () => {
    it("should filter by single skill", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ skills: ["react"] })
        .expect(200);

      expect(response.body.jobs.length).toBeGreaterThan(0);
      response.body.jobs.forEach((job: any) => {
        expect(job.skills).toContain("react");
      });
    });

    it("should filter by multiple skills (AND logic)", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ skills: ["react", "typescript"] })
        .expect(200);

      // Jobs must have ALL specified skills
      response.body.jobs.forEach((job: any) => {
        expect(job.skills).toContain("react");
        expect(job.skills).toContain("typescript");
      });
    });

    it("should return empty when no jobs match all skills", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ skills: ["react", "cobol", "fortran"] })
        .expect(200);

      expect(response.body.jobs).toEqual([]);
    });
  });

  describe("GET /api/jobs/search - Job Type Filters", () => {
    it("should filter by single job type", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ jobType: ["full-time"] })
        .expect(200);

      response.body.jobs.forEach((job: any) => {
        expect(job.jobType).toBe("full-time");
      });
    });

    it("should filter by multiple job types (OR logic)", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ jobType: ["full-time", "contract"] })
        .expect(200);

      response.body.jobs.forEach((job: any) => {
        expect(["full-time", "contract"]).toContain(job.jobType);
      });
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

        expect(response.body).toHaveProperty("jobs");
      }
    });
  });

  describe("GET /api/jobs/search - Experience Filter", () => {
    it("should filter by experience level", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ experience: "senior" })
        .expect(200);

      response.body.jobs.forEach((job: any) => {
        expect(job.experience).toBe("senior");
      });
    });
  });

  describe("GET /api/jobs/search - Status Filter", () => {
    it("should filter by status", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ status: "active" })
        .expect(200);

      response.body.jobs.forEach((job: any) => {
        expect(job.isActive).toBe(true);
      });
    });

    it("should accept all valid status enums", async () => {
      const statuses = [
        "pending",
        "reviewed",
        "shortlisted",
        "interviewing",
        "rejected",
        "hired",
        "withdrawn",
      ];

      for (const status of statuses) {
        const response = await request
          .get("/api/jobs/search")
          .query({ status })
          .expect(200);

        expect(response.body).toHaveProperty("jobs");
      }
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

      response.body.jobs.forEach((job: any) => {
        expect(job.city).toBe("Austin");
        expect(job.skills).toContain("react");
        expect(job.skills).toContain("typescript");
        expect(job.jobType).toBe("full-time");
      });
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

      expect(response.body.jobs.length).toBeGreaterThan(0);
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

      response.body.jobs.forEach((job: any) => {
        expect(job.skills).toContain("react");
        expect(job.jobType).toBe("full-time");
        expect(job.experience).toBe("senior");
      });
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
          status: "active",
        })
        .expect(200);

      expect(response.body).toHaveProperty("jobs");
      expect(response.body).toHaveProperty("meta");
    });
  });

  describe("GET /api/jobs/search - Pagination", () => {
    it("should paginate results with default values", async () => {
      const response = await request.get("/api/jobs/search").expect(200);

      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrevious: false,
        nextPage: expect.any(Number) || null,
        previousPage: null,
      });
    });

    it("should respect custom page and limit", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(2);
      expect(response.body.jobs.length).toBeLessThanOrEqual(2);
    });

    it("should calculate hasNext correctly", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ page: 1, limit: 2 })
        .expect(200);

      if (response.body.meta.total > 2) {
        expect(response.body.meta.hasNext).toBe(true);
        expect(response.body.meta.nextPage).toBe(2);
      } else {
        expect(response.body.meta.hasNext).toBe(false);
        expect(response.body.meta.nextPage).toBeNull();
      }
    });

    it("should calculate hasPrevious correctly", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(response.body.meta.hasPrevious).toBe(true);
      expect(response.body.meta.previousPage).toBe(1);
    });

    it("should handle page beyond total pages", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ page: 9999, limit: 10 })
        .expect(200);

      expect(response.body.jobs).toEqual([]);
      expect(response.body.meta.hasNext).toBe(false);
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

    it("should reject invalid status", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ status: "invalid-status" })
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

  describe("GET /api/jobs/search - Response Format", () => {
    it("should return correct response structure", async () => {
      const response = await request.get("/api/jobs/search").expect(200);

      expect(response.body).toMatchObject({
        jobs: expect.any(Array),
        meta: {
          total: expect.any(Number),
          page: expect.any(Number),
          limit: expect.any(Number),
          totalPages: expect.any(Number),
          hasNext: expect.any(Boolean),
          hasPrevious: expect.any(Boolean),
        },
      });
    });

    it("should return job objects with correct structure", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ city: "Austin" })
        .expect(200);

      if (response.body.jobs.length > 0) {
        const job = response.body.jobs[0];
        expect(job).toMatchObject({
          id: expect.any(Number),
          title: expect.any(String),
          description: expect.any(String),
          city: expect.any(String),
          country: expect.any(String),
          jobType: expect.any(String),
          compensationType: expect.any(String),
          isRemote: expect.any(Boolean),
          isActive: expect.any(Boolean),
        });
      }
    });

    it("should include skills array in job objects", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ skills: ["react"] })
        .expect(200);

      if (response.body.jobs.length > 0) {
        const job = response.body.jobs[0];
        expect(Array.isArray(job.skills)).toBe(true);
        expect(job.skills.length).toBeGreaterThan(0);
      }
    });
  });

  describe("GET /api/jobs/search - Sorting", () => {
    it("should sort by default field (createdAt desc)", async () => {
      const response = await request.get("/api/jobs/search").expect(200);

      if (response.body.jobs.length > 1) {
        const dates = response.body.jobs.map((job: any) =>
          new Date(job.createdAt).getTime(),
        );

        // Check if sorted in descending order
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });

    it("should sort ascending when order=asc", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "createdAt", order: "asc" })
        .expect(200);

      if (response.body.jobs.length > 1) {
        const dates = response.body.jobs.map((job: any) =>
          new Date(job.createdAt).getTime(),
        );

        // Check if sorted in ascending order
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeLessThanOrEqual(dates[i + 1]);
        }
      }
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

      expect(response.body).toHaveProperty("jobs");
    });

    it("should handle very long search query", async () => {
      const longQuery = "a".repeat(500);

      const response = await request
        .get("/api/jobs/search")
        .query({ q: longQuery })
        .expect(200);

      expect(response.body).toHaveProperty("jobs");
    });

    it("should handle empty string filters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ city: "", state: "" })
        .expect(200);

      expect(response.body).toHaveProperty("jobs");
    });

    it("should handle multiple values in skills array", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ skills: ["skill1", "skill2", "skill3", "skill4", "skill5"] })
        .expect(200);

      expect(response.body).toHaveProperty("jobs");
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
      expect(response1.body.jobs.length).toBeGreaterThan(0);
      expect(response2.body.jobs.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/jobs/search - Facets (if implemented)", () => {
    it("should return facet counts for skills", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ facet_by: "skills" })
        .expect(200);

      if (response.body.facets) {
        expect(response.body.facets).toHaveProperty("skills");
        expect(Array.isArray(response.body.facets.skills)).toBe(true);
      }
    });

    it("should return facet counts for jobType", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ facet_by: "jobType" })
        .expect(200);

      if (response.body.facets) {
        expect(response.body.facets).toHaveProperty("jobType");
      }
    });

    it("should return multiple facets", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ facet_by: "skills,jobType,isRemote" })
        .expect(200);

      if (response.body.facets) {
        expect(Object.keys(response.body.facets).length).toBeGreaterThan(0);
      }
    });
  });

  describe("GET /api/jobs/search - Empty States", () => {
    it("should handle no results gracefully", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({
          q: "extremelyuniquequery12345",
          skills: ["nonexistentskill"],
        })
        .expect(200);

      expect(response.body.jobs).toEqual([]);
      expect(response.body.meta.total).toBe(0);
      expect(response.body.meta.totalPages).toBe(0);
      expect(response.body.meta.hasNext).toBe(false);
      expect(response.body.meta.hasPrevious).toBe(false);
    });

    it("should return proper structure even with no results", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ city: "NonexistentCity" })
        .expect(200);

      expect(response.body).toMatchObject({
        jobs: [],
        meta: expect.objectContaining({
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        }),
      });
    });
  });

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
        expect(response.body).toHaveProperty("jobs");
        expect(response.body).toHaveProperty("meta");
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
        expect(response.body).toHaveProperty("jobs");
      });
    });
  });
});
