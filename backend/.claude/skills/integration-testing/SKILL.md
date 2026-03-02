---
name: Integration Testing
description: Guide for performing integration testing in the GetInvolved project using `vitest`. Use this when asked to create or run integration tests.
---

# Integration Testing in GetInvolved Project

Integration testing is a critical phase in the software development lifecycle that ensures different components of the application work together as expected. In the context of the GetInvolved project, integration testing helps identify and resolve issues that may arise when various modules and services interact with each other.

## When to use this skill

Use this skill when you need to:
- Create new `vitest` integration tests for the GetInvolved `Express` api project
- Debug failing integration tests
- Set up test infrastructure for a new service or module in the GetInvolved project

## Setting Up Integration Testing with Vitest

Below are the steps to set up and run integration tests:
1. **Install Vitest**: Ensure that `vitest` and other essential libraries are installed in your project. You can add it as a development dependency using bun:
   ```bash
   bun install --save-dev vitest
   bun install --save-dev supertest
   bun install --save-dev @types/supertest # If using TypeScript
   bun install --save-dev c8 # For code coverage
   ```
2. **Configure Vitest**: Create (IF NOT EXISTS) a `vitest.config.js` file in the root of your project to configure Vitest for integration testing. You can specify the test environment, test files location, and other settings.
   ```javascript
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       environment: 'node',
       globals: true,
       setupFiles: './tests/setup.js', // Optional: for any setup before tests run
     },
   });
   ```
3. **Create Test Setup**: If needed, create a setup file (e.g., `tests/setup/*`) to initialize any required services, databases, or mock data before running the tests.
4. **Create Test Utilities**: Create utility functions to help with common tasks in your tests, (e.g., `tests/utils/*`) such as making API requests or setting up test data.
5. **Write Integration Tests**: Create test files in the `tests/integration/*` directory. Use `supertest` to make HTTP requests to your Express API and assert the expected outcomes.
   ```javascript
   import request from 'supertest';
   import app from '../../src/app'; // Import your Express app

   describe('GET /api/users', () => {
     it('should return a list of users', async () => {
       const response = await request(app).get('/api/users');
       expect(response.status).toBe(200);
       expect(response.body).toBeInstanceOf(Array);
     });
   });
   ```
6. **Mock External Services**: If your integration tests depend on external services (e.g., databases, Message Queues, etc...) to simulate their behavior during testing.
    ```javascript
   const {
    mockSendAccountDeactivationConfirmation,
    mockSendAccountDeletionConfirmation,
    } = vi.hoisted(() => ({
        mockSendAccountDeactivationConfirmation: vi.fn().mockResolvedValue(undefined),
        mockSendAccountDeletionConfirmation: vi.fn().mockResolvedValue(undefined),
    }));
    
    vi.mock("@/infrastructure/email.service", () => {
    // noinspection JSUnusedGlobalSymbols
    return {
        EmailService: class {
            sendAccountDeactivationConfirmation =
            mockSendAccountDeactivationConfirmation;
            sendAccountDeletionConfirmation = mockSendAccountDeletionConfirmation;
            },
        };
    });
    
    // Mock only deleteUser on the auth module, preserving the rest (e.g. signUpEmail)
    vi.mock("@/utils/auth", async (importOriginal) => {
        const original = await importOriginal<typeof import("@/utils/auth")>();
        return {
                ...original,
                auth: {
                ...original.auth,
                api: {
                ...original.auth.api,
                deleteUser: vi.fn().mockResolvedValue({ success: true }),
                },
            },
        };
    });
   ```
7. **Run Tests**: Use the following command to run your integration tests:
   ```bash
   bun run test # or
   bun run test:watch # for watch mode
   bun run test:coverage # for code coverage
   bun run test:integration # for running only integration tests (if configured)
   ```