import { request, TestHelpers } from "@tests/utils/testHelpers";
import { seedUser } from "@tests/utils/seed";

describe("User Controller Integration Tests", () => {
  describe("GET /users", () => {
    beforeEach(async () => {
      await seedUser();
    });

    it("should retrieve currently logged in user returning 200", async () => {
      const loginRes = await request.post("/api/auth/login").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const data = loginRes.body.data;

      const response = await request
        .get("/api/users/me")
        .set("Authorization", `Bearer ${data.tokens.accessToken}`);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Current user retrieved successfully",
      );
      expect(response.body.data).toHaveProperty("id", 1);
      expect(response.body.data).toHaveProperty(
        "email",
        "normal.user@example.com",
      );
      expect(response.body.data).not.toHaveProperty("passwordHash");
      expect(response.body.data).toHaveProperty("firstName");
      expect(response.body.data).toHaveProperty("lastName");
      expect(response.body.data).toHaveProperty("role", "user");
    });

    it("should fail to retrieve current user when not authenticated returning 401", async () => {
      const response = await request.get("/api/users/me");

      TestHelpers.validateApiResponse(response, 401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required",
      );
      expect(response.body).toHaveProperty("error", "UNAUTHORIZED");
    });
  });
});
