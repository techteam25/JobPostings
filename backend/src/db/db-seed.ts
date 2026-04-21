import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { reset, seed } from "drizzle-seed";
import { asc, eq, inArray, sql } from "drizzle-orm";
import type { Faker } from "@faker-js/faker";
import crypto from "crypto";

import * as schema from "./schema";
import { userProfile } from "@/db/schema";
import { organizations, organizationMembers } from "@/db/schema";
import { jobsDetails } from "@/db/schema";
import { env } from "@shared/config/env";
import { auth } from "@/utils/auth";
import logger from "@shared/logger";
import { userEmailPreferences } from "./schema";
import { educations } from "./schema";
import { workExperiences } from "./schema";

type DB = MySql2Database<typeof schema>;

const connection = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

const USER_COUNT = 50;
const ORG_COUNT = 10;
const JOBS_PER_ORG = 10;
const MEMBERS_PER_ORG = 3;

async function seedUsers(
  db: DB,
  faker: Faker,
): Promise<{ userIds: number[]; profileIds: number[] }> {
  logger.info("Seeding users via Better-Auth...");

  // 1. user + account (via Better-Auth so password credentials exist for sign-in)
  for (let idx = 0; idx < USER_COUNT; idx++) {
    await auth.api.signUpEmail({
      body: {
        email: `user_${idx + 1}@example.com`,
        password: "Password@123",
        name: faker.person.firstName() + " " + faker.person.lastName(),
        image: faker.image.avatar(),
      },
    });
  }

  const insertedUsers = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .orderBy(asc(schema.user.id));
  const userIds = insertedUsers.map((u) => u.id);

  // 2-4. Manually seed dependent rows. Each uses ON DUPLICATE KEY UPDATE as a
  // no-op so that if Better-Auth's after-hook ever gets wired up and inserts
  // these rows first, we don't blow up on the unique userId constraint.
  logger.info("Seeding onboarding, email preferences, and profiles...");

  // 2. userOnBoarding — unique(userId)
  await db
    .insert(schema.userOnBoarding)
    .values(
      userIds.map((userId) => ({
        userId,
        intent: "seeker" as const,
        status: "pending" as const,
      })),
    )
    .onDuplicateKeyUpdate({ set: { userId: sql`user_id` } });

  // 3. userEmailPreferences — unique(userId)
  await db
    .insert(userEmailPreferences)
    .values(
      userIds.map((userId) => ({
        userId,
        unsubscribeToken: crypto.randomBytes(32).toString("hex"),
        unsubscribeTokenExpiresAt: new Date(),
        jobMatchNotifications: true,
        applicationStatusNotifications: true,
        savedJobUpdates: true,
        weeklyJobDigest: true,
        monthlyNewsletter: true,
        marketingEmails: true,
        accountSecurityAlerts: true,
        globalUnsubscribe: false,
      })),
    )
    .onDuplicateKeyUpdate({ set: { userId: sql`user_id` } });

  // 4. userProfile — unique(userId)
  await db
    .insert(userProfile)
    .values(
      userIds.map((userId) => ({
        userId,
        bio: faker.lorem.sentences(3),
        phoneNumber: `(${faker.string.numeric(3)}) ${faker.string.numeric(3)}-${faker.string.numeric(4)}`,
        address: faker.location.streetAddress(),
        linkedinUrl: faker.internet.url(),
        portfolioUrl: faker.internet.url(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
        fileMetadata: null,
        isProfilePublic: faker.datatype.boolean(),
        isAvailableForWork: faker.datatype.boolean(),
      })),
    )
    .onDuplicateKeyUpdate({ set: { userId: sql`user_id` } });

  const profiles = await db
    .select({ id: userProfile.id })
    .from(userProfile)
    .orderBy(asc(userProfile.id));
  const profileIds = profiles.map((p) => p.id);

  logger.info(
    `✓ ${userIds.length} users seeded with onboarding, email preferences, and profiles`,
  );
  return { userIds, profileIds };
}

async function seedOrganizationsWithJobs(
  db: DB,
): Promise<{ orgIds: number[] }> {
  logger.info("Seeding organizations with job postings...");

  await seed(db, { organizations, jobsDetails }, { seed: 42 }).refine((f) => ({
    organizations: {
      count: ORG_COUNT,
      columns: {
        name: f.companyName(),
        streetAddress: f.streetAddress(),
        city: f.city(),
        logoUrl: f.default({
          defaultValue:
            "https://media.licdn.com/dms/image/v2/D560BAQE_ra7bd7Dyxg/company-logo_200_200/B56ZUbQOI7GUAI-/0/1739918992341/gamestop_logo?e=1764201600&v=beta&t=zypKd-bn7lP_fUgTOe-Ag4RK_jdxRG8tlGuT-9p3-N0",
        }),
        url: f.valuesFromArray({
          values: [
            "https://xrea.com",
            "https://oakley.com",
            "http://ezinearticles.com",
            "http://gizmodo.com",
            "http://theatlantic.com",
            "http://samsung.com",
            "http://pinterest.com",
            "https://github.com",
            "https://nba.com",
            "http://statcounter.com",
          ],
          isUnique: true,
        }),
        state: f.state(),
        country: f.country(),
        zipCode: f.postcode(),
        phone: f.phoneNumber({ template: "(###) ###-####" }),
        mission: f.loremIpsum({ sentencesCount: 2 }),
        subscriptionTier: f.valuesFromArray({
          values: ["free", "basic", "professional", "enterprise"],
        }),
        subscriptionStatus: f.valuesFromArray({
          values: ["active", "cancelled", "expired", "trial"],
        }),
        status: f.valuesFromArray({
          values: ["active", "suspended"],
        }),
      },
      with: {
        jobsDetails: JOBS_PER_ORG,
      },
    },
    jobsDetails: {
      columns: {
        title: f.jobTitle(),
        description: f.loremIpsum({ sentencesCount: 12 }),
        city: f.city(),
        state: f.state(),
        country: f.country(),
        zipcode: f.int({ minValue: 10000, maxValue: 99999 }),
        jobType: f.valuesFromArray({
          values: [
            "full-time",
            "part-time",
            "contract",
            "volunteer",
            "internship",
          ],
        }),
        experience: f.valuesFromArray({
          values: [
            "Entry Level",
            "Mid Level",
            "Senior Level",
            "Lead",
            "Director",
          ],
        }),
        compensationType: f.valuesFromArray({
          values: ["paid", "missionary", "volunteer", "stipend"],
        }),
        isRemote: f.valuesFromArray({ values: [true, false] }),
        isActive: f.valuesFromArray({ values: [true, false] }),
        applicationDeadline: f.date({
          minDate: "2025-12-31",
          maxDate: "2026-08-31",
        }),
      },
    },
  }));

  const orgs = await db.select({ id: organizations.id }).from(organizations);
  const orgIds = orgs.map((o) => o.id);

  logger.info(
    `✓ ${orgIds.length} organizations seeded with ${JOBS_PER_ORG} jobs each`,
  );
  return { orgIds };
}

async function seedOrganizationMembers(
  db: DB,
  userIds: number[],
  orgIds: number[],
): Promise<void> {
  logger.info("Seeding organization members (including owners)...");

  for (let i = 0; i < orgIds.length; i++) {
    const userId = userIds[i]!;
    const orgId = orgIds[i]!;

    await db.insert(organizationMembers).values({
      userId,
      organizationId: orgId,
      role: "owner",
      isActive: true,
    });

    await db
      .update(schema.user)
      .set({ intent: "employer", onboardingStatus: "completed" })
      .where(eq(schema.user.id, userId));

    await db
      .update(schema.userOnBoarding)
      .set({ intent: "employer", status: "completed" })
      .where(eq(schema.userOnBoarding.userId, userId));
  }

  const additionalMembers: {
    userId: number;
    organizationId: number;
    role: "admin" | "recruiter" | "member";
    isActive: boolean;
  }[] = [];
  let userIdx = orgIds.length;
  for (const orgId of orgIds) {
    for (let j = 0; j < MEMBERS_PER_ORG && userIdx < userIds.length; j++) {
      additionalMembers.push({
        userId: userIds[userIdx++]!,
        organizationId: orgId,
        role: (["admin", "recruiter", "member"] as const)[j % 3]!,
        isActive: true,
      });
    }
  }

  if (additionalMembers.length > 0) {
    await db.insert(organizationMembers).values(additionalMembers);

    // Additional org members (admin/recruiter/member) are employer-side too —
    // flip their intent/onboarding in both `user` and `userOnBoarding` so the
    // employer UI treats them correctly.
    const additionalUserIds = additionalMembers.map((m) => m.userId);

    await db
      .update(schema.user)
      .set({ intent: "employer", onboardingStatus: "completed" })
      .where(inArray(schema.user.id, additionalUserIds));

    await db
      .update(schema.userOnBoarding)
      .set({ intent: "employer", status: "completed" })
      .where(inArray(schema.userOnBoarding.userId, additionalUserIds));
  }

  const ownerCount = orgIds.length;
  const memberCount = additionalMembers.length;
  logger.info(
    `✓ Organization members seeded: ${ownerCount + memberCount} (${ownerCount} owners + ${memberCount} other members)`,
  );
}

async function seedEducations(
  db: DB,
  faker: Faker,
  profileIds: number[],
): Promise<void> {
  logger.info("Seeding educations...");

  const programs = [
    "GED",
    "High School Diploma",
    "Associate Degree",
    "Bachelors",
    "Masters",
    "Doctorate",
  ] as const;

  const majors = [
    "Computer Science",
    "Business Administration",
    "Mechanical Engineering",
    "Psychology",
    "Biology",
    "Mathematics",
    "English Literature",
    "Marketing",
    "Nursing",
    "Electrical Engineering",
  ];

  const educationRecords = [];
  const profilesToSeed = faker.helpers.arrayElements(
    profileIds,
    Math.floor(profileIds.length * 0.8),
  );

  for (const profileId of profilesToSeed) {
    const count = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < count; i++) {
      const graduated = faker.datatype.boolean();
      const startDate = faker.date.between({
        from: "2010-01-01",
        to: "2022-01-01",
      });
      const endDate = graduated
        ? faker.date.between({ from: startDate, to: "2025-12-31" })
        : null;

      educationRecords.push({
        userProfileId: profileId,
        schoolName: faker.company.name() + " University",
        program: faker.helpers.arrayElement(programs),
        major: faker.helpers.arrayElement(majors),
        graduated,
        startDate,
        endDate,
      });
    }
  }

  if (educationRecords.length > 0) {
    await db.insert(educations).values(educationRecords);
  }

  logger.info(
    `✓ ${educationRecords.length} education records seeded for ${profilesToSeed.length} profiles`,
  );
}

async function seedWorkExperiences(
  db: DB,
  faker: Faker,
  profileIds: number[],
): Promise<void> {
  logger.info("Seeding work experiences...");

  const experienceRecords = [];
  const profilesToSeed = faker.helpers.arrayElements(
    profileIds,
    Math.floor(profileIds.length * 0.7),
  );

  for (const profileId of profilesToSeed) {
    const count = faker.number.int({ min: 1, max: 4 });
    for (let i = 0; i < count; i++) {
      // Only the most recent entry (first) can be a current job
      const current = i === 0 && faker.datatype.boolean();
      const startDate = faker.date.between({
        from: "2015-01-01",
        to: "2024-06-01",
      });
      const endDate = current
        ? null
        : faker.date.between({ from: startDate, to: "2026-01-01" });

      experienceRecords.push({
        userProfileId: profileId,
        companyName: faker.company.name(),
        jobTitle: faker.person.jobTitle(),
        description: faker.lorem.sentences(3),
        current,
        startDate,
        endDate,
      });
    }
  }

  if (experienceRecords.length > 0) {
    await db.insert(workExperiences).values(experienceRecords);
  }

  logger.info(
    `✓ ${experienceRecords.length} work experience records seeded for ${profilesToSeed.length} profiles`,
  );
}

async function runSeed() {
  const { faker } = await import("@faker-js/faker");
  const db = drizzle(connection, { schema, mode: "default" });

  logger.info("Starting database reset...");
  await reset(db, schema);
  await db.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
  await db.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);
  await db.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

  logger.info("Starting database seeding...");

  const { userIds, profileIds } = await seedUsers(db, faker);
  const { orgIds } = await seedOrganizationsWithJobs(db);
  await seedOrganizationMembers(db, userIds, orgIds);
  await seedEducations(db, faker, profileIds);
  await seedWorkExperiences(db, faker, profileIds);
}

runSeed()
  .then(() => {
    logger.info("Seeding completed.");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Seeding failed: ${error}`);
    process.exit(1);
  });
