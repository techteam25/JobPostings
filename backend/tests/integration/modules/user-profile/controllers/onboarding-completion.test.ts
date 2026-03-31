import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { request, TestHelpers } from "@tests/utils/testHelpers";
import { createUser } from "@tests/utils/seedBuilders";
import { createTestDatabase } from "@tests/utils/testDatabase";
import { userOnBoarding } from "@/db/schema";

const { db } = createTestDatabase();

vi.mock("@shared/infrastructure/queue.service", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@shared/infrastructure/queue.service")
    >();
  return {
    ...original,
    queueService: {
      addJob: vi.fn().mockResolvedValue(undefined),
    },
  };
});

async function seedAndLogin(overrides?: { email?: string; name?: string }) {
  const email = overrides?.email ?? "seeker@example.com";
  const name = overrides?.name ?? "Test Seeker";

  const user = await createUser({
    email,
    password: "Password@123",
    name,
  });

  const loginResponse = await request
    .post("/api/auth/sign-in/email")
    .send({ email, password: "Password@123" });

  const cookie = loginResponse.headers["set-cookie"]?.[0] ?? "";

  return { user, cookie };
}

describe("PATCH /api/users/me/onboarding/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should complete onboarding for a seeker with pending status and enqueue welcome email", async () => {
    const { user, cookie } = await seedAndLogin();

    const { queueService } =
      await import("@shared/infrastructure/queue.service");

    const response = await request
      .patch("/api/users/me/onboarding/complete")
      .set("Cookie", cookie);

    TestHelpers.validateApiResponse(response, 200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Onboarding completed successfully",
    );
    expect(response.body.data).toHaveProperty("status", "completed");

    // Verify welcome email job was enqueued
    expect(queueService.addJob).toHaveBeenCalledTimes(1);
    expect(queueService.addJob).toHaveBeenCalledWith(
      "emailQueue",
      "sendWelcomeEmail",
      expect.objectContaining({
        userId: user.id,
        email: user.email,
      }),
    );

    // Verify DB state
    const onboarding = await db.query.userOnBoarding.findFirst({
      where: eq(userOnBoarding.userId, user.id),
    });
    expect(onboarding?.status).toBe("completed");
  });

  it("should be idempotent — second call returns 200 with no duplicate email job", async () => {
    const { cookie } = await seedAndLogin();

    const { queueService } =
      await import("@shared/infrastructure/queue.service");

    // First call — transitions
    await request
      .patch("/api/users/me/onboarding/complete")
      .set("Cookie", cookie);

    vi.mocked(queueService.addJob).mockClear();

    // Second call — idempotent
    const response = await request
      .patch("/api/users/me/onboarding/complete")
      .set("Cookie", cookie);

    TestHelpers.validateApiResponse(response, 200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.data).toHaveProperty("status", "completed");

    // No duplicate email job
    expect(queueService.addJob).not.toHaveBeenCalled();
  });

  it("should return 401 for unauthenticated request", async () => {
    const response = await request.patch("/api/users/me/onboarding/complete");

    expect(response.status).toBe(401);
  });

  it("should return 403 for an employer", async () => {
    const { user, cookie } = await seedAndLogin({
      email: "employer@example.com",
      name: "Test Employer",
    });

    // Switch intent to employer
    await db
      .update(userOnBoarding)
      .set({ intent: "employer" })
      .where(eq(userOnBoarding.userId, user.id));

    const response = await request
      .patch("/api/users/me/onboarding/complete")
      .set("Cookie", cookie);

    expect(response.status).toBe(403);
  });
});
