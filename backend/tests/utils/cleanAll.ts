import { sql } from "drizzle-orm";
import { db } from "@/db/connection";
import { connection } from "@/db/connection";
import { redisCacheService } from "@/infrastructure/redis-cache.service";

const tableNames = [
  "job_alert_matches",
  "job_alerts",
  "application_notes",
  "job_applications",
  "saved_jobs",
  "job_skills",
  "skills",
  "job_insights",
  "job_details",
  "organization_invitations",
  "organization_members",
  "organizations",
  "user_certifications",
  "certifications",
  "educations",
  "work_experiences",
  "user_profile",
  "user_onboarding",
  "user_email_preferences",
  "email_preference_audit_log",
  "subscriptions",
  "session",
  "account",
  "verification",
  "users",
] as const;

/**
 * Deletes all data from every table and resets AUTO_INCREMENT counters.
 * Uses a single pooled connection to guarantee that SET FOREIGN_KEY_CHECKS
 * stays in effect for the entire cleanup sequence.
 */
export async function cleanAll(): Promise<void> {
  const conn = await connection.getConnection();
  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const name of tableNames) {
      await conn.query(`DELETE FROM \`${name}\``);
      await conn.query(`ALTER TABLE \`${name}\` AUTO_INCREMENT = 1`);
    }
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  } finally {
    conn.release();
  }

  // Flush Redis cache to prevent stale cached responses between tests
  try {
    if (redisCacheService.isReady()) {
      await redisCacheService.getClient().flushDb();
    }
  } catch {
    // Redis may not be available in all test environments
  }
}
