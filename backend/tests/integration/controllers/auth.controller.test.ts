import { request, TestHelpers } from "@tests/utils/testHelpers";

describe("Authentication Controller Integration Tests", () => {
  describe("POST /register", () => {
    it("should register a new user", async () => {
      const { faker } = await import("@faker-js/faker");
      const newUser = {
        email: faker.internet.email(),
        password: "Password@123",
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: "user",
      };

      const response = await request.post("/api/auth/register").send(newUser);

      TestHelpers.validateApiResponse(response, 201);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data.user).toHaveProperty("id");
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.firstName).toBe(newUser.firstName);
      expect(response.body.data.user.lastName).toBe(newUser.lastName);
      expect(response.body.data.user.role).toBe(newUser.role);
      expect(response.body.data.user).not.toHaveProperty("password");
    });
  });
});
