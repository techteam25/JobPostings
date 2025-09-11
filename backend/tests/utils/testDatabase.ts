import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '@/config/env';
import * as schema from '@/db/schema';

let testConnection: mysql.Pool | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;

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
    ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
    connectionLimit: 5, // Smaller pool for tests
    acquireTimeout: 30000,
    timeout: 30000,
  });

  testDb = drizzle(testConnection, {
    schema,
    mode: 'default',
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
    await db.delete(schema.jobs);
    await db.delete(schema.users);
  } catch (error) {
    console.error('Failed to clear test data:', error);
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
    username: `testuser${Date.now()}`,
    firstName: 'Test',
    lastName: 'User',
    passwordHash: 'hashedpassword123',
    role: 'user',
    isEmailVerified: true,
    isActive: true,
    ...overrides,
  };

  const [result] = await db.insert(schema.users).values(defaultUser);
  
  // Get the inserted user
  const [user] = await db
    .select()
    .from(schema.users)
    .where(schema.eq(schema.users.id, result.insertId));
    
  return user;
}

/**
 * Create test job data
 */
export async function createTestJob(
  employerId: number,
  overrides: Partial<schema.NewJob> = {}
) {
  const { db } = createTestDatabase();
  
  const defaultJob: schema.NewJob = {
    title: 'Test Software Engineer Position',
    description: 'This is a test job posting for a software engineer position with great benefits and competitive salary.',
    companyName: 'Test Company Inc.',
    location: 'Remote',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salaryMin: 70000,
    salaryMax: 90000,
    salaryCurrency: 'USD',
    isRemote: true,
    isActive: true,
    requiredSkills: JSON.stringify(['JavaScript', 'TypeScript', 'Node.js']),
    employerId,
    ...overrides,
  };

  const [result] = await db.insert(schema.jobs).values(defaultJob);
  
  // Get the inserted job
  const [job] = await db
    .select()
    .from(schema.jobs)
    .where(schema.eq(schema.jobs.id, result.insertId));
    
  return job;
}

/**
 * Create test job application
 */
export async function createTestJobApplication(
  jobId: number,
  applicantId: number,
  overrides: Partial<schema.NewJobApplication> = {}
) {
  const { db } = createTestDatabase();
  
  const defaultApplication: schema.NewJobApplication = {
    jobId,
    applicantId,
    status: 'pending',
    coverLetter: 'This is a test cover letter for the job application.',
    resumeUrl: 'https://example.com/resume.pdf',
    ...overrides,
  };

  const [result] = await db.insert(schema.jobApplications).values(defaultApplication);
  
  // Get the inserted application
  const [application] = await db
    .select()
    .from(schema.jobApplications)
    .where(schema.eq(schema.jobApplications.id, result.insertId));
    
  return application;
}

/**
 * Check if test database exists and is accessible
 */
export async function checkTestDatabase(): Promise<boolean> {
  try {
    const { connection } = createTestDatabase();
    const [result] = await connection.execute('SELECT 1 as healthy');
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('Test database check failed:', error);
    return false;
  }
}
