import { request, TestHelpers } from "@tests/utils/testHelpers";
import { seedUser } from "@tests/utils/seed";

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

    it("should fail to retrieve deactivated user returning 403", async () => {
      await seedUser("deactivated"); // Seed an inactive user

      const response = await request.post("/api/auth/login").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      TestHelpers.validateApiResponse(response, 401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Login failed");
      expect(response.body).toHaveProperty("error", "Account is deactivated");
    });
  });

  describe("POST /change-password", () => {
    it("should change the user's password returning 200", async () => {
      await seedUser("active");

      // Login to get tokens
      const loginResponse = await request.post("/api/auth/login").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const data = loginResponse.body.data;

      const response = await request
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${data.tokens.accessToken}`)
        .send({
          currentPassword: "Password@123",
          newPassword: "NewPassword@123",
        });

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Password changed successfully",
      );
    });

    it("should fail to change the user's password returning 400", async () => {
      await seedUser("active");

      // Login to get tokens
      const loginResponse = await request.post("/api/auth/login").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const data = loginResponse.body.data;
      const response = await request
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${data.tokens.accessToken}`)
        .send({
          currentPassword: "WrongCurrentPassword",
          newPassword: "NewPassword@123",
        });

      TestHelpers.validateApiResponse(response, 400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });
  });
});
