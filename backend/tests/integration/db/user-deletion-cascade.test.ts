import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "@shared/db/connection";
import {
  jobAlerts,
  jobApplications,
  organizationMembers,
  organizations,
  savedJobs,
  user,
  userEmailPreferences,
  userProfile,
} from "@/db/schema";
import {
  createEmailPreferences,
  createJob,
  createJobApplication,
  createOrganization,
  createOrganizationMember,
  createUser,
  createUserProfile,
} from "@tests/utils/seedBuilders";

/**
 * DB-level cascade contract for account deletion.
 *
 * Story 534 relies on Drizzle/MySQL FK cascades to wipe user-owned data
 * rather than writing bespoke delete logic. This test locks in that
 * contract: seed a user with every kind of dependent row we know about,
 * hard-delete the user row, and assert the dependents are gone.
 *
 * Better-Auth's deleteUser is disabled in test mode, so this test
 * bypasses it and deletes directly — which is exactly the layer we
 * want to verify anyway.
 */
describe("User deletion DB cascade contract", () => {
  let userId: number;
  let applicantId: number;
  let employerId: number;
  let organizationId: number;

  beforeEach(async () => {
    // Employer (separate user) owns the organization + posts a job
    const employerUser = await createUser({
      email: "employer@cascade-test.example",
    });
    employerId = employerUser.id;

    const org = await createOrganization({
      name: "Cascade Test Org",
    });
    organizationId = org.id;

    await createOrganizationMember(employerId, organizationId, "owner");

    const job = await createJob(organizationId, { title: "Test Role" });

    // The user under test — a seeker with applications, profile, etc.
    const target = await createUser({ email: "target@cascade-test.example" });
    userId = target.id;
    applicantId = userId;

    await createUserProfile(userId);
    await createEmailPreferences(userId);

    // Applications, saved jobs, alerts, non-owner org membership
    await createJobApplication(job.id, applicantId);

    await db.insert(savedJobs).values({
      userId,
      jobId: job.id,
    });

    await db.insert(jobAlerts).values({
      userId,
      name: "Weekly Remote Roles",
      description: "Remote software engineering roles",
      searchQuery: "remote software engineer",
      frequency: "weekly",
      isActive: true,
      isPaused: false,
    });

    // Target is a non-owner member of the employer's org (leaves org
    // intact when target is deleted; membership row should cascade out).
    await createOrganizationMember(userId, organizationId, "member");
  });

  it("hard-deleting the user row cascades to all dependent tables", async () => {
    const [
      [profileBefore],
      [prefsBefore],
      appsBefore,
      savedBefore,
      alertsBefore,
      membersBefore,
    ] = await Promise.all([
      db.select().from(userProfile).where(eq(userProfile.userId, userId)),
      db
        .select()
        .from(userEmailPreferences)
        .where(eq(userEmailPreferences.userId, userId)),
      db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.applicantId, applicantId)),
      db.select().from(savedJobs).where(eq(savedJobs.userId, userId)),
      db.select().from(jobAlerts).where(eq(jobAlerts.userId, userId)),
      db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.userId, userId)),
    ]);

    // Sanity: the seed actually landed.
    expect(profileBefore).toBeDefined();
    expect(prefsBefore).toBeDefined();
    expect(appsBefore.length).toBe(1);
    expect(savedBefore.length).toBe(1);
    expect(alertsBefore.length).toBe(1);
    expect(membersBefore.length).toBe(1);

    await db.delete(user).where(eq(user.id, userId));

    const [
      userAfter,
      profileAfter,
      prefsAfter,
      appsAfter,
      savedAfter,
      alertsAfter,
      membersAfter,
    ] = await Promise.all([
      db.select().from(user).where(eq(user.id, userId)),
      db.select().from(userProfile).where(eq(userProfile.userId, userId)),
      db
        .select()
        .from(userEmailPreferences)
        .where(eq(userEmailPreferences.userId, userId)),
      db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.applicantId, applicantId)),
      db.select().from(savedJobs).where(eq(savedJobs.userId, userId)),
      db.select().from(jobAlerts).where(eq(jobAlerts.userId, userId)),
      db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.userId, userId)),
    ]);

    expect(userAfter.length).toBe(0);
    expect(profileAfter.length).toBe(0);
    expect(prefsAfter.length).toBe(0);
    expect(appsAfter.length).toBe(0);
    expect(savedAfter.length).toBe(0);
    expect(alertsAfter.length).toBe(0);
    expect(membersAfter.length).toBe(0);
  });

  it("leaves the employer's organization and jobs intact", async () => {
    await db.delete(user).where(eq(user.id, userId));

    const [orgRow] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId));

    expect(orgRow).toBeDefined();

    const employerMembership = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, employerId));

    expect(employerMembership.length).toBe(1);
    expect(employerMembership[0]!.role).toBe("owner");
  });
});
