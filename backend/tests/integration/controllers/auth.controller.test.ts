import { request, TestHelpers } from "@tests/utils/testHelpers";

describe("Authentication Controller Integration Tests", () => {
  describe("POST /register", () => {
    it("should register a new user returning 201", async () => {
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

    it("should fail to register a new user returning 400", async () => {
      const { faker } = await import("@faker-js/faker");
      const newUser = {
        email: faker.internet.email(),
        password: "Password@123",
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: "user",
      };

      await request.post("/api/auth/register").send(newUser);
      const response = await request
        .post("/api/auth/register")
        .send({ ...newUser, email: newUser.email });

      TestHelpers.validateApiResponse(response, 400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Registration failed");
    });
  });

  describe("POST /login", () => {
    it("should login a user returning 200", async () => {
      const { faker } = await import("@faker-js/faker");
      const newUser = {
        email: faker.internet.email(),
        password: "Password@123",
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: "user",
      };

      await request.post("/api/auth/register").send(newUser);
      const response = await request
        .post("/api/auth/login")
        .send({ email: newUser.email, password: newUser.password });

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data).toHaveProperty("tokens");
      expect(response.body.data.tokens).toHaveProperty("accessToken");
      expect(response.body.data.tokens).toHaveProperty("refreshToken");
    });

    it("should fail to login a user returning 400", async () => {
      const { faker } = await import("@faker-js/faker");
      const newUser = {
        email: faker.internet.email(),
        password: "Password@123",
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: "user",
      };

      await request.post("/api/auth/register").send(newUser);
      const response = await request
        .post("/api/auth/login")
        .send({ email: newUser.email, password: "WrongPassword" });

      TestHelpers.validateApiResponse(response, 401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Login failed");
    });
  });
});
