import { and, eq } from "drizzle-orm";
import { expect } from "vitest";
import { db } from "@shared/db/connection";
import { organizationMembers } from "@/db/schema";
import { request, TestHelpers } from "@tests/utils/testHelpers";
import {
  createOrganization,
  createOrganizationMember,
  createUser,
} from "@tests/utils/seedBuilders";
import { seedJobsScenario } from "@tests/utils/seedScenarios";

describe("Organization Ownership Controller Integration Tests", () => {
  describe("POST /organizations/:organizationId/ownership", () => {
    let organizationId: number;
    let ownerCookie: string;
    let ownerMemberId: number;
    let adminMemberId: number;
    let adminUserId: number;
    let recruiterMemberId: number;
    let recruiterCookie: string;

    beforeEach(async () => {
      const { owner, member, orgs } = await seedJobsScenario();
      organizationId = orgs[0]!.id;

      const ownerSignIn = await request.post("/api/auth/sign-in/email").send({
        email: "owner.user@example.com",
        password: "Password@123",
      });
      ownerCookie = ownerSignIn.headers["set-cookie"]![0]!;

      const recruiterSignIn = await request
        .post("/api/auth/sign-in/email")
        .send({
          email: "org.member@example.com",
          password: "Password@123",
        });
      recruiterCookie = recruiterSignIn.headers["set-cookie"]![0]!;

      const ownerMember = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, owner.id),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });
      ownerMemberId = ownerMember!.id;

      const recruiterMember = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, member.id),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });
      recruiterMemberId = recruiterMember!.id;

      const adminUser = await createUser({
        email: "org.admin.transfer@example.com",
        name: "Transfer Admin",
      });
      adminUserId = adminUser.id;
      await createOrganizationMember(adminUser.id, organizationId, "admin");

      const adminMember = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, adminUser.id),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });
      adminMemberId = adminMember!.id;
    });

    async function rolesByMemberId() {
      const members = await db.query.organizationMembers.findMany({
        where: eq(organizationMembers.organizationId, organizationId),
      });
      return Object.fromEntries(members.map((m) => [m.id, m.role]));
    }

    it("transfers ownership to an active admin; caller becomes admin", async () => {
      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", ownerCookie)
        .send({ memberId: adminMemberId });

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);

      const roles = await rolesByMemberId();
      expect(roles[adminMemberId]).toBe("owner");
      expect(roles[ownerMemberId]).toBe("admin");

      const owners = Object.values(roles).filter((role) => role === "owner");
      expect(owners).toHaveLength(1);

      const orgResponse = await request
        .get(`/api/organizations/${organizationId}`)
        .set("Cookie", ownerCookie);

      TestHelpers.validateApiResponse(orgResponse, 200);
      const listedOwner = orgResponse.body.data.members.find(
        (member: { role: string }) => member.role === "owner",
      );
      expect(listedOwner).toMatchObject({
        id: adminMemberId,
        userId: adminUserId,
        role: "owner",
      });
    });

    it("rejects a second transfer from the previous owner with 403", async () => {
      await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", ownerCookie)
        .send({ memberId: adminMemberId });

      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", ownerCookie)
        .send({ memberId: ownerMemberId });

      TestHelpers.validateApiResponse(response, 403);

      const roles = await rolesByMemberId();
      expect(roles[adminMemberId]).toBe("owner");
      expect(roles[ownerMemberId]).toBe("admin");
    });

    it("returns 409 and leaves roles unchanged for a recruiter successor", async () => {
      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", ownerCookie)
        .send({ memberId: recruiterMemberId });

      TestHelpers.validateApiResponse(response, 409);
      expect(response.body.details).toMatchObject({
        code: "OWNERSHIP_SUCCESSOR_INVALID",
      });

      const roles = await rolesByMemberId();
      expect(roles[ownerMemberId]).toBe("owner");
      expect(roles[recruiterMemberId]).toBe("recruiter");
      expect(roles[adminMemberId]).toBe("admin");
    });

    it("returns 409 and leaves roles unchanged for a member successor", async () => {
      const plainMemberUser = await createUser({
        email: "plain.transfer.member@example.com",
      });
      await createOrganizationMember(
        plainMemberUser.id,
        organizationId,
        "member",
      );
      const plainMember = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, plainMemberUser.id),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });

      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", ownerCookie)
        .send({ memberId: plainMember!.id });

      TestHelpers.validateApiResponse(response, 409);
      expect(response.body.details).toMatchObject({
        code: "OWNERSHIP_SUCCESSOR_INVALID",
      });

      const roles = await rolesByMemberId();
      expect(roles[ownerMemberId]).toBe("owner");
      expect(roles[plainMember!.id]).toBe("member");
    });

    it("returns 409 for an inactive admin successor", async () => {
      await db
        .update(organizationMembers)
        .set({ isActive: false })
        .where(eq(organizationMembers.id, adminMemberId));

      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", ownerCookie)
        .send({ memberId: adminMemberId });

      TestHelpers.validateApiResponse(response, 409);
      expect(response.body.details).toMatchObject({
        code: "OWNERSHIP_SUCCESSOR_INVALID",
      });

      const roles = await rolesByMemberId();
      expect(roles[ownerMemberId]).toBe("owner");
      expect(roles[adminMemberId]).toBe("admin");
    });

    it("returns 409 when transferring to self", async () => {
      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", ownerCookie)
        .send({ memberId: ownerMemberId });

      TestHelpers.validateApiResponse(response, 409);
      expect(response.body.details).toMatchObject({
        code: "OWNERSHIP_SUCCESSOR_INVALID",
      });

      const roles = await rolesByMemberId();
      expect(roles[ownerMemberId]).toBe("owner");
    });

    it("denies admins from transferring with 403", async () => {
      const adminSignIn = await request.post("/api/auth/sign-in/email").send({
        email: "org.admin.transfer@example.com",
        password: "Password@123",
      });
      const adminCookie = adminSignIn.headers["set-cookie"]![0]!;

      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", adminCookie)
        .send({ memberId: adminMemberId });

      TestHelpers.validateApiResponse(response, 403);

      const roles = await rolesByMemberId();
      expect(roles[ownerMemberId]).toBe("owner");
      expect(roles[adminMemberId]).toBe("admin");
    });

    it("denies recruiters from transferring with 403", async () => {
      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", recruiterCookie)
        .send({ memberId: adminMemberId });

      TestHelpers.validateApiResponse(response, 403);

      const roles = await rolesByMemberId();
      expect(roles[ownerMemberId]).toBe("owner");
    });

    it("denies members from transferring with 403", async () => {
      const plainMemberUser = await createUser({
        email: "plain.cannot.transfer@example.com",
      });
      await createOrganizationMember(
        plainMemberUser.id,
        organizationId,
        "member",
      );

      const plainMemberSignIn = await request
        .post("/api/auth/sign-in/email")
        .send({
          email: "plain.cannot.transfer@example.com",
          password: "Password@123",
        });
      const plainMemberCookie = plainMemberSignIn.headers["set-cookie"]![0]!;

      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", plainMemberCookie)
        .send({ memberId: adminMemberId });

      TestHelpers.validateApiResponse(response, 403);
    });

    it("requires authentication", async () => {
      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .send({ memberId: adminMemberId });

      expect(response.status).toBe(401);
    });

    it("denies an owner of a different organization", async () => {
      const otherOwner = await createUser({
        email: "other.org.owner@example.com",
      });
      const otherOrg = await createOrganization({
        name: "Other Transfer Org",
      });
      await createOrganizationMember(otherOwner.id, otherOrg.id, "owner");

      const otherOwnerSignIn = await request
        .post("/api/auth/sign-in/email")
        .send({
          email: "other.org.owner@example.com",
          password: "Password@123",
        });
      const otherOwnerCookie = otherOwnerSignIn.headers["set-cookie"]![0]!;

      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", otherOwnerCookie)
        .send({ memberId: adminMemberId });

      TestHelpers.validateApiResponse(response, 403);

      const roles = await rolesByMemberId();
      expect(roles[ownerMemberId]).toBe("owner");
      expect(roles[adminMemberId]).toBe("admin");
    });

    it("returns validation error when memberId is missing", async () => {
      const response = await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", ownerCookie)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      const roles = await rolesByMemberId();
      expect(roles[ownerMemberId]).toBe("owner");
    });

    it("keeps invite, change-role, and remove refusing owner assignment", async () => {
      await request
        .post(`/api/organizations/${organizationId}/ownership`)
        .set("Cookie", ownerCookie)
        .send({ memberId: adminMemberId });

      const adminSignIn = await request.post("/api/auth/sign-in/email").send({
        email: "org.admin.transfer@example.com",
        password: "Password@123",
      });
      const newOwnerCookie = adminSignIn.headers["set-cookie"]![0]!;

      const inviteAsOwner = await request
        .post(`/api/organizations/${organizationId}/invitations`)
        .set("Cookie", newOwnerCookie)
        .send({ email: "cannot.be.owner@example.com", role: "owner" });
      TestHelpers.validateApiResponse(inviteAsOwner, 403);

      const changeToOwner = await request
        .patch(`/api/organizations/${organizationId}/members/${ownerMemberId}`)
        .set("Cookie", newOwnerCookie)
        .send({ role: "owner" });
      TestHelpers.validateApiResponse(changeToOwner, 403);

      const removeOwner = await request
        .delete(`/api/organizations/${organizationId}/members/${adminMemberId}`)
        .set("Cookie", newOwnerCookie);
      TestHelpers.validateApiResponse(removeOwner, 403);
      expect(removeOwner.body.message).toContain("Transfer ownership first");

      const roles = await rolesByMemberId();
      expect(roles[adminMemberId]).toBe("owner");
      expect(roles[ownerMemberId]).toBe("admin");
    });
  });
});
