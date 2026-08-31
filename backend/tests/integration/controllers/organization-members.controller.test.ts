import { and, eq } from "drizzle-orm";
import { expect } from "vitest";
import { db } from "@shared/db/connection";
import { organizationMembers } from "@/db/schema";
import { request, TestHelpers } from "@tests/utils/testHelpers";
import {
  createOrganizationMember,
  createUser,
} from "@tests/utils/seedBuilders";
import { seedJobsScenario } from "@tests/utils/seedScenarios";

describe("Organization Members Controller Integration Tests", () => {
  describe("DELETE /organizations/:organizationId/members/:memberId", () => {
    let organizationId: number;
    let ownerCookie: string;
    let recruiterCookie: string;
    let recruiterMemberId: number;
    let ownerMemberId: number;
    let recruiterUserId: number;

    beforeEach(async () => {
      const { owner, member, orgs } = await seedJobsScenario();
      organizationId = orgs[0]!.id;
      recruiterUserId = member.id;

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

      const recruiterMember = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, member.id),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });
      recruiterMemberId = recruiterMember!.id;

      const ownerMember = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, owner.id),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });
      ownerMemberId = ownerMember!.id;
    });

    it("should remove a member successfully returning 200", async () => {
      const response = await request
        .delete(
          `/api/organizations/${organizationId}/members/${recruiterMemberId}`,
        )
        .set("Cookie", ownerCookie);

      TestHelpers.validateApiResponse(response, 200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty(
        "message",
        "Member removed successfully",
      );

      const removedMember = await db.query.organizationMembers.findFirst({
        where: eq(organizationMembers.id, recruiterMemberId),
      });
      expect(removedMember).toBeDefined();
      expect(removedMember!.isActive).toBe(false);

      const orgResponse = await request
        .get(`/api/organizations/${organizationId}`)
        .set("Cookie", ownerCookie);

      TestHelpers.validateApiResponse(orgResponse, 200);
      const memberIds = orgResponse.body.data.members.map(
        (member: { id: number }) => member.id,
      );
      expect(memberIds).not.toContain(recruiterMemberId);
    });

    it("should deny recruiters from removing members returning 403", async () => {
      const removableUser = await createUser({
        email: "removable.member@example.com",
      });
      await createOrganizationMember(
        removableUser.id,
        organizationId,
        "member",
      );

      const removableMember = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, removableUser.id),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });

      const response = await request
        .delete(
          `/api/organizations/${organizationId}/members/${removableMember!.id}`,
        )
        .set("Cookie", recruiterCookie);

      TestHelpers.validateApiResponse(response, 403);
      expect(response.body).toHaveProperty("success", false);

      const stillMember = await db.query.organizationMembers.findFirst({
        where: eq(organizationMembers.id, removableMember!.id),
      });
      expect(stillMember!.isActive).toBe(true);
    });

    it("should deny members from removing others returning 403", async () => {
      const plainMemberUser = await createUser({
        email: "plain.member@example.com",
      });
      await createOrganizationMember(
        plainMemberUser.id,
        organizationId,
        "member",
      );

      const plainMemberSignIn = await request
        .post("/api/auth/sign-in/email")
        .send({
          email: "plain.member@example.com",
          password: "Password@123",
        });
      const plainMemberCookie = plainMemberSignIn.headers["set-cookie"]![0]!;

      const removableUser = await createUser({
        email: "another.member@example.com",
      });
      await createOrganizationMember(
        removableUser.id,
        organizationId,
        "member",
      );

      const removableMember = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, removableUser.id),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });

      const response = await request
        .delete(
          `/api/organizations/${organizationId}/members/${removableMember!.id}`,
        )
        .set("Cookie", plainMemberCookie);

      TestHelpers.validateApiResponse(response, 403);
      expect(response.body).toHaveProperty("success", false);

      const stillMember = await db.query.organizationMembers.findFirst({
        where: eq(organizationMembers.id, removableMember!.id),
      });
      expect(stillMember!.isActive).toBe(true);
    });

    it("should fail when removing an owner returning 403", async () => {
      const response = await request
        .delete(`/api/organizations/${organizationId}/members/${ownerMemberId}`)
        .set("Cookie", ownerCookie);

      TestHelpers.validateApiResponse(response, 403);
      expect(response.body.message).toContain("owner");

      const ownerMember = await db.query.organizationMembers.findFirst({
        where: eq(organizationMembers.id, ownerMemberId),
      });
      expect(ownerMember!.isActive).toBe(true);
    });

    it("should prevent removed members from acting as organization members", async () => {
      await request
        .delete(
          `/api/organizations/${organizationId}/members/${recruiterMemberId}`,
        )
        .set("Cookie", ownerCookie);

      const response = await request
        .get(`/api/organizations/${organizationId}/applications`)
        .set("Cookie", recruiterCookie);

      TestHelpers.validateApiResponse(response, 403);
      expect(response.body).toHaveProperty(
        "message",
        "Insufficient permissions",
      );
    });
  });
});
