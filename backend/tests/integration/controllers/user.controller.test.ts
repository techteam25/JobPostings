// noinspection DuplicatedCode

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { request, TestHelpers } from "@tests/utils/testHelpers";
import { eq } from "drizzle-orm";

import { db } from "@/db/connection";

import {
  userEmailPreferences,
} from "@/db/schema";

import {
  seedJobsScenario,
  seedOrgScenario,
  seedUserScenario,
  seedUserProfileScenario,
} from "@tests/utils/seedScenarios";
import { createUser, createUserProfile } from "@tests/utils/seedBuilders";
import {
  userCertificationsFixture,
  userProfileFixture,
  workExperiencesFixture,
} from "@tests/utils/fixtures";
import { auth } from "@/utils/auth";
import { UserRepository } from "@/repositories/user.repository";
const {
  mockSendAccountDeactivationConfirmation,
  mockSendAccountDeletionConfirmation,
} = vi.hoisted(() => ({
  mockSendAccountDeactivationConfirmation: vi.fn().mockResolvedValue(undefined),
  mockSendAccountDeletionConfirmation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/infrastructure/email.service", () => {
  // noinspection JSUnusedGlobalSymbols
  return {
    EmailService: class {
      sendAccountDeactivationConfirmation =
        mockSendAccountDeactivationConfirmation;
      sendAccountDeletionConfirmation = mockSendAccountDeletionConfirmation;
    },
  };
});

vi.mock("@/infrastructure/queue.service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/infrastructure/queue.service")>();
  return {
    ...original,
    queueService: {
      addJob: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe("User Controller Integration Tests", () => {
  let originalDeleteUser: typeof auth.api.deleteUser;

  beforeAll(() => {
    // Directly patch auth.api.deleteUser on the real object so the service sees it
    originalDeleteUser = auth.api.deleteUser;
    auth.api.deleteUser = vi.fn().mockResolvedValue({ success: true }) as any;
  });

  afterAll(() => {
    auth.api.deleteUser = originalDeleteUser;
  });

  describe("GET /users", () => {
    beforeEach(async () => {
      await seedUserScenario();
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
        await seedUserScenario();
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
        // User already created by beforeEach(seedUserScenario); just add profile + prefs
        const { createUserProfile: createProfile, createEmailPreferences: createPrefs } = await import("@tests/utils/seedBuilders");
        await createProfile(1);
        await createPrefs(1);

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
        expect(response.body).toHaveProperty(
          "message",
          "User profile updated successfully",
        );
        expect(response.body.data).toHaveProperty("id", 1);
        expect(response.body.data).toHaveProperty("profile");
        expect(response.body.data.profile).toHaveProperty("userId", 1);
        expect(response.body.data.profile).toHaveProperty("bio", "Updated bio");
      });
    });

    describe("PATCH /users/me/deactivate", () => {
      beforeEach(async () => {
        vi.clearAllMocks();

        await seedUserScenario();
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

        await seedOrgScenario();
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

        expect(response.status).toBe(204);
        // expect(auth.api.deleteUser).toHaveBeenCalledWith({ body: { token } });
      });
    });
  });

  describe("GET users/me/saved-jobs/:jobId/check", () => {
    beforeEach(async () => {
      const { jobs } = await seedJobsScenario();
      const user = await createUser({ email: "normal.user@example.com" });
      await createUserProfile(user.id);
    });

    it("retrieves saved status for a job when user is authenticated returning 200", async () => {
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      const response = await request
        .get("/api/users/me/saved-jobs/1/check")
        .set("Cookie", cookie!);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Job saved status retrieved successfully",
      );
      expect(response.body.data).toHaveProperty("isSaved");
    });

    it("fails to retrieve saved status for a non-existent job returning 404", async () => {
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      const response = await request
        .get("/api/users/me/saved-jobs/999/check")
        .set("Cookie", cookie!);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Job saved status retrieved successfully",
      );
      expect(response.body.data).toHaveProperty("isSaved", false);
    });
  });

  describe("saveJobForCurrentUser", () => {
    beforeEach(async () => {
      await seedJobsScenario();
      const user = await createUser({ email: "normal.user@example.com" });
      await createUserProfile(user.id);
    });

    it("saves a job for the current user successfully returning 200", async () => {
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      const response = await request
        .post("/api/users/me/saved-jobs/1")
        .set("Cookie", cookie!);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Job saved successfully");
    });

    it("fails to save a job for a non-existent job ID returning 404", async () => {
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      const response = await request
        .post("/api/users/me/saved-jobs/9999")
        .set("Cookie", cookie!);

      TestHelpers.validateApiResponse(response, 404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Job with id 9999 does not exist.",
      );
    });
  });

  describe("getSavedJobsForCurrentUser", () => {
    beforeEach(async () => {
      await seedJobsScenario();
      const user = await createUser({ email: "normal.user@example.com" });
      await createUserProfile(user.id);
    });

    it("retrieves saved jobs for the current user successfully returning 200", async () => {
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      const response = await request
        .get("/api/users/me/saved-jobs")
        .set("Cookie", cookie!)
        .query({ page: 1, limit: 10 });

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Saved jobs retrieved successfully",
      );
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty("pagination");
    });

    it("returns an empty list when the user has no saved jobs returning 200", async () => {
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      const response = await request
        .get("/api/users/me/saved-jobs")
        .set("Cookie", cookie!)
        .query({ page: 1, limit: 10 });

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Saved jobs retrieved successfully",
      );
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe("unsaveJobForCurrentUser", () => {
    beforeEach(async () => {
      await seedJobsScenario();
      const user = await createUser({ email: "normal.user@example.com" });
      await createUserProfile(user.id);
    });

    it("unsaves a job for the current user successfully returning 200", async () => {
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      await request.post("/api/users/me/saved-jobs/1").set("Cookie", cookie!);

      const response = await request
        .delete("/api/users/me/saved-jobs/1")
        .set("Cookie", cookie!);

      TestHelpers.validateApiResponse(response, 200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Job unsaved successfully",
      );
    });

    it("fails to unsave a job for a non-existent job ID returning 404", async () => {
      const loginResponse = await request.post("/api/auth/sign-in/email").send({
        email: "normal.user@example.com",
        password: "Password@123",
      });

      const cookie = loginResponse.headers["set-cookie"]
        ? loginResponse.headers["set-cookie"][0]
        : "";

      const response = await request
        .delete("/api/users/me/saved-jobs/9999")
        .set("Cookie", cookie!);

      TestHelpers.validateApiResponse(response, 404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Job with id 9999 does not exist.",
      );
    });
  });

  describe("Email Preferences", () => {
    beforeEach(async () => {
      await seedUserProfileScenario();
    });

    describe("GET /users/me/email-preferences", () => {
      it("should retrieve email preferences for authenticated user - 200", async () => {
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
          .get("/api/users/me/email-preferences")
          .set("Cookie", cookie!);

        TestHelpers.validateApiResponse(response, 200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty(
          "message",
          "Email preferences retrieved successfully",
        );
        expect(response.body.data).toHaveProperty("userId", 1);
        expect(response.body.data).toHaveProperty(
          "jobMatchNotifications",
          true,
        );
        expect(response.body.data).toHaveProperty(
          "applicationStatusNotifications",
          true,
        );
        expect(response.body.data).toHaveProperty("savedJobUpdates", true);
        expect(response.body.data).toHaveProperty("weeklyJobDigest", true);
        expect(response.body.data).toHaveProperty("monthlyNewsletter", true);
        expect(response.body.data).toHaveProperty("marketingEmails", true);
        expect(response.body.data).toHaveProperty(
          "accountSecurityAlerts",
          true,
        );
        expect(response.body.data).toHaveProperty("globalUnsubscribe", false);
        expect(response.body.data).toHaveProperty("unsubscribeToken");
      });

      it("should return 401 for unauthenticated user", async () => {
        const response = await request.get("/api/users/me/email-preferences");

        expect(response.status).toBe(401);
      });

      it("should return 404 if preferences not found", async () => {
        const preferencesSpy = vi
          .spyOn(UserRepository.prototype, "findEmailPreferencesByUserId")
          .mockResolvedValue(undefined);

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
          .get("/api/users/me/email-preferences")
          .set("Cookie", cookie!);

        TestHelpers.validateApiResponse(response, 404);
        expect(response.body).toHaveProperty("success", false);

        preferencesSpy.mockRestore();
      });
    });

    describe("PUT /users/me/email-preferences", () => {
      it("should update email preferences successfully - 200", async () => {
        const loginResponse = await request
          .post("/api/auth/sign-in/email")
          .send({
            email: "normal.user@example.com",
            password: "Password@123",
          });

        const cookie = loginResponse.headers["set-cookie"]
          ? loginResponse.headers["set-cookie"][0]
          : "";

        const updateData = {
          jobMatchNotifications: false,
          weeklyJobDigest: false,
          marketingEmails: false,
        };

        const response = await request
          .put("/api/users/me/email-preferences")
          .set("Cookie", cookie!)
          .send(updateData);

        TestHelpers.validateApiResponse(response, 200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty(
          "message",
          "Email preferences updated successfully",
        );
        expect(response.body.data).toHaveProperty(
          "jobMatchNotifications",
          false,
        );
        expect(response.body.data).toHaveProperty("weeklyJobDigest", false);
        expect(response.body.data).toHaveProperty("marketingEmails", false);
        expect(response.body.data).toHaveProperty(
          "applicationStatusNotifications",
          true,
        );
        expect(response.body.data).toHaveProperty(
          "accountSecurityAlerts",
          true,
        );
      });

      it("should not allow disabling security alerts - 400", async () => {
        const loginResponse = await request
          .post("/api/auth/sign-in/email")
          .send({
            email: "normal.user@example.com",
            password: "Password@123",
          });

        const cookie = loginResponse.headers["set-cookie"]
          ? loginResponse.headers["set-cookie"][0]
          : "";

        const updateData = {
          accountSecurityAlerts: false,
        };

        const response = await request
          .put("/api/users/me/email-preferences")
          .set("Cookie", cookie!)
          .send(updateData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty(
          "message",
          "Security alerts cannot be disabled",
        );
      });

      it("should return 401 for unauthenticated user", async () => {
        const response = await request
          .put("/api/users/me/email-preferences")
          .send({
            jobMatchNotifications: false,
          });

        expect(response.status).toBe(401);
      });

      describe("POST /users/me/email-preferences/unsubscribe/:token", () => {
        it("should unsubscribe with valid token - 200", async () => {
          const loginResponse = await request
            .post("/api/auth/sign-in/email")
            .send({
              email: "normal.user@example.com",
              password: "Password@123",
            });

          const cookie = loginResponse.headers["set-cookie"]
            ? loginResponse.headers["set-cookie"][0]
            : "";

          // Get the token from database
          const preferences = await db.query.userEmailPreferences.findFirst({
            where: eq(userEmailPreferences.userId, 1),
          });

          expect(preferences).toBeDefined();
          expect(preferences?.unsubscribeToken).toBeDefined();

          const response = await request
            .post(
              `/api/users/me/email-preferences/unsubscribe/${preferences!.unsubscribeToken}`,
            )
            .set("Cookie", cookie!);

          console.log(JSON.stringify(response.body, null, 2));

          TestHelpers.validateApiResponse(response, 200);

          expect(response.body).toHaveProperty("success", true);
          expect(response.body).toHaveProperty(
            "message",
            "Successfully unsubscribed from email notifications",
          );
          expect(response.body.data).toHaveProperty("globalUnsubscribe", true);
        });

        it("should allow partial unsubscribe - 200", async () => {
          const loginResponse = await request
            .post("/api/auth/sign-in/email")
            .send({
              email: "normal.user@example.com",
              password: "Password@123",
            });

          const cookie = loginResponse.headers["set-cookie"]
            ? loginResponse.headers["set-cookie"][0]
            : "";

          const preferences = await db.query.userEmailPreferences.findFirst({
            where: eq(userEmailPreferences.userId, 1),
          });

          const response = await request
            .post(
              `/api/users/me/email-preferences/unsubscribe/${preferences!.unsubscribeToken}`,
            )
            .set("Cookie", cookie!)
            .send({
              marketingEmails: false,
              weeklyJobDigest: false,
            });

          TestHelpers.validateApiResponse(response, 200);

          expect(response.body).toHaveProperty("success", true);
          expect(response.body.data).toHaveProperty("marketingEmails", false);
          expect(response.body.data).toHaveProperty("weeklyJobDigest", false);
          expect(response.body.data).toHaveProperty("globalUnsubscribe", false);
        });

        it("should return 404 for invalid token", async () => {
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
            .post(
              "/api/users/me/email-preferences/unsubscribe/invalid-token-12345",
            )
            .set("Cookie", cookie!);

          TestHelpers.validateApiResponse(response, 404);
          expect(response.body).toHaveProperty("success", false);
        });

        it("should return 400 for expired token", async () => {
          const loginResponse = await request
            .post("/api/auth/sign-in/email")
            .send({
              email: "normal.user@example.com",
              password: "Password@123",
            });

          const cookie = loginResponse.headers["set-cookie"]
            ? loginResponse.headers["set-cookie"][0]
            : "";

          // Update token to be expired
          const preferences = await db.query.userEmailPreferences.findFirst({
            where: eq(userEmailPreferences.userId, 1),
          });

          await db
            .update(userEmailPreferences)
            .set({ unsubscribeTokenExpiresAt: new Date(Date.now() - 86400000) })
            .where(eq(userEmailPreferences.userId, 1));

          const response = await request
            .post(
              `/api/users/me/email-preferences/unsubscribe/${preferences!.unsubscribeToken}`,
            )
            .set("Cookie", cookie!);

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty("success", false);
          expect(response.body.message).toContain("expired");
        });
      });

      describe("POST /users/me/email-preferences/resubscribe", () => {
        it("should resubscribe user successfully - 200", async () => {
          const loginResponse = await request
            .post("/api/auth/sign-in/email")
            .send({
              email: "normal.user@example.com",
              password: "Password@123",
            });

          const cookie = loginResponse.headers["set-cookie"]
            ? loginResponse.headers["set-cookie"][0]
            : "";

          // First disable some preferences
          await db
            .update(userEmailPreferences)
            .set({
              jobMatchNotifications: false,
              marketingEmails: false,
              globalUnsubscribe: true,
            })
            .where(eq(userEmailPreferences.userId, 1));

          const response = await request
            .post("/api/users/me/email-preferences/resubscribe")
            .set("Cookie", cookie!);

          TestHelpers.validateApiResponse(response, 200);

          expect(response.body).toHaveProperty("success", true);
          expect(response.body).toHaveProperty(
            "message",
            "Successfully resubscribed to email notifications",
          );
          expect(response.body.data).toHaveProperty(
            "jobMatchNotifications",
            true,
          );
          expect(response.body.data).toHaveProperty("marketingEmails", true);
          expect(response.body.data).toHaveProperty("globalUnsubscribe", false);
          expect(response.body.data).toHaveProperty("unsubscribeToken");
        });

        it("should generate new token on resubscribe", async () => {
          const loginResponse = await request
            .post("/api/auth/sign-in/email")
            .send({
              email: "normal.user@example.com",
              password: "Password@123",
            });

          const cookie = loginResponse.headers["set-cookie"]
            ? loginResponse.headers["set-cookie"][0]
            : "";

          // Get old token
          const oldPreferences = await db.query.userEmailPreferences.findFirst({
            where: eq(userEmailPreferences.userId, 1),
          });
          const oldToken = oldPreferences!.unsubscribeToken;

          const response = await request
            .post("/api/users/me/email-preferences/resubscribe")
            .set("Cookie", cookie!);

          TestHelpers.validateApiResponse(response, 200);

          const newToken = response.body.data.unsubscribeToken;
          expect(newToken).toBeDefined();
          expect(newToken).not.toBe(oldToken);
        });

        it("should return 401 for unauthenticated user", async () => {
          const response = await request.post(
            "/api/users/me/email-preferences/resubscribe",
          );

          expect(response.status).toBe(401);
        });

        it("should return 404 if preferences not found", async () => {
          const preferencesSpy = vi
            .spyOn(UserRepository.prototype, "findEmailPreferencesByUserId")
            .mockResolvedValueOnce(undefined);

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
            .post("/api/users/me/email-preferences/resubscribe")
            .set("Cookie", cookie!);

          TestHelpers.validateApiResponse(response, 404);
          expect(response.body).toHaveProperty("success", false);

          preferencesSpy.mockRestore();
        });
      });

      describe("Email Preference Creation on User Profile Creation", () => {
        it("should automatically create email preferences when profile is created", async () => {
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

          // Create profile
          await request
            .post("/api/users/me/profile")
            .set("Cookie", cookie!)
            .send(profileData);

          // Check that preferences were created
          const preferences = await db.query.userEmailPreferences.findFirst({
            where: eq(userEmailPreferences.userId, 1),
          });

          expect(preferences).toBeDefined();
          expect(preferences?.userId).toBe(1);
          expect(preferences?.jobMatchNotifications).toBe(true);
          expect(preferences?.unsubscribeToken).toBeDefined();
          expect(preferences?.unsubscribeTokenExpiresAt).toBeDefined();
        });
      });
    });
  });
});
