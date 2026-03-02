/**
 * Pre-built test scenarios that compose the seed builders.
 * Each returns all created entity refs so tests can use real IDs.
 */

import {
  createUser,
  createOrganization,
  createOrganizations,
  createOrganizationMember,
  createJob,
  createJobs,
  createJobApplication,
  createUserProfile,
  createEmailPreferences,
  createUserWithRole,
  type CreatedUser,
  type CreatedOrganization,
  type CreatedMembership,
  type CreatedJob,
  type CreatedJobApplication,
  type CreatedUserProfile,
  type CreatedEmailPreferences,
} from "./seedBuilders";

// ─── User Scenario ───────────────────────────────────────────────────

export interface UserScenario {
  user: CreatedUser;
}

/**
 * Creates a single user (optionally with a non-active status).
 */
export async function seedUserScenario(
  status?: "active" | "deactivated" | "deleted",
): Promise<UserScenario> {
  const user = await createUser({
    email: "normal.user@example.com",
    status,
  });
  return { user };
}

// ─── Admin Scenario ──────────────────────────────────────────────────

export interface AdminScenario {
  user: CreatedUser;
  orgs: CreatedOrganization[];
  membership: CreatedMembership;
}

/**
 * Creates an admin user with 5 organizations (owner of first).
 */
export async function seedAdminScenario(): Promise<AdminScenario> {
  const user = await createUser({ email: "admin.user@example.com" });
  const orgs = await createOrganizations(5);
  const membership = await createOrganizationMember(
    user.id,
    orgs[0]!.id,
    "owner",
  );
  return { user, orgs, membership };
}

// ─── Organization Scenario ───────────────────────────────────────────

export interface OrgScenario {
  owner: CreatedUser;
  orgs: CreatedOrganization[];
  memberships: CreatedMembership[];
}

/**
 * Creates an owner user with 3 organizations and memberships for each.
 */
export async function seedOrgScenario(): Promise<OrgScenario> {
  const owner = await createUser({ email: "org.owner@example.com" });
  const orgs = await createOrganizations(3);
  const memberships: CreatedMembership[] = [];

  for (const org of orgs) {
    const m = await createOrganizationMember(owner.id, org.id, "owner");
    memberships.push(m);
  }

  return { owner, orgs, memberships };
}

// ─── Jobs Scenario ───────────────────────────────────────────────────

export interface JobsScenario {
  owner: CreatedUser;
  member: CreatedUser;
  orgs: CreatedOrganization[];
  jobs: CreatedJob[];
}

/**
 * Creates an owner user, 5 organizations, a recruiter member, and 3 jobs
 * belonging to the first organization.
 * Matches the old seedJobs() output.
 */
export async function seedJobsScenario(): Promise<JobsScenario> {
  const owner = await createUser({ email: "owner.user@example.com" });
  const orgs = await createOrganizations(5);

  // Owner is member of all orgs
  for (const org of orgs) {
    await createOrganizationMember(owner.id, org.id, "owner");
  }

  // Create a recruiter member on org[0]
  const member = await createUser({ email: "org.member@example.com" });
  await createOrganizationMember(member.id, orgs[0]!.id, "recruiter");

  // Create 3 jobs for org[0]
  const jobs = await createJobs(orgs[0]!.id, 3);

  return { owner, member, orgs, jobs };
}

// ─── Job Applications Scenario ───────────────────────────────────────

export interface JobApplicationsScenario {
  owner: CreatedUser;
  member: CreatedUser;
  applicant: CreatedUser;
  orgs: CreatedOrganization[];
  jobs: CreatedJob[];
  applications: CreatedJobApplication[];
}

/**
 * Full scenario: owner + orgs + member + jobs + applicant + applications.
 * Matches the old seedJobApplications() output.
 */
export async function seedJobApplicationsScenario(): Promise<JobApplicationsScenario> {
  const { owner, member, orgs, jobs } = await seedJobsScenario();

  const applicant = await createUser({
    email: "applicant.user@example.com",
  });

  const applications: CreatedJobApplication[] = [];
  for (const job of jobs) {
    const app = await createJobApplication(job.id, applicant.id);
    applications.push(app);
  }

  return { owner, member, applicant, orgs, jobs, applications };
}

// ─── User Profile Scenario ───────────────────────────────────────────

export interface UserProfileScenario {
  user: CreatedUser;
  profile: CreatedUserProfile;
  emailPrefs: CreatedEmailPreferences;
}

/**
 * Creates a user with a full profile and email preferences.
 * Matches the old seedUserProfile() output.
 */
export async function seedUserProfileScenario(): Promise<UserProfileScenario> {
  const user = await createUser({ email: "normal.user@example.com" });
  const profile = await createUserProfile(user.id);
  const emailPrefs = await createEmailPreferences(user.id);
  return { user, profile, emailPrefs };
}

// ─── User with Role Scenario ─────────────────────────────────────────

export interface UserWithRoleScenario {
  user: CreatedUser;
  org: CreatedOrganization;
  membership: CreatedMembership;
}

/**
 * Creates a user with an org membership for the given role.
 * Matches the old seedUserWithRole() output.
 */
export async function seedUserWithRoleScenario(
  role: "owner" | "admin" | "recruiter" | "member",
  email: string = "test.user@example.com",
): Promise<UserWithRoleScenario> {
  return createUserWithRole(role, email);
}
