import { eq, and } from "drizzle-orm";
import { db } from "@/db/connection";
import {
  organizationInvitations,
  organizationMembers,
  user,
} from "@/db/schema";

import { request, TestHelpers } from "@tests/utils/testHelpers";
import { seedUserWithRoleScenario } from "@tests/utils/seedScenarios";
import { expect, beforeEach, describe, it, beforeAll, afterAll, vi } from "vitest";
import { auth } from "@/utils/auth";
import { randomUUID } from "crypto";
import { queueService } from "@/infrastructure/queue.service";

describe("Organization Invitations Controller Integration Tests", async () => {
  const { faker } = await import("@faker-js/faker");

  beforeAll(() => {
    // Mock email queue to prevent actual email sending during tests
    vi.spyOn(queueService, "addJob").mockResolvedValue({} as any);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    // cleanAll() runs via setupTests.ts beforeEach — no manual cleanup needed
  });

  describe("POST /organizations/:organizationId/invitations", () => {
    describe("Owner sending invitations", () => {
      let ownerCookie: string;
      let organizationId: number;

      beforeEach(async () => {
        await seedUserWithRoleScenario("owner", "owner@example.com");
        const signInResponse = await request
          .post("/api/auth/sign-in/email")
          .send({ email: "owner@example.com", password: "Password@123" });
        ownerCookie = signInResponse.headers["set-cookie"]?.[0] || "";

        // Get organization ID
        const orgResponse = await request
          .get("/api/organizations")
          .set("Cookie", ownerCookie);
        organizationId = orgResponse.body.data[0].id;
      });

      it("should send invitation successfully returning 201", async () => {
        const inviteeEmail = "newmember@example.com";

        const response = await request
          .post(`/api/organizations/${organizationId}/invitations`)
          .set("Cookie", ownerCookie)
          .send({
            email: inviteeEmail,
            role: "member",
          });

        TestHelpers.validateApiResponse(response, 201);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("invitationId");
        expect(response.body.data).toHaveProperty("message", "Invitation sent successfully");
      });

      it("should fail when inviting existing member", async () => {
        // First, create a member
        const memberEmail = "existingmember@example.com";
        const memberUser = await auth.api.signUpEmail({
          body: {
            email: memberEmail,
            password: "Password@123",
            name: faker.person.fullName(),
            image: faker.image.avatar(),
          },
        });

        await db.insert(organizationMembers).values({
          userId: Number(memberUser.user.id),
          organizationId,
          role: "member",
          isActive: true,
        });

        // Try to invite the existing member
        const response = await request
          .post(`/api/organizations/${organizationId}/invitations`)
          .set("Cookie", ownerCookie)
          .send({
            email: memberEmail,
            role: "member",
          });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body.message).toContain("already a member");
      });

      it("should fail when owner tries to invite with owner role (role hierarchy)", async () => {
        const response = await request
          .post(`/api/organizations/${organizationId}/invitations`)
          .set("Cookie", ownerCookie)
          .send({
            email: "newowner@example.com",
            role: "owner",
          });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body.message).toContain("role");
      });
    });

    describe("Admin sending invitations", () => {
      let adminCookie: string;
      let organizationId: number;

      beforeEach(async () => {
        await seedUserWithRoleScenario("admin", "admin@example.com");
        const signInResponse = await request
          .post("/api/auth/sign-in/email")
          .send({ email: "admin@example.com", password: "Password@123" });
        adminCookie = signInResponse.headers["set-cookie"]?.[0] || "";

        const orgResponse = await request
          .get("/api/organizations")
          .set("Cookie", adminCookie);
        organizationId = orgResponse.body.data[0].id;
      });

      it("should send invitation successfully returning 201", async () => {
        const response = await request
          .post(`/api/organizations/${organizationId}/invitations`)
          .set("Cookie", adminCookie)
          .send({
            email: "newmember@example.com",
            role: "member",
          });

        TestHelpers.validateApiResponse(response, 201);
        expect(response.body).toHaveProperty("success", true);
      });
    });

    describe("Recruiter sending invitations", () => {
      let recruiterCookie: string;
      let organizationId: number;

      beforeEach(async () => {
        await seedUserWithRoleScenario("recruiter", "recruiter@example.com");
        const signInResponse = await request
          .post("/api/auth/sign-in/email")
          .send({ email: "recruiter@example.com", password: "Password@123" });
        recruiterCookie = signInResponse.headers["set-cookie"]?.[0] || "";

        const orgResponse = await request
          .get("/api/organizations")
          .set("Cookie", recruiterCookie);
        organizationId = orgResponse.body.data[0].id;
      });

      it("should fail with permission denied returning 403", async () => {
        const response = await request
          .post(`/api/organizations/${organizationId}/invitations`)
          .set("Cookie", recruiterCookie)
          .send({
            email: "newmember@example.com",
            role: "member",
          });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body.message).toContain("permission");
      });
    });

    describe("Unauthenticated requests", () => {
      it("should fail without authentication returning 401", async () => {
        const response = await request
          .post("/api/organizations/1/invitations")
          .send({
            email: "newmember@example.com",
            role: "member",
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body.message).toBe("Authentication required");
      });
    });
  });

  describe("GET /invitations/:organizationId/:token/details", () => {
    let organizationId: number;
    let inviterId: number;
    let invitationToken: string;

    beforeEach(async () => {
      // Create organization and owner
      await seedUserWithRoleScenario("owner", "owner@example.com");
      const ownerUser = await db.query.user.findFirst({
        where: eq(user.email, "owner@example.com"),
      });
      inviterId = ownerUser!.id;

      const org = await db.query.organizations.findFirst();
      organizationId = org!.id;

      // Create a pending invitation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const [invitation] = await db
        .insert(organizationInvitations)
        .values({
          organizationId,
          email: "invitee@example.com",
          role: "member",
          token: randomUUID(),
          invitedBy: inviterId,
          status: "pending",
          expiresAt,
        })
        .$returningId();

      if (!invitation) {
        throw new Error("Failed to create invitation");
      }

      const createdInvitation = await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.id, invitation.id),
      });
      if (!createdInvitation) {
        throw new Error("Failed to find created invitation");
      }
      invitationToken = createdInvitation.token;
    });

    it("should return invitation details for valid token", async () => {
      const response = await request.get(
        `/api/invitations/${organizationId}/${invitationToken}/details`,
      );

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("organizationName");
      expect(response.body.data).toHaveProperty("role", "member");
      expect(response.body.data).toHaveProperty("inviterName");
      expect(response.body.data).toHaveProperty("expiresAt");
    });

    it("should fail for invalid token returning 404", async () => {
      const response = await request.get(
        `/api/invitations/${organizationId}/invalid-token-123/details`,
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should fail for expired invitation", async () => {
      // Create expired invitation
      const expiredToken = randomUUID();
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      await db.insert(organizationInvitations).values({
        organizationId,
        email: "expired@example.com",
        role: "member",
        token: expiredToken,
        invitedBy: inviterId,
        status: "pending",
        expiresAt: expiredDate,
      });

      const response = await request.get(
        `/api/invitations/${organizationId}/${expiredToken}/details`,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("expired");
    });

    it("should fail for already accepted invitation", async () => {
      // Create accepted invitation
      const acceptedToken = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(organizationInvitations).values({
        organizationId,
        email: "accepted@example.com",
        role: "member",
        token: acceptedToken,
        invitedBy: inviterId,
        status: "accepted",
        expiresAt,
        acceptedAt: new Date(),
      });

      const response = await request.get(
        `/api/invitations/${organizationId}/${acceptedToken}/details`,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("accepted");
    });
  });

  describe("POST /invitations/:organizationId/:token/accept", () => {
    let organizationId: number;
    let inviterId: number;
    let invitationToken: string;
    let inviteeEmail: string;

    beforeEach(async () => {
      await seedUserWithRoleScenario("owner", "owner@example.com");
      const ownerUser = await db.query.user.findFirst({
        where: eq(user.email, "owner@example.com"),
      });
      inviterId = ownerUser!.id;

      const org = await db.query.organizations.findFirst();
      organizationId = org!.id;

      inviteeEmail = "invitee@example.com";
      invitationToken = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(organizationInvitations).values({
        organizationId,
        email: inviteeEmail,
        role: "member",
        token: invitationToken,
        invitedBy: inviterId,
        status: "pending",
        expiresAt,
      });
    });

    it("should accept invitation successfully returning 200", async () => {
      // Create invitee user
      const inviteeUser = await auth.api.signUpEmail({
        body: {
          email: inviteeEmail,
          password: "Password@123",
          name: faker.person.fullName(),
          image: faker.image.avatar(),
        },
      });

      const signInResponse = await request
        .post("/api/auth/sign-in/email")
        .send({ email: inviteeEmail, password: "Password@123" });
      const inviteeCookie = signInResponse.headers["set-cookie"]?.[0] || "";

      const response = await request
        .post(`/api/invitations/${organizationId}/${invitationToken}/accept`)
        .set("Cookie", inviteeCookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("message", "Invitation accepted successfully");

      // Verify membership was created
      const member = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, Number(inviteeUser.user.id)),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });
      expect(member).toBeDefined();
      expect(member?.role).toBe("member");
      expect(member?.isActive).toBe(true);

      // Verify invitation status updated
      const invitation = await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.token, invitationToken),
      });
      expect(invitation).toBeDefined();
      expect(invitation!.status).toBe("accepted");
      expect(invitation!.acceptedAt).toBeDefined();
    });

    it("should fail when email doesn't match returning 400", async () => {
      // Create user with different email
      const differentEmail = "different@example.com";
      await auth.api.signUpEmail({
        body: {
          email: differentEmail,
          password: "Password@123",
          name: faker.person.fullName(),
          image: faker.image.avatar(),
        },
      });

      const signInResponse = await request
        .post("/api/auth/sign-in/email")
        .send({ email: differentEmail, password: "Password@123" });
      const cookie = signInResponse.headers["set-cookie"]?.[0] || "";

      const response = await request
        .post(`/api/invitations/${organizationId}/${invitationToken}/accept`)
        .set("Cookie", cookie);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("different email address");
    });

    it("should fail for expired invitation returning 400", async () => {
      // Create expired invitation
      const expiredToken = randomUUID();
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      await db.insert(organizationInvitations).values({
        organizationId,
        email: "expired@example.com",
        role: "member",
        token: expiredToken,
        invitedBy: inviterId,
        status: "pending",
        expiresAt: expiredDate,
      });

      const expiredUser = await auth.api.signUpEmail({
        body: {
          email: "expired@example.com",
          password: "Password@123",
          name: faker.person.fullName(),
          image: faker.image.avatar(),
        },
      });

      const signInResponse = await request
        .post("/api/auth/sign-in/email")
        .send({ email: "expired@example.com", password: "Password@123" });
      const cookie = signInResponse.headers["set-cookie"]?.[0] || "";

      const response = await request
        .post(`/api/invitations/${organizationId}/${expiredToken}/accept`)
        .set("Cookie", cookie);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("expired");
    });

    it("should fail for already accepted invitation returning 400", async () => {
      // Accept invitation first
      const inviteeUser = await auth.api.signUpEmail({
        body: {
          email: inviteeEmail,
          password: "Password@123",
          name: faker.person.fullName(),
          image: faker.image.avatar(),
        },
      });

      const signInResponse = await request
        .post("/api/auth/sign-in/email")
        .send({ email: inviteeEmail, password: "Password@123" });
      const cookie = signInResponse.headers["set-cookie"]?.[0] || "";

      // Accept once
      await request
        .post(`/api/invitations/${organizationId}/${invitationToken}/accept`)
        .set("Cookie", cookie);

      // Try to accept again
      const response = await request
        .post(`/api/invitations/${organizationId}/${invitationToken}/accept`)
        .set("Cookie", cookie);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("accepted");
    });

    it("should fail without authentication returning 401", async () => {
      const response = await request.post(
        `/api/invitations/${organizationId}/${invitationToken}/accept`,
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authentication required");
    });
  });

  describe("DELETE /organizations/:organizationId/invitations/:invitationId", () => {
    let organizationId: number;
    let inviterId: number;
    let invitationId: number;

    beforeEach(async () => {
      await seedUserWithRoleScenario("owner", "owner@example.com");
      const ownerUser = await db.query.user.findFirst({
        where: eq(user.email, "owner@example.com"),
      });
      inviterId = ownerUser!.id;

      const org = await db.query.organizations.findFirst();
      organizationId = org!.id;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [invitation] = await db
        .insert(organizationInvitations)
        .values({
          organizationId,
          email: "tocancel@example.com",
          role: "member",
          token: randomUUID(),
          invitedBy: inviterId,
          status: "pending",
          expiresAt,
        })
        .$returningId();

      if (!invitation) {
        throw new Error("Failed to create invitation");
      }
      invitationId = invitation.id;
    });

    describe("Owner canceling invitations", () => {
      let ownerCookie: string;

      beforeEach(async () => {
        const signInResponse = await request
          .post("/api/auth/sign-in/email")
          .send({ email: "owner@example.com", password: "Password@123" });
        ownerCookie = signInResponse.headers["set-cookie"]?.[0] || "";
      });

      it("should cancel invitation successfully returning 200", async () => {
        const response = await request
          .delete(
            `/api/organizations/${organizationId}/invitations/${invitationId}`,
          )
          .set("Cookie", ownerCookie);

        TestHelpers.validateApiResponse(response, 200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body.data).toHaveProperty(
          "message",
          "Invitation cancelled successfully",
        );

        // Verify invitation status updated
        const invitation = await db.query.organizationInvitations.findFirst({
          where: eq(organizationInvitations.id, invitationId),
        });
        expect(invitation).toBeDefined();
        expect(invitation!.status).toBe("cancelled");
        expect(invitation!.cancelledAt).toBeDefined();
        expect(invitation!.cancelledBy).toBe(inviterId);
      });

      it("should fail when canceling already accepted invitation returning 400", async () => {
        // Accept invitation first
        const inviteeEmail = "accepted@example.com";
        const acceptedToken = randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const [acceptedInvitation] = await db
          .insert(organizationInvitations)
          .values({
            organizationId,
            email: inviteeEmail,
            role: "member",
            token: acceptedToken,
            invitedBy: inviterId,
            status: "accepted",
            expiresAt,
            acceptedAt: new Date(),
          })
          .$returningId();

        if (!acceptedInvitation) {
          throw new Error("Failed to create accepted invitation");
        }

        const response = await request
          .delete(
            `/api/organizations/${organizationId}/invitations/${acceptedInvitation.id}`,
          )
          .set("Cookie", ownerCookie);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("already accepted");
      });

      it("should fail when canceling already cancelled invitation returning 400", async () => {
        // Cancel invitation first
        await request
          .delete(
            `/api/organizations/${organizationId}/invitations/${invitationId}`,
          )
          .set("Cookie", ownerCookie);

        // Try to cancel again
        const response = await request
          .delete(
            `/api/organizations/${organizationId}/invitations/${invitationId}`,
          )
          .set("Cookie", ownerCookie);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("already cancelled");
      });
    });

    describe("Admin canceling invitations", () => {
      let adminCookie: string;

      beforeEach(async () => {
        // Create admin user in the same organization as the invitation
        const adminUser = await auth.api.signUpEmail({
          body: {
            email: "admin@example.com",
            password: "Password@123",
            name: faker.person.firstName() + " " + faker.person.lastName(),
            image: faker.image.avatar(),
          },
        });

        // Add admin to the same organization
        await db.insert(organizationMembers).values({
          userId: Number(adminUser.user.id),
          organizationId: organizationId,
          role: "admin",
          isActive: true,
        });

        const signInResponse = await request
          .post("/api/auth/sign-in/email")
          .send({ email: "admin@example.com", password: "Password@123" });
        adminCookie = signInResponse.headers["set-cookie"]?.[0] || "";
      });

      it("should cancel invitation successfully returning 200", async () => {
        const response = await request
          .delete(
            `/api/organizations/${organizationId}/invitations/${invitationId}`,
          )
          .set("Cookie", adminCookie);

        TestHelpers.validateApiResponse(response, 200);
        expect(response.body).toHaveProperty("success", true);
      });
    });

    describe("Recruiter canceling invitations", () => {
      let recruiterCookie: string;

      beforeEach(async () => {
        await seedUserWithRoleScenario("recruiter", "recruiter@example.com");
        const signInResponse = await request
          .post("/api/auth/sign-in/email")
          .send({ email: "recruiter@example.com", password: "Password@123" });
        recruiterCookie = signInResponse.headers["set-cookie"]?.[0] || "";
      });

      it("should fail with permission denied returning 403", async () => {
        const response = await request
          .delete(
            `/api/organizations/${organizationId}/invitations/${invitationId}`,
          )
          .set("Cookie", recruiterCookie);

        expect(response.status).toBe(403);
        expect(response.body.message).toContain("permission");
      });
    });

    describe("Unauthenticated requests", () => {
      it("should fail without authentication returning 401", async () => {
        const response = await request.delete(
          `/api/organizations/${organizationId}/invitations/${invitationId}`,
        );

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentication required");
      });
    });
  });
});
