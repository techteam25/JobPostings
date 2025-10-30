import { Pool } from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/config/env";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { NewJob, NewJobApplication } from "@/validations/job.validation";

let testConnection: mysql.Pool | null = null;
let testDb: (MySql2Database<typeof schema> & { $client: Pool }) | null = null;

/**
 * Create test database connection
 */
export function createTestDatabase() {
  if (testConnection && testDb) {
    return { connection: testConnection, db: testDb };
  }

  // Create test database connection with suffix
  const testDbName = `${env.DB_NAME}_test`;

  testConnection = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: testDbName,
    connectionLimit: 5, // Smaller pool for tests
  });

  testDb = drizzle(testConnection, {
    schema,
    mode: "default",
    logger: false, // Disable logging in tests
  });

  return { connection: testConnection, db: testDb };
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase() {
  if (testConnection) {
    await testConnection.end();
    testConnection = null;
    testDb = null;
  }
}

/**
 * Clear all test data from tables
 */
export async function clearTestData() {
  const { db } = createTestDatabase();

  try {
    // Clear in reverse order to respect foreign keys
    await db.delete(schema.jobApplications);
    await db.delete(schema.jobsDetails);
    await db.delete(schema.user);
  } catch (error) {
    console.error("Failed to clear test data:", error);
    throw error;
  }
}

/**
 * Create test job data
 */
export async function createTestJob(
  employerId: number,
  overrides: Partial<NewJob> = {},
) {
  const { db } = createTestDatabase();

  const defaultJob: NewJob = {
    title: "Test Software Engineer Position",
    description:
      "This is a test job posting for a software engineer position with great benefits and competitive salary.",
    city: "Test City",
    state: "Test State",
    country: "Test Country",
    zipcode: 12345,
    compensationType: "missionary",
    jobType: "full-time",
    experience: "mid-level",
    isRemote: true,
    isActive: true,
    employerId,
    ...overrides,
  };

  const [result] = await db.insert(schema.jobsDetails).values(defaultJob);

  // Get the inserted job
  const [job] = await db
    .select()
    .from(schema.jobsDetails)
    .where(eq(schema.jobsDetails.id, result.insertId));

  return job;
}

/**
 * Create test job application
 */
export async function createTestJobApplication(
  jobId: number,
  applicantId: number,
  overrides: Partial<NewJobApplication> = {},
) {
  const { db } = createTestDatabase();

  const defaultApplication: NewJobApplication = {
    jobId,
    applicantId,
    status: "pending",
    coverLetter: "This is a test cover letter for the job application.",
    resumeUrl: "https://example.com/resume.pdf",
    ...overrides,
  };

  const [result] = await db
    .insert(schema.jobApplications)
    .values(defaultApplication);

  // Get the inserted application
  const [application] = await db
    .select()
    .from(schema.jobApplications)
    .where(eq(schema.jobApplications.id, result.insertId));

  return application;
}

/**
 * Check if test database exists and is accessible
 */
export async function checkTestDatabase(): Promise<boolean> {
  try {
    const { connection } = createTestDatabase();
    const [result] = await connection.execute("SELECT 1 as healthy");
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error("Test database check failed:", error);
    return false;
  }
}
