// noinspection DuplicatedCode

import { beforeEach, describe, expect, it, vi } from "vitest";
import { request, TestHelpers } from "@tests/utils/testHelpers";
import { sql } from "drizzle-orm";

import { auth } from "@/utils/auth";
import { db } from "@/db/connection";

import {
  certifications,
  educations,
  userCertifications,
  userProfile,
  workExperiences,
} from "@/db/schema";

import {
  seedOrganizations,
  seedUser,
  seedUserProfile,
} from "@tests/utils/seed";
import {
  userCertificationsFixture,
  userProfileFixture,
  workExperiencesFixture,
} from "@tests/utils/fixtures";

const {
  mockSendAccountDeactivationConfirmation,
  mockSendAccountDeletionConfirmation,
} = vi.hoisted(() => ({
  mockSendAccountDeactivationConfirmation: vi.fn().mockResolvedValue(undefined),
  mockSendAccountDeletionConfirmation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/email.service", () => {
  // noinspection JSUnusedGlobalSymbols
  return {
    EmailService: class {
      sendAccountDeactivationConfirmation =
        mockSendAccountDeactivationConfirmation;
      sendAccountDeletionConfirmation = mockSendAccountDeletionConfirmation;
    },
  };
});

// Mock the better-auth client
vi.mock("@/utils/auth", async () => {
  // get the real module first
  const actual = await vi.importActual<Record<string, any>>("@/utils/auth");

  // clone and override only deleteUser
  return {
    ...actual,
    auth: {
      ...actual.auth,
      api: {
        ...actual.auth.api,
        deleteUser: vi.fn().mockResolvedValue({ success: true }),
      },
    },
  };
});

describe("User Controller Integration Tests", () => {
  describe("GET /users", () => {
    beforeEach(async () => {
      await seedUser();
    });

    it("should retrieve currently logged in user returning 200", async () => {
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      const response = await request
        .get("/api/users/me")
        .set("Cookie", cookie!);

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
      expect(response.body.data).toHaveProperty("fullName");
      expect(response.body.data).toHaveProperty("image");
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
      const response = await request.get("/api/users/me").set("Cookie", "");

      TestHelpers.validateApiResponse(response, 401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Authentication required",
      );
      expect(response.body).toHaveProperty("error", "UNAUTHORIZED");
    });
  });

  describe("POST and PUT /users/me/profile", () => {
    describe("POST /users/me/profile", () => {
      beforeEach(async () => {
        db.delete(userCertifications).catch(console.error);

        db.delete(educations).catch(console.error);
        db.delete(workExperiences).catch(console.error);
        db.delete(certifications).catch(console.error);
        db.delete(userProfile).catch(console.error);
        await db.execute(sql`ALTER TABLE user_profile AUTO_INCREMENT = 1`);
        await seedUser();
      });

      it("should create user profile returning 201", async () => {
        const loginResponse = await request
          .post("/api/auth/sign-in/email")
          .send({
            email: "normal.user@example.com",
            password: "Password@123",
          });

        const cookie = loginResponse.headers["set-cookie"]
          ? loginResponse.headers["set-cookie"][0]
          : "";

        const profileData = await userProfileFixture();

        const response = await request
          .post("/api/users/me/profile")
          .set("Cookie", cookie!)
          .send(profileData);

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
        const loginResponse = await request
          .post("/api/auth/sign-in/email")
          .send({
            email: "normal.user@example.com",
            password: "Password@123",
          });

        const cookie = loginResponse.headers["set-cookie"]
          ? loginResponse.headers["set-cookie"][0]
          : "";

        const response = await request
          .put("/api/users/me/profile")
          .set("Cookie", cookie!)
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
        vi.clearAllMocks();

        await seedUser();
      });

      it("should deactivate user account returning 200", async () => {
        const loginResponse = await request
          .post("/api/auth/sign-in/email")
          .send({
            email: "normal.user@example.com",
            password: "Password@123",
          });

        const cookie = loginResponse.headers["set-cookie"]
          ? loginResponse.headers["set-cookie"][0]
          : "";

        const response = await request
          .patch("/api/users/me/deactivate")
          .set("Cookie", cookie!);

        TestHelpers.validateApiResponse(response, 200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty(
          "message",
          "Account deactivated successfully",
        );
        expect(response.body.data).toHaveProperty("id", 1);
        expect(response.body.data).toHaveProperty("status", "deactivated");
        expect(mockSendAccountDeactivationConfirmation).toHaveBeenCalledTimes(
          1,
        );
      });
    });

    describe("DELETE /me/delete", () => {
      beforeEach(async () => {
        vi.clearAllMocks();

        await seedOrganizations();
      });

      it("should delete user account returning 204", async () => {
        const loginResponse = await request
          .post("/api/auth/sign-in/email")
          .send({
            email: "org.owner@example.com",
            password: "Password@123",
          });

        const cookie = loginResponse.headers["set-cookie"]
          ? loginResponse.headers["set-cookie"][0]
          : "";

        const response = await request
          .delete("/api/users/me/delete")
          .set("Cookie", cookie!)
          .send({ currentPassword: "Password@123", confirm: true });

        const token = "Password@123";

        expect(response.status).toBe(204);
        expect(mockSendAccountDeletionConfirmation).toHaveBeenCalledTimes(1);
        expect(auth.api.deleteUser).toHaveBeenCalledWith({ body: { token } });
      });
    });
  });
});
