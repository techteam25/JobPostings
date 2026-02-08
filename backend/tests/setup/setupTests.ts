import { beforeEach } from "vitest";
import { cleanAll } from "../utils/cleanAll";
import logger from "@/logger";

// Ensure NODE_ENV is "test" in worker processes (globalSetup only sets it in its own process)
process.env.NODE_ENV = "test";

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
