import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment configuration
    environment: 'node',
    
    // Global test setup
    globalSetup: './tests/setup/globalSetup.ts',
    setupFiles: ['./tests/setup/setupTests.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        'vitest.config.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    
    // Test files patterns
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules/', 'dist/'],
    
    // Test timeout
    testTimeout: 10000,
    
    // Run tests in sequence for database operations
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './tests/reports/results.json',
      html: './tests/reports/index.html',
    },
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
