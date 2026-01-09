import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, like } from "drizzle-orm";

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

async function queryTestUser() {
  const db = drizzle(connection, { schema, mode: "default" });

  logger.info("Querying for Test User...");
  
  try {
    // Query for users with "Test User" in the name
    const testUsers = await db
      .select()
      .from(user)
      .where(eq(user.fullName, "Test User"));
    
    if (testUsers.length > 0) {
      logger.info(`✓ Found ${testUsers.length} test user(s):`);
      testUsers.forEach((testUser, index) => {
        logger.info(`\n  User ${index + 1}:`);
        logger.info(`    - ID: ${testUser.id}`);
        logger.info(`    - Name: ${testUser.fullName}`);
        logger.info(`    - Email: ${testUser.email}`);
        logger.info(`    - Status: ${testUser.status}`);
        logger.info(`    - Email Verified: ${testUser.emailVerified}`);
        logger.info(`    - Created At: ${testUser.createdAt}`);
        logger.info(`    - Updated At: ${testUser.updatedAt}`);
      });
      return testUsers;
    } else {
      logger.info("✗ No test user found with name 'Test User'");
      
      // Also check for any users with "test" in email
      logger.info("\nChecking for users with 'test' in email...");
      const testEmailUsers = await db
        .select()
        .from(user)
        .where(like(user.email, "%test%@%"));
      
      if (testEmailUsers.length > 0) {
        logger.info(`Found ${testEmailUsers.length} user(s) with 'test' in email:`);
        testEmailUsers.forEach((testUser, index) => {
          logger.info(`\n  User ${index + 1}:`);
          logger.info(`    - ID: ${testUser.id}`);
          logger.info(`    - Name: ${testUser.fullName}`);
          logger.info(`    - Email: ${testUser.email}`);
        });
      } else {
        logger.info("No users with 'test' in email found");
      }
      
      // Show all users in database
      logger.info("\nShowing all users in database:");
      const allUsers = await db.select().from(user);
      if (allUsers.length > 0) {
        logger.info(`Total users: ${allUsers.length}`);
        allUsers.forEach((u, index) => {
          logger.info(`  ${index + 1}. ${u.fullName} (${u.email}) - ID: ${u.id}`);
        });
      } else {
        logger.info("Database is empty - no users found");
      }
      
      return [];
    }
  } catch (error) {
    logger.error(`✗ Query failed: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

queryTestUser()
  .then((users) => {
    if (users.length > 0) {
      logger.info(`\n✓ Query completed. Found ${users.length} test user(s).`);
      process.exit(0);
    } else {
      logger.info("\n✓ Query completed. No test user found.");
      process.exit(0);
    }
  })
  .catch((error) => {
    logger.error(`Query failed: ${error}`);
    process.exit(1);
  });

