// noinspection JSUnusedGlobalSymbols,DuplicatedCode

import { eq, sql } from "drizzle-orm";

import logger from "@/logger";

import { auth } from "@/utils/auth";
import { db } from "@/db/connection";
import {
  organizations,
  jobsDetails,
  user,
  userProfile,
  organizationMembers,
  jobApplications,
} from "@/db/schema";
import { userProfileFixture } from "@tests/utils/fixtures";

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

export const seedUser = async (
  status: "active" | "deactivated" | "deleted" = "active",
) => {
  const { faker } = await import("@faker-js/faker");

  await db.transaction(async (trx) => {
    await trx.delete(user);

    // Reset auto-increment counters
    await trx.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

    const createdUser = await auth.api.signUpEmail({
      body: {
        email: "normal.user@example.com",
        password: "Password@123",
        name: faker.person.firstName() + " " + faker.person.lastName(),
        image: faker.image.avatar(),
      },
    });

    await trx
      .update(user)
      .set({ status })
      .where(eq(user.id, Number(createdUser.user.id)));
  });
};

export const seedUsers = async () => {
  const { faker } = await import("@faker-js/faker");
  const bcrypt = await import("bcrypt");

  const hashedPassword = await bcrypt.hash("Password@123", 12);

  await db.transaction(async (trx) => {
    await trx.delete(user);

    // Reset auto-increment counters
    await trx.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

    await trx.insert(user).values(
      Array.from({ length: 5 }).map((_, index) => ({
        id: index + 1,
        email: faker.internet.email(),
        passwordHash: hashedPassword,
        fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
        emailVerified: true,
        image: faker.image.avatar(),
        role: "user" as const,
      })),
    );
  });
};

export const seedOrganizations = async () => {
  const { faker } = await import("@faker-js/faker");

  await db.transaction(async (trx) => {
    await trx.delete(organizationMembers);
    await trx.delete(organizations);
    await trx.delete(user);

    // Reset auto-increment counters
    await trx.execute(sql`ALTER TABLE organization_members AUTO_INCREMENT = 1`);
    await trx.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
    await trx.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

    const owner = await auth.api.signUpEmail({
      body: {
        email: "org.owner@example.com",
        password: "Password@123",
        name: faker.person.firstName() + " " + faker.person.lastName(),
        image: faker.image.avatar(),
      },
    });

    if (!owner) {
      throw new Error("Failed to create organization owner");
    }

    const createdOrgIds = await trx
      .insert(organizations)
      .values(
        Array.from({ length: 3 }).map(() => ({
          name: faker.company.name(),
          streetAddress: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode("#####"),
          phone: faker.phone.number({ style: "international" }),
          url: faker.internet.url(),
          mission: faker.lorem.sentence(),
        })),
      )
      .$returningId();

    if (createdOrgIds && createdOrgIds.length === 0) {
      throw new Error("No organizations were created");
    }

    await trx.insert(organizationMembers).values(
      createdOrgIds.map((orgId) => ({
        userId: Number(owner.user.id),
        organizationId: orgId.id,
        role: "owner" as const,
        isActive: true,
      })),
    );
  });
};

async function _seedBetterAuthUser() {
  const { faker } = await import("@faker-js/faker");
  return await auth.api.signUpEmail({
    body: {
      email: "owner.user@example.com",
      password: "Password@123",
      name: faker.person.firstName() + " " + faker.person.lastName(),
      image: faker.image.avatar(),
    },
  });
}

async function _seedDbOrganization(
  t: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: number,
) {
  const { faker } = await import("@faker-js/faker");
  const org = await t
    .insert(organizations)
    .values(
      Array.from({ length: 5 }).map(() => ({
        name: faker.company.name(),
        streetAddress: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode("#####"),
        phone: faker.phone.number({ style: "national" }),
        url: faker.internet.url(),
        mission: faker.lorem.sentence(),
      })),
    )
    .$returningId();

  if (!org || org.length === 0) {
    throw new Error("Failed to create organization for job owner");
  }

  await t.insert(organizationMembers).values(
    Array.from({ length: org.length }).map((_, idx) => ({
      userId: userId,
      organizationId: org[idx]!.id,
      role: "owner" as const,
      isActive: true,
    })),
  );

  const member = await auth.api.signUpEmail({
    body: {
      email: "org.member@example.com",
      password: "Password@123",
      name: faker.person.firstName() + " " + faker.person.lastName(),
      image: faker.image.avatar(),
    },
  });

  if (!member) {
    throw new Error("Failed to create organization owner");
  }

  await t.insert(organizationMembers).values({
    userId: Number(member.user.id),
    organizationId: 1,
    role: "recruiter",
    isActive: true,
  });
}

async function _seedDbJobs(
  t: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
) {
  const { faker } = await import("@faker-js/faker");
  await t.insert(jobsDetails).values(
    Array.from({ length: 3 }).map(() => ({
      title: faker.lorem.words(5),
      description: faker.lorem.paragraph(1),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zipcode: parseInt(faker.location.zipCode("#####")),
      experience: faker.helpers
        .enumValue({
          ENTRY_LEVEL: "Entry Level",
          MID_LEVEL: "Mid Level",
          SENIOR_LEVEL: "Senior Level",
          MANAGER: "Manager",
        })
        .toString(),
      jobType: faker.helpers.enumValue(jobTypeEnum),
      compensationType: faker.helpers.enumValue(compensationTypeEnum),
      isRemote: faker.datatype.boolean(),
      isActive: true,
      applicationDeadline: faker.date.future(),
      employerId: 1, // faker.helpers.arrayElement(orgIds),
    })),
  );
}

export const seedJobs = async () => {
  try {
    await db.transaction(async (t) => {
      await t.delete(user);
      await t.delete(organizations);
      await t.delete(jobsDetails);

      // Reset auto-increment counters
      await t.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
      await t.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);
      await t.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

      const createdUser = await _seedBetterAuthUser();
      await _seedDbOrganization(t, Number(createdUser.user.id));

      await _seedDbJobs(t);
    });
  } catch (error) {
    logger.error(`Error seeding jobs:, ${JSON.stringify(error, null, 2)}`);
  }
};

export const seedAdminUser = async () => {
  const { faker } = await import("@faker-js/faker");

  try {
    await db.transaction(async (t) => {
      await t.delete(organizationMembers);
      await t.delete(organizations);
      await t.delete(user);

      // Reset auto-increment counters
      await t.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
      await t.execute(sql`ALTER TABLE organization_members AUTO_INCREMENT = 1`);
      await t.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

      const createdUser = await auth.api.signUpEmail({
        body: {
          email: "admin.user@example.com",
          password: "Password@123",
          name: faker.person.firstName() + " " + faker.person.lastName(),
          image: faker.image.avatar(),
        },
      });

      const [orgId] = await t
        .insert(organizations)
        .values(
          Array.from({ length: 5 }).map(() => ({
            name: faker.company.name(),
            streetAddress: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode("#####"),
            phone: faker.phone.number({ style: "international" }),
            url: faker.internet.url(),
            mission: faker.lorem.sentence(),
          })),
        )
        .$returningId();

      if (!orgId) {
        throw new Error("Failed to create organization for admin user");
      }

      await t.insert(organizationMembers).values({
        userId: Number(createdUser.user.id),
        organizationId: orgId.id,
        role: "owner" as const,
        isActive: true,
      });
    });
  } catch (error) {
    console.error(error);
  }
};

export const seedUserProfile = async () => {
  const { faker } = await import("@faker-js/faker");

  const userProfileData = await userProfileFixture();

  try {
    await db.transaction(async (trx) => {
      await trx.delete(user);

      await trx.execute(sql`ALTER TABLE user_profile AUTO_INCREMENT = 1`);
      await trx.execute(sql`ALTER TABLE educations AUTO_INCREMENT = 1`);
      await trx.execute(sql`ALTER TABLE work_experiences AUTO_INCREMENT = 1`);
      await trx.execute(sql`ALTER TABLE certifications AUTO_INCREMENT = 1`);
      await trx.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

      const createdUser = await auth.api.signUpEmail({
        body: {
          email: "normal.user@example.com",
          password: "Password@123",
          name: faker.person.firstName() + " " + faker.person.lastName(),
          image: faker.image.avatar(),
        },
      });

      if (!createdUser || !parseInt(createdUser.user.id)) {
        throw new Error(`Invalid insertId returned: ${createdUser.user.id}`);
      }

      await trx.insert(userProfile).values({
        ...userProfileData,
        userId: Number(createdUser.user.id),
      });
    });
  } catch (error) {
    console.error("Error seeding user profile: ", error);
  }
};

export const seedJobApplications = async () => {
  const { faker } = await import("@faker-js/faker");

  try {
    await db.transaction(async (t) => {
      await t.delete(user);
      await t.delete(organizations);
      await t.delete(jobApplications);
      await t.delete(jobsDetails);

      // Reset auto-increment counters
      await t.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
      await t.execute(sql`ALTER TABLE job_applications AUTO_INCREMENT = 1`);
      await t.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);
      await t.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

      // Ensure users and jobs are seeded first
      const testUser = await _seedBetterAuthUser();

      await _seedDbOrganization(t, Number(testUser.user.id));
      await _seedDbJobs(t);

      const jobs = await t.select().from(jobsDetails);

      if (jobs.length === 0) {
        throw new Error("No jobs found to apply for");
      }

      const applicant = await auth.api.signUpEmail({
        body: {
          email: "applicant.user@example.com",
          password: "Password@123",
          name: faker.person.firstName() + " " + faker.person.lastName(),
          image: faker.image.avatar(),
        },
      });

      await t.insert(jobApplications).values(
        jobs.map((job) => ({
          jobId: job.id,
          applicantId: Number(applicant.user.id),
          status: "pending" as const,
          coverLetter: faker.lorem.paragraphs(2),
          resumeUrl: faker.internet.url(),
          notes: faker.lorem.sentence(),
        })),
      );
    });
  } catch (e) {
    logger.error(`Error seeding jobs:, ${JSON.stringify(e, null, 2)}`);
  }
};
