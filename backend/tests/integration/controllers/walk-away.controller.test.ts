import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { expect } from "vitest";
import { db } from "@shared/db/connection";
import {
  organizationInvitations,
  organizationMembers,
  organizations,
} from "@/db/schema";
import { request, TestHelpers } from "@tests/utils/testHelpers";
import {
  createOrganization,
  createOrganizationMember,
  createUser,
} from "@tests/utils/seedBuilders";
import { runBeforeDeleteAccount } from "@/utils/auth/hooks/beforeDeleteAccount";
import { getAuthIdentityService } from "@/utils/auth";

async function signIn(email: string) {
  const loginResponse = await request.post("/api/auth/sign-in/email").send({
    email,
    password: "Password@123",
  });
  return loginResponse.headers["set-cookie"]![0]!;
}

describe("Walk-away ownership (deactivate + before-delete)", () => {
  describe("GET /users/me/walk-away-organizations", () => {
    it("returns blocking vs will-be-deleted classification", async () => {
      const owner = await createUser({
        email: "walkaway.classify@example.com",
      });
      const other = await createUser({ email: "walkaway.member@example.com" });

      const blockingOrg = await createOrganization({ name: "Blocking Org" });
      const soloOrg = await createOrganization({ name: "Solo Org" });

      await createOrganizationMember(owner.id, blockingOrg.id, "owner");
      await createOrganizationMember(other.id, blockingOrg.id, "member");
      await createOrganizationMember(owner.id, soloOrg.id, "owner");

      const admin = await createUser({ email: "walkaway.admin@example.com" });
      await createOrganizationMember(admin.id, blockingOrg.id, "admin");

      const cookie = await signIn(owner.email);

      const response = await request
        .get("/api/users/me/walk-away-organizations")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data.blocking).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: blockingOrg.id,
            name: "Blocking Org",
            hasActiveAdmin: true,
          }),
        ]),
      );
      expect(response.body.data.willBeDeleted).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: soloOrg.id,
            name: "Solo Org",
            hasActiveAdmin: false,
          }),
        ]),
      );
    });

    it("does not treat pending invitations or inactive members as blocking", async () => {
      const owner = await createUser({ email: "walkaway.invites@example.com" });
      const inactive = await createUser({
        email: "walkaway.inactive@example.com",
      });
      const soloOrg = await createOrganization({ name: "Invite-only Org" });

      await createOrganizationMember(owner.id, soloOrg.id, "owner");
      await createOrganizationMember(inactive.id, soloOrg.id, "member");
      await db
        .update(organizationMembers)
        .set({ isActive: false })
        .where(
          and(
            eq(organizationMembers.userId, inactive.id),
            eq(organizationMembers.organizationId, soloOrg.id),
          ),
        );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await db.insert(organizationInvitations).values({
        organizationId: soloOrg.id,
        email: "pending.invitee@example.com",
        role: "member",
        token: randomUUID(),
        invitedBy: owner.id,
        status: "pending",
        expiresAt,
      });

      const cookie = await signIn(owner.email);
      const response = await request
        .get("/api/users/me/walk-away-organizations")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data.blocking).toEqual([]);
      expect(response.body.data.willBeDeleted).toEqual([
        expect.objectContaining({ id: soloOrg.id, name: "Invite-only Org" }),
      ]);
    });
  });

  describe("PATCH /users/me/deactivate", () => {
    it("blocks deactivate when another active member exists and does not delete solo orgs", async () => {
      const owner = await createUser({ email: "walkaway.block@example.com" });
      const other = await createUser({
        email: "walkaway.block.member@example.com",
      });
      const blockingOrg = await createOrganization({ name: "Must Transfer" });
      const soloOrg = await createOrganization({ name: "Preview Solo" });

      await createOrganizationMember(owner.id, blockingOrg.id, "owner");
      await createOrganizationMember(other.id, blockingOrg.id, "recruiter");
      await createOrganizationMember(owner.id, soloOrg.id, "owner");

      const cookie = await signIn(owner.email);
      const response = await request
        .patch("/api/users/me/deactivate")
        .set("Cookie", cookie);

      expect(response.status).toBe(400);
      expect(response.body.details.blocking).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: blockingOrg.id }),
        ]),
      );
      expect(response.body.details.willBeDeleted).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: soloOrg.id })]),
      );

      const soloStillExists = await db.query.organizations.findFirst({
        where: eq(organizations.id, soloOrg.id),
      });
      expect(soloStillExists).toBeTruthy();
    });

    it("cancels pending invites, deletes solo orgs, then deactivates", async () => {
      const owner = await createUser({ email: "walkaway.solo@example.com" });
      const soloOrg = await createOrganization({ name: "Tear Down Org" });
      await createOrganizationMember(owner.id, soloOrg.id, "owner");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const [invitation] = await db
        .insert(organizationInvitations)
        .values({
          organizationId: soloOrg.id,
          email: "teardown.invitee@example.com",
          role: "admin",
          token: randomUUID(),
          invitedBy: owner.id,
          status: "pending",
          expiresAt,
        })
        .$returningId();

      const cookie = await signIn(owner.email);
      const response = await request
        .patch("/api/users/me/deactivate")
        .set("Cookie", cookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body.data.status).toBe("deactivated");

      const orgGone = await db.query.organizations.findFirst({
        where: eq(organizations.id, soloOrg.id),
      });
      expect(orgGone).toBeUndefined();

      const invite = await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.id, invitation!.id),
      });
      // Invitation row may cascade-delete with the org; if present it must be cancelled
      if (invite) {
        expect(invite.status).toBe("cancelled");
      }
    });

    it("refuses deactivate when the org already has another active member", async () => {
      const owner = await createUser({ email: "walkaway.race@example.com" });
      const joiner = await createUser({
        email: "walkaway.race.joiner@example.com",
      });
      const soloOrg = await createOrganization({ name: "Race Org" });
      await createOrganizationMember(owner.id, soloOrg.id, "owner");
      await createOrganizationMember(joiner.id, soloOrg.id, "member");

      const cookie = await signIn(owner.email);
      const response = await request
        .patch("/api/users/me/deactivate")
        .set("Cookie", cookie);

      expect(response.status).toBe(400);
      expect(response.body.details.blocking).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: soloOrg.id })]),
      );

      const orgStillExists = await db.query.organizations.findFirst({
        where: eq(organizations.id, soloOrg.id),
      });
      expect(orgStillExists).toBeTruthy();
    });
  });

  describe("beforeDeleteAccount hook", () => {
    it("blocks hard delete with two-list payload when orgs block", async () => {
      const owner = await createUser({ email: "walkaway.delete@example.com" });
      const other = await createUser({
        email: "walkaway.delete.member@example.com",
      });
      const blockingOrg = await createOrganization({ name: "Delete Block" });
      const soloOrg = await createOrganization({ name: "Delete Preview" });
      await createOrganizationMember(owner.id, blockingOrg.id, "owner");
      await createOrganizationMember(other.id, blockingOrg.id, "member");
      await createOrganizationMember(owner.id, soloOrg.id, "owner");

      await expect(
        runBeforeDeleteAccount({ id: String(owner.id) } as never, {
          identityService: getAuthIdentityService(),
        }),
      ).rejects.toMatchObject({
        body: {
          details: {
            blocking: expect.arrayContaining([
              expect.objectContaining({ id: blockingOrg.id }),
            ]),
            willBeDeleted: expect.arrayContaining([
              expect.objectContaining({ id: soloOrg.id }),
            ]),
          },
        },
      });

      const soloStillExists = await db.query.organizations.findFirst({
        where: eq(organizations.id, soloOrg.id),
      });
      expect(soloStillExists).toBeTruthy();
    });

    it("tears down solo orgs before allowing delete to proceed", async () => {
      const owner = await createUser({
        email: "walkaway.delete.solo@example.com",
      });
      const soloOrg = await createOrganization({ name: "Delete Solo" });
      await createOrganizationMember(owner.id, soloOrg.id, "owner");

      await expect(
        runBeforeDeleteAccount({ id: String(owner.id) } as never, {
          identityService: getAuthIdentityService(),
        }),
      ).resolves.toBeUndefined();

      const orgGone = await db.query.organizations.findFirst({
        where: eq(organizations.id, soloOrg.id),
      });
      expect(orgGone).toBeUndefined();
    });
  });
});
