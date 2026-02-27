import { beforeEach, vi } from "vitest";
import { cleanAll } from "../utils/cleanAll";
import logger from "@/logger";

// Ensure NODE_ENV is "test" in worker processes (globalSetup only sets it in its own process)
process.env.NODE_ENV = "test";

// Global mock for queue service — prevents tests from requiring a live Redis connection.
// Test files that need custom queue behavior can override with their own vi.mock.
vi.mock("@/infrastructure/queue.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/infrastructure/queue.service")>();
  return {
    ...original,
    queueService: {
      addJob: vi.fn().mockResolvedValue(undefined),
      initialize: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
      obliterateQueue: vi.fn().mockResolvedValue(undefined),
    },
  };
});

// Global mock for EmailService — prevents tests from hitting the real SMTP server.
// Test files that need custom email behavior can override with their own vi.mock.
vi.mock("@/infrastructure/email.service", () => {
  return {
    EmailService: vi.fn().mockImplementation(() =>
      new Proxy(
        {},
        { get: (_target, prop) => (typeof prop === "string" ? vi.fn().mockResolvedValue(undefined) : undefined) },
      ),
    ),
  };
});

// Setup that runs before each test — guarantees pristine DB state
beforeEach(async () => {
  try {
    await cleanAll();
  } catch (error) {
    if (error instanceof Error)
      logger.debug(`Test data cleanup skipped: ${error.message}`);
  }
});

// Extend global types if needed
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      PORT?: string;
      HOST?: string;
    }
  }
}
