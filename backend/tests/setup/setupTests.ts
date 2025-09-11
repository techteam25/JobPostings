import { beforeEach, afterEach } from 'vitest';
import { clearTestData } from '../utils/testDatabase';

// Setup that runs before each test
beforeEach(async () => {
  // Clear test data before each test (if database is available)
  try {
    if (process.env.DB_HOST && process.env.NODE_ENV === 'test') {
      await clearTestData();
    }
  } catch (error) {
    // Ignore database errors in setup - tests will handle it
    console.debug('Test data cleanup skipped:', error.message);
  }
});

// Cleanup that runs after each test
afterEach(async () => {
  // Additional cleanup if needed
  // Test data is cleared before each test, so this is usually not needed
});

// Extend global types if needed
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      HOST?: string;
    }
  }
}
