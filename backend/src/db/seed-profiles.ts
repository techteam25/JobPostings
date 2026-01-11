import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

import * as schema from "./schema";
import { userProfile } from "@/db/schema";
import { user } from "@/db/schema";
import { env } from "@/config/env";
import logger from "@/logger";

const connection = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

async function seedUserProfiles() {
  const { faker } = await import("@faker-js/faker");
  const db = drizzle(connection, { schema, mode: "default" });

  logger.info("Fetching existing users...");

  // Get all existing users
  const users = await db.select().from(user);
  logger.info(`Found ${users.length} users`);

  if (users.length === 0) {
    logger.warn("No users found. Please seed users first.");
    process.exit(1);
  }

  // Check which users already have profiles
  let existingUserIds = new Set<number>();
  let existingProfilesCount = 0;
  try {
    const existingProfiles = await db.select().from(userProfile);
    existingUserIds = new Set(existingProfiles.map((p) => p.userId));
    existingProfilesCount = existingProfiles.length;
  } catch (error) {
    logger.info(
      "No existing profiles found or table is empty, proceeding to seed all users",
    );
  }

  // Filter out users that already have profiles
  const usersNeedingProfiles = users.filter((u) => !existingUserIds.has(u.id));

  logger.info(`${existingProfilesCount} profiles already exist`);
  logger.info(`Seeding profiles for ${usersNeedingProfiles.length} users...`);

  // Seed profiles one by one to avoid bulk insert issues
  let successCount = 0;
  for (const userRecord of usersNeedingProfiles) {
    try {
      await db.insert(userProfile).values({
        userId: userRecord.id,
        bio: faker.lorem.paragraph({ min: 2, max: 4 }).substring(0, 500), // Limit bio length
        phoneNumber: faker.phone.number({ style: "national" }).substring(0, 20),
        address: faker.location.streetAddress().substring(0, 255),
        linkedinUrl: faker.internet.url().substring(0, 255),
        portfolioUrl: faker.internet.url().substring(0, 255),
        city: faker.location.city().substring(0, 100),
        state: faker.location.state().substring(0, 100),
        zipCode: faker.location.zipCode().substring(0, 10),
        country: faker.location.country().substring(0, 100),
        isProfilePublic: faker.datatype.boolean(),
        isAvailableForWork: faker.datatype.boolean(),
      });
      successCount++;
    } catch (error) {
      logger.error(
        `Failed to seed profile for user ${userRecord.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  logger.info(
    `✓ Successfully seeded ${successCount} out of ${usersNeedingProfiles.length} user profiles`,
  );
}

seedUserProfiles()
  .then(() => {
    logger.info("Profile seeding completed.");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Profile seeding failed: ${error}`);
    process.exit(1);
  });
