// noinspection DuplicatedCode

import { request, TestHelpers } from "@tests/utils/testHelpers";
import { userFixture } from "@tests/utils/fixtures";
import { beforeEach, expect } from "vitest";
import { seedUserScenario } from "@tests/utils/seedScenarios";

describe("Authentication Controller Integration Tests", () => {
  describe("POST /sign-up/email", () => {
    it("should register a new user returning 201", async () => {
      const newUser = await userFixture();

      const response = await request
        .post("/api/auth/sign-up/email")
        .send(newUser);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe(newUser.email.toLowerCase());
      expect(response.body.user.name).toBe(newUser.name);
      expect(response.body.user.image).toBe(newUser.image);
      expect(response.body.user.name).toBe(newUser.name);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should fail to register a new user returning 422", async () => {
      const newUser = await userFixture();

      await request.post("/api/auth/sign-up/email").send(newUser);
      const response = await request
        .post("/api/auth/sign-up/email")
        .send({ ...newUser, email: newUser.email });

      TestHelpers.validateApiResponse(response, 422);
      expect(response.body).toHaveProperty(
        "message",
        "User already exists. Use another email.",
      );
    });
  });

  describe("POST /sign-in/email", () => {
    it("should login a user returning 200", async () => {
      const newUser = await userFixture();

      await request.post("/api/auth/sign-up/email").send(newUser);
      const response = await request
        .post("/api/auth/sign-in/email")
        .send({ email: newUser.email, password: newUser.password });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe(newUser.email.toLowerCase());
      expect(response.body.user.name).toBe(newUser.name);
      expect(response.body.user.image).toBe(newUser.image);
      expect(response.body.user.name).toBe(newUser.name);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should fail to login a user returning 401", async () => {
      const newUser = await userFixture();

      await request.post("/api/auth/sign-up/").send(newUser);
      const response = await request
        .post("/api/auth/sign-in/email")
        .send({ email: newUser.email, password: "WrongPassword" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        "message",
        "Invalid email or password",
      );
    });

    it("should fail to login deactivated user returning 401", async () => {
      await seedUserScenario("deactivated");

      const response = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Account is not active");
    });
  });

  describe("POST /change-password", () => {
    it("should change the user's password returning 200", async () => {
      await seedUserScenario();

      // Login to get tokens
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      const response = await request
        .post("/api/auth/change-password")
        .set("Cookie", cookie ?? "")
        .send({
          currentPassword: "Password@123",
          newPassword: "NewPassword@123",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty(
        "email",
        "normal.user@example.com",
      );
    });

    it("should fail to change the user's password returning 400", async () => {
      await seedUserScenario();

      // Login to get tokens
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      const response = await request
        .post("/api/auth/change-password")
        .set("Cookie", cookie ?? "")
        .send({
          currentPassword: "WrongCurrentPassword",
          newPassword: "NewPassword@123",
        });

      TestHelpers.validateApiResponse(response, 400);
      expect(response.body).toHaveProperty("message", "Invalid password");
    });
  });
});
