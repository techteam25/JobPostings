import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { reset, seed } from "drizzle-seed";
import { eq, sql } from "drizzle-orm";

import * as schema from "./schema";
import { userProfile, userEmailPreferences } from "@/db/schema";
import { organizations, organizationMembers } from "@/db/schema";
import { jobsDetails } from "@/db/schema";
import { env } from "@/config/env";
import { auth } from "@/utils/auth";
import logger from "@/logger";
import { userOnBoarding } from "./schema";

const connection = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

/**
 * Seeds the database with fake data for development and testing purposes.
 * This function resets the database, creates users, user profiles, organizations, job postings, and organization members.
 * It uses Faker.js to generate realistic fake data and ensures data integrity with proper relationships.
 * The seeding process includes:
 * - 50 users with authentication accounts
 * - User profiles for all users
 * - 10 organizations with job postings (10 jobs each)
 * - Organization members including owners and additional roles
 * After seeding, it logs the completion and exits the process.
 */
async function runSeed() {
  const { faker } = await import("@faker-js/faker");
  const db = drizzle(connection, { schema, mode: "default" });

  logger.info("Starting database reset...");
  await reset(db, schema);
  await db.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
  await db.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);
  await db.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

  logger.info("Starting database seeding...");

  logger.info("Seeding users...");

  // Seed users sequentially to avoid race conditions with unique constraints
  for (let idx = 0; idx < 50; idx++) {
    await auth.api.signUpEmail({
      body: {
        email: `user_${idx + 1}@example.com`,
        password: "Password@123",
        name: faker.person.firstName() + " " + faker.person.lastName(),
        image: faker.image.avatar(),
      },
    });
  }

  // Verify users were inserted
  const userCount = await db.select().from(schema.user);
  logger.info(`✓ Verified ${userCount.length} users inserted`);

  logger.info("Seeding user profiles...");

  // Seed user profiles
  await seed(db, { userProfile }, { seed: 43 }).refine((f) => ({
    userProfile: {
      count: 50,
      columns: {
        userId: f.int({ minValue: 1, maxValue: 50, isUnique: true }),
        bio: f.loremIpsum({ sentencesCount: 3 }),
        phoneNumber: f.phoneNumber({ template: "(###) ###-####" }),
        address: f.streetAddress(),
        linkedinUrl: f.default({ defaultValue: faker.internet.url() }),
        portfolioUrl: f.default({ defaultValue: faker.internet.url() }),
        city: f.city(),
        state: f.state(),
        zipCode: f.postcode(),
        country: f.country(),
        isProfilePublic: f.valuesFromArray({
          values: [true, false],
        }),
        isAvailableForWork: f.valuesFromArray({
          values: [true, false],
        }),
      },
    },
  }));

  logger.info("Seeding organizations with job postings...");

  await seed(db, { organizations, jobsDetails }, { seed: 42 }).refine((f) => ({
    organizations: {
      count: 10,
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
        jobsDetails: 10,
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
        isRemote: f.valuesFromArray({
          values: [true, false],
        }),
        isActive: f.valuesFromArray({
          values: [true, false],
        }),
        applicationDeadline: f.date({
          minDate: "2025-12-31",
          maxDate: "2026-08-31",
        }),
      },
    },
  }));

  logger.info("Seeding organization members (including owners)...");

  // Seed owners first (users 1-10 as owners of orgs 1-10)
  for (let i = 1; i <= 10; i++) {
    await db.insert(organizationMembers).values({
      userId: i,
      organizationId: i,
      role: "owner",
      isActive: true,
    });

    await db
      .update(userOnBoarding)
      .set({
        intent: "employer",
      })
      .where(eq(userOnBoarding.userId, i));
  }

  // Seed additional members manually to avoid unique constraint violations
  const additionalMembers = [];
  let userId = 11;
  for (let orgId = 1; orgId <= 10; orgId++) {
    // Add 3 members per organization
    for (let j = 0; j < 3 && userId <= 50; j++) {
      additionalMembers.push({
        userId: userId++,
        organizationId: orgId,
        role: ["admin", "recruiter", "member"][j % 3],
        isActive: true,
      });
    }
  }

  if (additionalMembers.length > 0) {
    // @ts-ignore
    await db.insert(organizationMembers).values(additionalMembers);
  }

  logger.info("✓ Users seeded: 50");
  logger.info("✓ Organizations seeded: 10");
  logger.info(
    "✓ Organization members seeded: 40 (10 owners + 30 other members)",
  );
  logger.info("✓ Job postings seeded: ~100 (10 per organization)");
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
