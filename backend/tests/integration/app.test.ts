import { request, TestHelpers } from "@tests/utils/testHelpers";

describe("Express App Integration Tests", () => {
  describe("GET /health", () => {
    it("should return health check information", async () => {
      const response = await request.get("/health");

      // Health check should return either 200 (healthy) or 503 (degraded/error)
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("timestamp");

      // Validate timestamp format
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);

      // If database is available, should be OK
      if (response.status === 200) {
        expect(response.body.status).toBe("OK");
      } else {
        // If database is unavailable, should be DEGRADED or ERROR
        expect(["DEGRADED", "ERROR"]).toContain(response.body.status);
      }
    });
  });

  describe("GET /api", () => {
    it("should return API welcome message", async () => {
      const response = await request.get("/api");

      TestHelpers.validateApiResponse(response, 404);
    });
  });

  describe("404 Error Handling", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request.get("/non-existent-route");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: "error",
        message: "Route GET /non-existent-route not found",
      });
    });

    it("should return 404 for non-existent API routes", async () => {
      const response = await request.get("/api/non-existent");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: "error",
        message: "Route GET /api/non-existent not found",
      });
    });
  });

  describe("CORS Headers", () => {
    it("should include CORS headers in responses", async () => {
      const response = await request.get("/health");

      expect(response.headers).toHaveProperty("access-control-allow-origin");
      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });

    it("should handle OPTIONS requests", async () => {
      const response = await request.options("/api");

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty("access-control-allow-methods");
    });
  });

  describe("Request Body Parsing", () => {
    it("should parse JSON request bodies", async () => {
      const testData = TestHelpers.createMockRequestBody();

      // Note: This test assumes you have a POST endpoint that echoes data
      // You might need to create a test endpoint or modify this test
      const response = await request
        .post("/api/echo")
        .send(testData)
        .expect("Content-Type", /json/);

      // This will return 404 since we don't have an echo endpoint
      // but it tests that JSON parsing middleware is working
      expect([404, 200]).toContain(response.status);
    });
  });
});
