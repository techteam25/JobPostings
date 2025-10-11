// noinspection DuplicatedCode

import { request, TestHelpers } from "@tests/utils/testHelpers";
import { seedUser, seedUserProfile } from "@tests/utils/seed";
import { userProfileFixture } from "@tests/utils/fixtures";

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

    it("should fail to retrieve current user with invalid token returning 401", async () => {
      const response = await request
        .get("/api/users/me")
        .set("Authorization", `Bearer invalid-token`);

      TestHelpers.validateApiResponse(response, 401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Invalid token");
      expect(response.body).toHaveProperty("error", "UNAUTHORIZED");
    });
  });

  describe("POST and PUT /users/me/profile", () => {
    describe("POST /users/me/profile", () => {
      beforeEach(async () => {
        await seedUser();
      });

      it("should create user profile returning 200", async () => {
        const loginRes = await request.post("/api/auth/login").send({
          email: "normal.user@example.com",
          password: "Password@123",
        });

        const data = loginRes.body.data;

        const profileData = await userProfileFixture();
        const response = await request
          .put("/api/users/me/profile")
          .set("Authorization", `Bearer ${data.tokens.accessToken}`)
          .send(profileData);

        TestHelpers.validateApiResponse(response, 200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("message", "User profile updated");
        expect(response.body.data).toHaveProperty("id", 1);
        expect(response.body.data).toHaveProperty("profile");
        expect(response.body.data.profile).toHaveProperty("userId", 1);
        expect(response.body.data.profile).toHaveProperty(
          "profilePicture",
          profileData.profilePicture,
        );
        expect(response.body.data.profile).toHaveProperty(
          "bio",
          profileData.bio,
        );
        expect(response.body.data.profile).toHaveProperty(
          "profilePicture",
          profileData.profilePicture,
        );
        expect(response.body.data.profile).toHaveProperty(
          "address",
          profileData.address,
        );
        expect(response.body.data.profile).toHaveProperty(
          "linkedinUrl",
          profileData.linkedinUrl,
        );
      });

      it("should update user profile returning 200", async () => {
        await seedUserProfile();
        const loginRes = await request.post("/api/auth/login").send({
          email: "normal.user@example.com",
          password: "Password@123",
        });

        const data = loginRes.body.data;

        const response = await request
          .put("/api/users/me/profile")
          .set("Authorization", `Bearer ${data.tokens.accessToken}`)
          .send({ bio: "Updated bio" });

        TestHelpers.validateApiResponse(response, 200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("message", "User profile updated");
        expect(response.body.data).toHaveProperty("id", 1);
        expect(response.body.data).toHaveProperty("profile");
        expect(response.body.data.profile).toHaveProperty("userId", 1);
        expect(response.body.data.profile).toHaveProperty("bio", "Updated bio");
      });
    });
  });
});
