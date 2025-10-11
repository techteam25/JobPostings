import { Pool } from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/config/env";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

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
    await db.delete(schema.users);
  } catch (error) {
    console.error("Failed to clear test data:", error);
    throw error;
  }
}

/**
 * Create test user data
 */
export async function createTestUser(overrides: Partial<schema.NewUser> = {}) {
  const { db } = createTestDatabase();

  const defaultUser: schema.NewUser = {
    email: `test${Date.now()}@example.com`,
    firstName: "Test",
    lastName: "User",
    passwordHash: "hashedpassword123",
    role: "user",
    isEmailVerified: true,
    isActive: true,
    ...overrides,
  };

  const [result] = await db.insert(schema.users).values(defaultUser);

  // Get the inserted user
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, result.insertId));

  return user;
}

/**
 * Create test job data
 */
export async function createTestJob(
  employerId: number,
  overrides: Partial<schema.NewJob> = {},
) {
  const { db } = createTestDatabase();

  const defaultJob: schema.NewJob = {
    title: "Test Software Engineer Position",
    description:
      "This is a test job posting for a software engineer position with great benefits and competitive salary.",
    location: "Remote",
    compensationType: "missionary",
    jobType: "full-time",
    experience: "mid",
    salaryMin: 70000,
    salaryMax: 90000,
    isRemote: true,
    isActive: true,
    skills: JSON.stringify(["JavaScript", "TypeScript", "Node.js"]),
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
  overrides: Partial<schema.NewJobApplication> = {},
) {
  const { db } = createTestDatabase();

  const defaultApplication: schema.NewJobApplication = {
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
