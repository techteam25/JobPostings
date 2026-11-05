import { request } from "@tests/utils/testHelpers";
import {
  seedUserProfileScenario,
  seedUserScenario,
} from "@tests/utils/seedScenarios";

describe("Job Recommendations Integration Tests", () => {
  describe("GET /api/jobs/recommendations - Authentication", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await request.get("/api/jobs/recommendations");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/jobs/recommendations - Route ordering", () => {
    it("should not be captured by /:jobId route", async () => {
      // If route ordering is wrong, "recommendations" would be treated as a jobId
      // and return a 400 (invalid ID) or 404, not a 401 (auth required)
      const response = await request.get("/api/jobs/recommendations");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/jobs/recommendations - Authenticated requests", () => {
    let cookie: string;

    beforeEach(async () => {
      // cleanAll already ran from setupTests — re-seed and re-authenticate
      await seedUserProfileScenario();

      const auth = await request
        .post("/api/auth/sign-in/email")
        .send({ email: "normal.user@example.com", password: "Password@123" });

      cookie = auth.headers["set-cookie"]?.[0] ?? "";
    });

    it("should return 200 with correct response shape", async () => {
      const response = await request
        .get("/api/jobs/recommendations")
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Recommendations retrieved successfully",
      );
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("page");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body).toHaveProperty("hasPersonalization");
      expect(typeof response.body.hasPersonalization).toBe("boolean");
      expect(response.body).toHaveProperty("timestamp");
    });

    it("should use default page=1 and limit=10 when not provided", async () => {
      const response = await request
        .get("/api/jobs/recommendations")
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 10);
    });

    it("should respect page and limit query parameters", async () => {
      const response = await request
        .get("/api/jobs/recommendations")
        .query({ page: 2, limit: 5 })
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.pagination).toHaveProperty("page", 2);
      expect(response.body.pagination).toHaveProperty("limit", 5);
    });

    it("should include matchScore on each returned job", async () => {
      const response = await request
        .get("/api/jobs/recommendations")
        .set("Cookie", cookie)
        .expect(200);

      for (const job of response.body.data) {
        expect(job).toHaveProperty("matchScore");
        expect(typeof job.matchScore).toBe("number");
      }
    });
  });

  describe("GET /api/jobs/recommendations - Empty profile (cold start)", () => {
    let cookie: string;

    beforeEach(async () => {
      // Create a user WITHOUT a profile (no skills, no preferences)
      await seedUserScenario();

      const auth = await request
        .post("/api/auth/sign-in/email")
        .send({ email: "normal.user@example.com", password: "Password@123" });

      cookie = auth.headers["set-cookie"]?.[0] ?? "";
    });

    it("should return hasPersonalization: false for user with no profile", async () => {
      const response = await request
        .get("/api/jobs/recommendations")
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.hasPersonalization).toBe(false);
    });

    it("should still return a valid paginated response", async () => {
      const response = await request
        .get("/api/jobs/recommendations")
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty("pagination");
    });
  });

  describe("GET /api/jobs/recommendations - Validation", () => {
    let cookie: string;

    beforeEach(async () => {
      await seedUserScenario();

      const auth = await request
        .post("/api/auth/sign-in/email")
        .send({ email: "normal.user@example.com", password: "Password@123" });

      cookie = auth.headers["set-cookie"]?.[0] ?? "";
    });

    it("should reject invalid page number (negative)", async () => {
      const response = await request
        .get("/api/jobs/recommendations")
        .query({ page: -1 })
        .set("Cookie", cookie)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject limit exceeding max (50)", async () => {
      const response = await request
        .get("/api/jobs/recommendations")
        .query({ limit: 51 })
        .set("Cookie", cookie)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject unexpected query parameters", async () => {
      const response = await request
        .get("/api/jobs/recommendations")
        .query({ unexpectedParam: "value" })
        .set("Cookie", cookie)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject non-integer page", async () => {
      const response = await request
        .get("/api/jobs/recommendations")
        .query({ page: 1.5 })
        .set("Cookie", cookie)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
