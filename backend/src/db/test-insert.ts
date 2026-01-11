import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";

import * as schema from "./schema";
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

async function testInsert() {
  const db = drizzle(connection, { schema, mode: "default" });

  logger.info("Testing database insert...");

  try {
    // Insert a temporary test user
    const testUser = {
      fullName: "Test User",
      email: `test_${Date.now()}@example.com`, // Unique email with timestamp
      emailVerified: false,
      status: "active" as const,
    };

    logger.info(`Inserting test user: ${testUser.email}`);

    const result = await db.insert(user).values(testUser);

    // Get the inserted user to verify
    const insertedUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, testUser.email));

    if (insertedUsers.length > 0) {
      const insertedUser = insertedUsers[0];
      logger.info("✓ User inserted successfully!");
      logger.info(`  - ID: ${insertedUser?.id}`);
      logger.info(`  - Name: ${insertedUser?.fullName}`);
      logger.info(`  - Email: ${insertedUser?.email}`);
      logger.info(`  - Status: ${insertedUser?.status}`);
      logger.info(`  - Created At: ${insertedUser?.createdAt}`);

      // Clean up - delete the test user
      logger.info("Cleaning up test user...");
      await db.delete(user).where(eq(user.id, insertedUser!.id));
      logger.info("✓ Test user deleted");

      return true;
    } else {
      logger.error("✗ User was not found after insertion");
      return false;
    }
  } catch (error) {
    logger.error(
      `✗ Insert failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    if (error instanceof Error && error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

testInsert()
  .then((success) => {
    if (success) {
      logger.info("✓ Database insert test completed successfully!");
      process.exit(0);
    } else {
      logger.error("✗ Database insert test failed");
      process.exit(1);
    }
  })
  .catch((error) => {
    logger.error(`Database insert test failed: ${error}`);
    process.exit(1);
  });
