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

describe("Job Search Sort Functionality Integration Tests", () => {
  let cookie: string;
  const jobIds: number[] = [];

  beforeAll(async () => {
    await seedAdminUser();

    const response = await request
      .post("/api/auth/sign-in/email")
      .send({ email: "admin.user@example.com", password: "Password@123" });

    cookie = response.headers["set-cookie"]![0]!;

    // Clean up database
    await db.delete(jobSkills);
    await db.delete(skills);
    await db.delete(jobsDetails);
    await db.execute(sql.raw(`ALTER TABLE job_skills AUTO_INCREMENT = 1`));
    await db.execute(sql.raw(`ALTER TABLE skills AUTO_INCREMENT = 1`));
    await db.execute(sql.raw(`ALTER TABLE job_details AUTO_INCREMENT = 1`));
    await queueService.obliterateQueue(QUEUE_NAMES.TYPESENSE_QUEUE);

    // Create jobs with different titles and dates
    const jobsToCreate = [
      {
        ...(await jobPostingFixture()),
        title: "Senior Software Engineer",
      },
      {
        ...(await jobPostingFixture()),
        title: "Junior Developer",
      },
      {
        ...(await jobPostingFixture()),
        title: "Data Scientist",
      },
      {
        ...(await jobPostingFixture()),
        title: "Backend Engineer",
      },
      {
        ...(await jobPostingFixture()),
        title: "Frontend Developer",
      },
    ];

    // Create jobs with delays to ensure different timestamps
    for (let i = 0; i < jobsToCreate.length; i++) {
      const res = await request
        .post("/api/jobs")
        .set("Cookie", cookie)
        .send(jobsToCreate[i])
        .expect(201);

      jobIds.push(res.body.data.id);

      // Wait for indexing
      await waitForJobIndexing(res.body.data.id);

      // Small delay to ensure different timestamps
      if (i < jobsToCreate.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  });

  afterAll(async () => {
    // Cleanup Typesense
    await Promise.all(
      jobIds.map((id) => typesenseService.deleteJobDocumentById(String(id))),
    );
  });

  describe("GET /api/jobs/search - Sort by Date Posted Descending", () => {
    it("should return newest jobs first when sorted by date_posted_desc", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "date_posted_desc" })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify jobs are in descending order by creation date
      const jobs = response.body.data;
      for (let i = 0; i < jobs.length - 1; i++) {
        const currentDate = new Date(jobs[i].createdAt).getTime();
        const nextDate = new Date(jobs[i + 1].createdAt).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    });

    it("should default to date_posted_desc when no search query and no sortBy", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ city: "Austin" })
        .expect(200);

      expect(response.body.data).toBeDefined();

      // If results exist, verify they're sorted by date desc
      if (response.body.data.length > 1) {
        const jobs = response.body.data;
        const firstDate = new Date(jobs[0].createdAt).getTime();
        const secondDate = new Date(jobs[1].createdAt).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });
  });

  describe("GET /api/jobs/search - Sort by Date Posted Ascending", () => {
    it("should return oldest jobs first when sorted by date_posted_asc", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "date_posted_asc" })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify jobs are in ascending order by creation date
      const jobs = response.body.data;
      for (let i = 0; i < jobs.length - 1; i++) {
        const currentDate = new Date(jobs[i].createdAt).getTime();
        const nextDate = new Date(jobs[i + 1].createdAt).getTime();
        expect(currentDate).toBeLessThanOrEqual(nextDate);
      }
    });

    it("should override default sort when date_posted_asc is specified with filters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "date_posted_asc", jobType: ["full-time"] })
        .expect(200);

      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 1) {
        const jobs = response.body.data;
        const firstDate = new Date(jobs[0].createdAt).getTime();
        const lastDate = new Date(jobs[jobs.length - 1].createdAt).getTime();
        expect(firstDate).toBeLessThanOrEqual(lastDate);
      }
    });
  });

  describe("GET /api/jobs/search - Sort by Title Ascending", () => {
    it("should return jobs alphabetically by title when sorted by title_asc", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "title_asc" })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify jobs are in ascending alphabetical order by title
      const jobs = response.body.data;
      for (let i = 0; i < jobs.length - 1; i++) {
        const currentTitle = jobs[i].title.toLowerCase();
        const nextTitle = jobs[i + 1].title.toLowerCase();
        expect(currentTitle.localeCompare(nextTitle)).toBeLessThanOrEqual(0);
      }
    });

    it("should handle title_asc with search query", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ q: "engineer", sortBy: "title_asc" })
        .expect(200);

      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 1) {
        const jobs = response.body.data;
        const firstTitle = jobs[0].title.toLowerCase();
        const secondTitle = jobs[1].title.toLowerCase();
        expect(firstTitle.localeCompare(secondTitle)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe("GET /api/jobs/search - Sort by Title Descending", () => {
    it("should return jobs reverse alphabetically by title when sorted by title_desc", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "title_desc" })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify jobs are in descending alphabetical order by title
      const jobs = response.body.data;
      for (let i = 0; i < jobs.length - 1; i++) {
        const currentTitle = jobs[i].title.toLowerCase();
        const nextTitle = jobs[i + 1].title.toLowerCase();
        expect(currentTitle.localeCompare(nextTitle)).toBeGreaterThanOrEqual(0);
      }
    });

    it("should handle title_desc with filters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "title_desc", isActive: true })
        .expect(200);

      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 1) {
        const jobs = response.body.data;
        const firstTitle = jobs[0].title.toLowerCase();
        const lastTitle = jobs[jobs.length - 1].title.toLowerCase();
        expect(firstTitle.localeCompare(lastTitle)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("GET /api/jobs/search - Relevance Sorting", () => {
    it("should return relevant results first when sorted by relevance with search query", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ q: "engineer", sortBy: "relevance" })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Jobs containing "engineer" should be in results
      const jobs = response.body.data;
      if (jobs.length > 0) {
        const hasEngineerInResults = jobs.some((job: any) =>
          job.title.toLowerCase().includes("engineer"),
        );
        expect(hasEngineerInResults).toBe(true);
      }
    });

    it("should handle relevance sort without search query", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "relevance" })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty("pagination");
    });
  });

  describe("GET /api/jobs/search - Default Sort Behavior", () => {
    it("should default to relevance when search query exists", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ q: "developer" })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Results should contain relevant matches
      const jobs = response.body.data;
      if (jobs.length > 0) {
        const hasDeveloperInResults = jobs.some((job: any) =>
          job.title.toLowerCase().includes("developer"),
        );
        expect(hasDeveloperInResults).toBe(true);
      }
    });

    it("should default to date_posted_desc when no search query", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({})
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // If multiple results, verify date descending order
      if (response.body.data.length > 1) {
        const jobs = response.body.data;
        const firstDate = new Date(jobs[0].createdAt).getTime();
        const secondDate = new Date(jobs[1].createdAt).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });
  });

  describe("GET /api/jobs/search - Invalid Sort Values", () => {
    it("should return 400 for invalid sortBy value", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "invalid_sort" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should return 400 for numeric sortBy value", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "123" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for array sortBy value", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: ["date_posted_desc", "title_asc"] })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/jobs/search - Sort Combined with Filters", () => {
    it("should apply sort with location filters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({
          city: "Austin",
          state: "TX",
          sortBy: "title_asc",
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should apply sort with skills filters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({
          skills: ["JavaScript", "TypeScript"],
          sortBy: "date_posted_desc",
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should apply sort with job type filters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({
          jobType: ["full-time"],
          sortBy: "title_desc",
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should apply sort with multiple combined filters", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({
          q: "engineer",
          city: "Austin",
          jobType: ["full-time"],
          isActive: true,
          sortBy: "date_posted_asc",
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should apply sort with remote filter", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({
          includeRemote: true,
          sortBy: "title_asc",
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/jobs/search - Sort with Pagination", () => {
    it("should maintain sort order across paginated results", async () => {
      const page1Response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "title_asc", page: 1, limit: 2 })
        .expect(200);

      const page2Response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "title_asc", page: 2, limit: 2 })
        .expect(200);

      expect(page1Response.body.data).toBeDefined();
      expect(page2Response.body.data).toBeDefined();

      if (
        page1Response.body.data.length > 0 &&
        page2Response.body.data.length > 0
      ) {
        const lastJobPage1 =
          page1Response.body.data[page1Response.body.data.length - 1];
        const firstJobPage2 = page2Response.body.data[0];

        // Last job of page 1 should come before first job of page 2 alphabetically
        expect(
          lastJobPage1.title
            .toLowerCase()
            .localeCompare(firstJobPage2.title.toLowerCase()),
        ).toBeLessThanOrEqual(0);
      }
    });

    it("should apply date_posted_desc with pagination", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "date_posted_desc", page: 1, limit: 3 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toHaveProperty("page", "1");
      expect(response.body.pagination).toHaveProperty("limit", "3");

      if (response.body.data.length > 1) {
        const jobs = response.body.data;
        const firstDate = new Date(jobs[0].createdAt).getTime();
        const lastDate = new Date(jobs[jobs.length - 1].createdAt).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(lastDate);
      }
    });

    it("should apply relevance sort with pagination", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ q: "developer", sortBy: "relevance", page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toHaveProperty("page", "1");
      expect(response.body.pagination).toHaveProperty("limit", "5");
    });

    it("should handle large page numbers with sort", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "title_desc", page: 100, limit: 10 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      // May be empty if no results on that page
    });
  });

  describe("GET /api/jobs/search - Sort Edge Cases", () => {
    it("should handle sort with zero results", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ q: "nonexistentjob12345xyz", sortBy: "date_posted_desc" })
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should handle sort with single result", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ q: "Data Scientist", sortBy: "title_asc" })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should handle case-insensitive title sorting", async () => {
      const response = await request
        .get("/api/jobs/search")
        .query({ sortBy: "title_asc" })
        .expect(200);

      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 1) {
        const jobs = response.body.data;
        // Verify case-insensitive alphabetical order
        for (let i = 0; i < jobs.length - 1; i++) {
          const current = jobs[i].title.toLowerCase();
          const next = jobs[i + 1].title.toLowerCase();
          expect(current.localeCompare(next)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe("GET /api/jobs/search - Performance with Sort", () => {
    it("should respond quickly with sort parameter", async () => {
      const start = Date.now();

      await request
        .get("/api/jobs/search")
        .query({ sortBy: "date_posted_desc" })
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it("should handle multiple concurrent sort requests", async () => {
      const requests = [
        request.get("/api/jobs/search").query({ sortBy: "date_posted_desc" }),
        request.get("/api/jobs/search").query({ sortBy: "date_posted_asc" }),
        request.get("/api/jobs/search").query({ sortBy: "title_asc" }),
        request.get("/api/jobs/search").query({ sortBy: "title_desc" }),
        request.get("/api/jobs/search").query({ sortBy: "relevance" }),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("data");
      });
    });
  });
});