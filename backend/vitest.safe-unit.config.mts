import { defineConfig } from "vitest/config";
import path from "path";

/** Pure unit tests only: avoids the integration setup that clears jobpostings_test. */
export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/unit/validations/userProfile.validation.test.ts",
      "tests/unit/middleware/validation.middleware.test.ts",
      "tests/unit/workers/file-upload.worker.test.ts",
      "tests/unit/services/profile-intent.service.test.ts",
      "tests/unit/services/profile-upload-status.service.test.ts",
      "tests/unit/utils/auth/registration-intent.test.ts",
    ],
    server: { deps: { inline: ["zod"] } },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
