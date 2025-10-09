import { beforeEach } from "vitest";

import { request, TestHelpers } from "@tests/utils/testHelpers";
import { seedJobs } from "@tests/utils/seed";

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
  });
});
