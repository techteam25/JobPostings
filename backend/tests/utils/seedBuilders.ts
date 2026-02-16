/**
 * Composable seed builders — INSERT-only, never delete.
 * Each function creates data and returns the created entity with its ID.
 */

import { eq, sql } from "drizzle-orm";

import { auth } from "@/utils/auth";
import { db } from "@/db/connection";
import {
  organizations,
  jobsDetails,
  user,
  userProfile,
  userEmailPreferences,
  organizationMembers,
  jobApplications,
} from "@/db/schema";
import { userProfileFixture } from "@tests/utils/fixtures";

// ─── User Builders ───────────────────────────────────────────────────

export interface CreatedUser {
  id: number;
  email: string;
}

/**
 * Creates a single user via better-auth signUpEmail.
 * Returns the created user's id and email.
 */
export async function createUser(
  overrides: {
    email?: string;
    password?: string;
    name?: string;
    image?: string;
    status?: "active" | "deactivated" | "deleted";
  } = {},
): Promise<CreatedUser> {
  const { faker } = await import("@faker-js/faker");

  const email = overrides.email ?? faker.internet.email();
  const password = overrides.password ?? "Password@123";
  const name =
    overrides.name ?? faker.person.firstName() + " " + faker.person.lastName();
  const image = overrides.image ?? faker.image.avatar();

  const created = await auth.api.signUpEmail({
    body: { email, password, name, image },
  });

  const userId = Number(created.user.id);

  if (overrides.status && overrides.status !== "active") {
    await db
      .update(user)
      .set({ status: overrides.status })
      .where(eq(user.id, userId));
  }

  return { id: userId, email: created.user.email };
}

/**
 * Creates multiple users via direct DB insert (faster, no auth session).
 * Returns array of created user objects.
 */
export async function createUsers(count: number = 5): Promise<CreatedUser[]> {
  const { faker } = await import("@faker-js/faker");
  const bcrypt = await import("bcrypt");

  const hashedPassword = await bcrypt.hash("Password@123", 12);

  const values = Array.from({ length: count }).map(() => ({
    email: faker.internet.email(),
    passwordHash: hashedPassword,
    fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
    emailVerified: true,
    image: faker.image.avatar(),
    role: "user" as const,
  }));

  await db.insert(user).values(values);

  // Fetch inserted users to get their IDs
  const inserted = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .orderBy(user.id);

  return inserted;
}

// ─── Organization Builders ───────────────────────────────────────────

export interface CreatedOrganization {
  id: number;
  name: string;
}

/**
 * Creates a single organization. Returns its id and name.
 */
export async function createOrganization(
  overrides: Partial<{
    name: string;
    streetAddress: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
    url: string;
    mission: string;
  }> = {},
): Promise<CreatedOrganization> {
  const { faker } = await import("@faker-js/faker");

  const values = {
    name: overrides.name ?? faker.company.name(),
    streetAddress: overrides.streetAddress ?? faker.location.streetAddress(),
    city: overrides.city ?? faker.location.city(),
    state: overrides.state ?? faker.location.state(),
    country: overrides.country ?? faker.location.country(),
    zipCode: overrides.zipCode ?? faker.location.zipCode("#####"),
    phone: overrides.phone ?? faker.phone.number({ style: "international" }),
    url: overrides.url ?? faker.internet.url(),
    mission: overrides.mission ?? faker.lorem.sentence(),
  };

  const [inserted] = await db
    .insert(organizations)
    .values(values)
    .$returningId();

  if (!inserted) throw new Error("Failed to create organization");

  return { id: inserted.id, name: values.name };
}

/**
 * Creates multiple organizations. Returns array of { id, name }.
 */
export async function createOrganizations(
  count: number = 3,
): Promise<CreatedOrganization[]> {
  const { faker } = await import("@faker-js/faker");

  const values = Array.from({ length: count }).map(() => ({
    name: faker.company.name(),
    streetAddress: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: faker.location.country(),
    zipCode: faker.location.zipCode("#####"),
    phone: faker.phone.number({ style: "international" }),
    url: faker.internet.url(),
    mission: faker.lorem.sentence(),
  }));

  const ids = await db.insert(organizations).values(values).$returningId();

  return ids.map((row, i) => ({ id: row.id, name: values[i]!.name }));
}

// ─── Organization Member Builders ────────────────────────────────────

export interface CreatedMembership {
  userId: number;
  organizationId: number;
  role: string;
}

/**
 * Creates an organization membership for a given user and organization.
 */
export async function createOrganizationMember(
  userId: number,
  organizationId: number,
  role: "owner" | "admin" | "recruiter" | "member" = "owner",
): Promise<CreatedMembership> {
  await db.insert(organizationMembers).values({
    userId,
    organizationId,
    role,
    isActive: true,
  });

  return { userId, organizationId, role };
}

// ─── Job Builders ────────────────────────────────────────────────────

export interface CreatedJob {
  id: number;
  title: string;
}

enum jobTypeEnum {
  FULL_TIME = "full-time",
  PART_TIME = "part-time",
  CONTRACT = "contract",
  VOLUNTEER = "volunteer",
  INTERNSHIP = "internship",
}

enum compensationTypeEnum {
  PAID = "paid",
  MISSIONARY = "missionary",
  VOLUNTEER = "volunteer",
  STIPEND = "stipend",
}

/**
 * Creates a single job posting. Returns its id and title.
 */
export async function createJob(
  employerId: number,
  overrides: Partial<{
    title: string;
    description: string;
    city: string;
    state: string;
    country: string;
    zipcode: number;
    experience: string;
    jobType: string;
    compensationType: string;
    isRemote: boolean;
    isActive: boolean;
    applicationDeadline: Date;
  }> = {},
): Promise<CreatedJob> {
  const { faker } = await import("@faker-js/faker");

  const title = overrides.title ?? faker.lorem.words(5);
  const values = {
    title,
    description: overrides.description ?? faker.lorem.paragraph(1),
    city: overrides.city ?? faker.location.city(),
    state: overrides.state ?? faker.location.state(),
    country: overrides.country ?? faker.location.country(),
    zipcode: overrides.zipcode ?? parseInt(faker.location.zipCode("#####")),
    experience:
      overrides.experience ??
      faker.helpers
        .enumValue({
          ENTRY_LEVEL: "Entry Level",
          MID_LEVEL: "Mid Level",
          SENIOR_LEVEL: "Senior Level",
          MANAGER: "Manager",
        })
        .toString(),
    jobType:
      (overrides.jobType as
        | "full-time"
        | "part-time"
        | "contract"
        | "volunteer"
        | "internship") ??
      (faker.helpers.enumValue(jobTypeEnum) as
        | "full-time"
        | "part-time"
        | "contract"
        | "volunteer"
        | "internship"),
    compensationType:
      (overrides.compensationType as
        | "paid"
        | "missionary"
        | "volunteer"
        | "stipend") ??
      (faker.helpers.enumValue(compensationTypeEnum) as
        | "paid"
        | "missionary"
        | "volunteer"
        | "stipend"),
    isRemote: overrides.isRemote ?? faker.datatype.boolean(),
    isActive: overrides.isActive ?? true,
    applicationDeadline: overrides.applicationDeadline ?? faker.date.future(),
    employerId,
  };

  const [inserted] = await db.insert(jobsDetails).values(values).$returningId();

  if (!inserted) throw new Error("Failed to create job");

  return { id: inserted.id, title };
}

/**
 * Creates multiple jobs for a given employer. Returns array of { id, title }.
 */
export async function createJobs(
  employerId: number,
  count: number = 3,
): Promise<CreatedJob[]> {
  const results: CreatedJob[] = [];
  for (let i = 0; i < count; i++) {
    results.push(await createJob(employerId));
  }
  return results;
}

// ─── Job Application Builders ────────────────────────────────────────

export interface CreatedJobApplication {
  id: number;
  jobId: number;
  applicantId: number;
}

/**
 * Creates a job application. Returns its id, jobId, and applicantId.
 */
export async function createJobApplication(
  jobId: number,
  applicantId: number,
  overrides: Partial<{
    status:
      | "pending"
      | "reviewed"
      | "shortlisted"
      | "interviewing"
      | "hired"
      | "rejected"
      | "withdrawn";
    coverLetter: string;
    resumeUrl: string;
    notes: string;
  }> = {},
): Promise<CreatedJobApplication> {
  const { faker } = await import("@faker-js/faker");

  const [inserted] = await db
    .insert(jobApplications)
    .values({
      jobId,
      applicantId,
      status: overrides.status ?? "pending",
      coverLetter: overrides.coverLetter ?? faker.lorem.paragraphs(2),
      resumeUrl: overrides.resumeUrl ?? faker.internet.url(),
      notes: overrides.notes ?? faker.lorem.sentence(),
    })
    .$returningId();

  if (!inserted) throw new Error("Failed to create job application");

  return { id: inserted.id, jobId, applicantId };
}

// ─── User Profile Builders ───────────────────────────────────────────

export interface CreatedUserProfile {
  id: number;
  userId: number;
}

/**
 * Creates a user profile for the given user. Returns its id.
 */
export async function createUserProfile(
  userId: number,
  overrides: Record<string, unknown> = {},
): Promise<CreatedUserProfile> {
  const profileData = await userProfileFixture();

  const [inserted] = await db
    .insert(userProfile)
    .values({
      ...profileData,
      ...overrides,
      userId,
    })
    .$returningId();

  if (!inserted) throw new Error("Failed to create user profile");

  return { id: inserted.id, userId };
}

// ─── Email Preferences Builders ──────────────────────────────────────

export interface CreatedEmailPreferences {
  userId: number;
}

/**
 * Creates email preferences for the given user.
 */
export async function createEmailPreferences(
  userId: number,
  overrides: Record<string, unknown> = {},
): Promise<CreatedEmailPreferences> {
  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

  await db
    .insert(userEmailPreferences)
    .values({
      userId,
      unsubscribeToken: token,
      tokenCreatedAt: new Date(),
      unsubscribeTokenExpiresAt: tokenExpiresAt,
      jobMatchNotifications: true,
      applicationStatusNotifications: true,
      savedJobUpdates: true,
      weeklyJobDigest: true,
      monthlyNewsletter: true,
      marketingEmails: true,
      accountSecurityAlerts: true,
      globalUnsubscribe: false,
      ...overrides,
    })
    .onDuplicateKeyUpdate({
      set: {
        userId: sql`values(${userEmailPreferences.userId})`,
      },
    });

  return { userId };
}

// ─── Composite Builder: User with Org Role ───────────────────────────

export interface CreatedUserWithRole {
  user: CreatedUser;
  org: CreatedOrganization;
  membership: CreatedMembership;
}

/**
 * Creates a user, an organization, and assigns the user the given role.
 */
export async function createUserWithRole(
  role: "owner" | "admin" | "recruiter" | "member",
  email: string = "test.user@example.com",
): Promise<CreatedUserWithRole> {
  const createdUser = await createUser({ email });
  const org = await createOrganization();
  const membership = await createOrganizationMember(
    createdUser.id,
    org.id,
    role,
  );

  return { user: createdUser, org, membership };
}
