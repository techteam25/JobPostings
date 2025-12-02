import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { reset, seed } from "drizzle-seed";
import { sql } from "drizzle-orm";

import * as schema from "./schema";
import { userProfile, userOnBoarding } from "@/db/schema";
import { organizations, organizationMembers } from "@/db/schema";
import { jobsDetails } from "@/db/schema";
import { env } from "@/config/env";
import { auth } from "@/utils/auth";

const connection = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

async function runSeed() {
  const { faker } = await import("@faker-js/faker");
  const db = drizzle(connection, { schema, mode: "default" });

  console.log("Starting database reset...");
  await reset(db, schema);
  await db.execute(sql`ALTER TABLE organizations AUTO_INCREMENT = 1`);
  await db.execute(sql`ALTER TABLE job_details AUTO_INCREMENT = 1`);
  await db.execute(sql`ALTER TABLE users AUTO_INCREMENT = 1`);

  console.log("Starting database seeding...");

  // Hash a default password for all test users
  const defaultPassword = "Password123!";

  console.log("Seeding users...");

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
  console.log(`✓ Verified ${userCount.length} users inserted`);

  console.log("Seeding user profiles...");

  // Seed user profiles
  await seed(db, { userProfile }, { seed: 43 }).refine((f) => ({
    userProfile: {
      count: 50,
      columns: {
        userId: f.int({ minValue: 1, maxValue: 50, isUnique: true }),
        bio: f.loremIpsum({ sentencesCount: 3 }),
        phoneNumber: f.phoneNumber({ template: "(###) ###-####" }),
        address: f.streetAddress(),
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

  console.log("Seeding organizations with job postings...");

  await seed(db, { organizations }, { seed: 42 }).refine((f) => ({
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
    },
  }));

  console.log("Seeding job postings...");

  // Seed all job postings in one call (50 total, distributed across organizations)
  await seed(db, { jobsDetails }, { seed: 45 }).refine((f) => ({
    jobsDetails: {
      count: 50,
      columns: {
        title: f.jobTitle(),
        description: f.loremIpsum({ sentencesCount: 5 }),
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
        employerId: f.int({ minValue: 1, maxValue: 10 }), // Distribute across organizations
      },
    },
  }));

  console.log("Seeding organization members (including owners)...");

  // Seed owners first (users 1-10 as owners of orgs 1-10)
  for (let i = 1; i <= 10; i++) {
    await db.insert(organizationMembers).values({
      userId: i,
      organizationId: i,
      role: "owner",
      isActive: true,
    });
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

  console.log(`Default password for all users: ${defaultPassword}`);
  console.log("✓ Users seeded: 50");
  console.log("✓ Organizations seeded: 10");
  console.log(
    "✓ Organization members seeded: 40 (10 owners + 30 other members)",
  );
  console.log("✓ Job postings seeded: ~50 (5 per organization)");
}

runSeed()
  .then(() => {
    console.log("Seeding completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
