import { checkTestDatabase, cleanupTestDatabase } from '../utils/testDatabase';

export async function setup() {
  console.log('🧪 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0'; // Use random port for testing
  
  // Ensure required database environment variables are set for tests
  if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.warn('⚠️  Database environment variables not set. Some tests may fail.');
    return;
  }
  
  // Check test database connection
  try {
    const isConnected = await checkTestDatabase();
    if (isConnected) {
      console.log('✅ Test database connection successful');
    } else {
      console.warn('⚠️  Test database connection failed. Database tests will be skipped.');
    }
  } catch (error) {
    console.warn('⚠️  Test database setup failed:', error);
  }
}

export async function teardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    await cleanupTestDatabase();
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
}
