// noinspection DuplicatedCode

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/email.service", () => {
  const mockSendAccountDeactivationConfirmation = vi
    .fn()
    .mockResolvedValue(undefined);
  const mockSendAccountDeletionConfirmation = vi
    .fn()
    .mockResolvedValue(undefined);

  return {
    EmailService: class {
      sendAccountDeactivationConfirmation =
        mockSendAccountDeactivationConfirmation;
      sendAccountDeletionConfirmation = mockSendAccountDeletionConfirmation;
    },
  };
});

import { request, TestHelpers } from "@tests/utils/testHelpers";
import { seedUser, seedUserProfile } from "@tests/utils/seed";
import {
  userCertificationsFixture,
  userProfileFixture,
  workExperiencesFixture,
} from "@tests/utils/fixtures";
import { db } from "@/db/connection";
import { userCertifications, userProfile } from "@/db/schema";
import { sql } from "drizzle-orm";

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
        db.delete(userCertifications).catch(console.error);
        db.delete(userProfile).catch(console.error);
        await db.execute(sql`ALTER TABLE user_profile AUTO_INCREMENT = 1`);
        await seedUser();
      });

      it("should create user profile returning 201", async () => {
        const loginRes = await request.post("/api/auth/login").send({
          email: "normal.user@example.com",
          password: "Password@123",
        });

        const data = loginRes.body.data;

        const profileData = await userProfileFixture();
        const response = await request
          .post("/api/users/me/profile")
          .set("Authorization", `Bearer ${data.tokens.accessToken}`)
          .send(profileData);

        console.log(JSON.stringify(response.body, null, 2));

        TestHelpers.validateApiResponse(response, 201);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("message", "User profile created");
        expect(response.body.data).toHaveProperty("id", 1);
        expect(response.body.data).toHaveProperty("userId", 1);
        expect(response.body.data).toHaveProperty(
          "profilePicture",
          profileData.profilePicture,
        );
        expect(response.body.data).toHaveProperty("bio", profileData.bio);
        expect(response.body.data).toHaveProperty(
          "profilePicture",
          profileData.profilePicture,
        );
        expect(response.body.data).toHaveProperty(
          "address",
          profileData.address,
        );
        expect(response.body.data).toHaveProperty(
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
          .send({
            bio: "Updated bio",
            educations: [
              {
                schoolName: "Test University",
                program: "Bachelors" as const,
                major: "Computer Science",
                graduated: true,
                startDate: new Date("2015-08-15T00:00:00Z"),
                endDate: new Date("2019-05-20T00:00:00Z"),
              },
            ],
            workExperiences: await workExperiencesFixture(),
            certifications: userCertificationsFixture(),
          });

        console.log(JSON.stringify(response.body, null, 2));

        TestHelpers.validateApiResponse(response, 200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("message", "User profile updated");
        expect(response.body.data).toHaveProperty("id", 1);
        expect(response.body.data).toHaveProperty("profile");
        expect(response.body.data.profile).toHaveProperty("userId", 1);
        expect(response.body.data.profile).toHaveProperty("bio", "Updated bio");
      });
    });

    describe("PATCH /users/me/deactivate", () => {
      beforeEach(async () => {
        // mockSendAccountDeactivationConfirmation.mockClear();

        await seedUser();
      });

      it("should deactivate user account returning 200", async () => {
        const loginRes = await request.post("/api/auth/login").send({
          email: "normal.user@example.com",
          password: "Password@123",
        });

        const data = loginRes.body.data;

        const response = await request
          .patch("/api/users/me/deactivate")
          .set("Authorization", `Bearer ${data.tokens.accessToken}`);

        console.log(JSON.stringify(response.body, null, 2));

        TestHelpers.validateApiResponse(response, 200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty(
          "message",
          "Account deactivated successfully",
        );
        expect(response.body.data).toHaveProperty("id", 1);
        expect(response.body.data).toHaveProperty("status", "deactivated");
      });
    });

    describe("DELETE /me/delete", () => {
      beforeEach(async () => {
        // mockSendAccountDeletionConfirmation.mockClear();
        await seedUser();
      });

      it("should delete user account returning 204", async () => {
        const loginRes = await request.post("/api/auth/login").send({
          email: "normal.user@example.com",
          password: "Password@123",
        });

        const data = loginRes.body.data;
        const response = await request
          .delete("/api/users/me/delete")
          .set("Authorization", `Bearer ${data.tokens.accessToken}`)
          .send({ currentPassword: "Password@123", confirm: true });

        console.log(JSON.stringify(response.body, null, 2));

        expect(response.status).toBe(204);
      });
    });
  });
});
