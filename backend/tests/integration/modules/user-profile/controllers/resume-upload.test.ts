import path from "path";
import fs from "fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { request, TestHelpers } from "@tests/utils/testHelpers";
import { createUser, createUserProfile } from "@tests/utils/seedBuilders";
import { queueService } from "@shared/infrastructure/queue.service";

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

vi.mock("@shared/infrastructure/firebase-upload.service", async () => {
  return {
    firebaseUploadService: {
      deleteFile: vi.fn().mockResolvedValue(true),
      cleanupTempFiles: vi.fn().mockResolvedValue(undefined),
    },
  };
});

const TEST_RESUME_PATH = path.resolve(
  __dirname,
  "../../../../fixtures/test-resume.pdf",
);

async function seedAndLogin() {
  const user = await createUser({
    email: "resume-test@example.com",
    password: "Password@123",
    name: "Resume Test",
  });
  const profile = await createUserProfile(user.id);

  const loginResponse = await request
    .post("/api/auth/sign-in/email")
    .send({ email: user.email, password: "Password@123" });

  const cookie = loginResponse.headers["set-cookie"]?.[0] ?? "";

  return { user, profile, cookie };
}

describe("Resume Upload - POST /api/users/me/resume", () => {
  let cookie: string;
  let profileId: number;

  beforeEach(async () => {
    vi.mocked(queueService.addJob).mockClear();
    const result = await seedAndLogin();
    cookie = result.cookie;
    profileId = result.profile.id;
  });

  it("should accept a valid PDF upload and return 200", async () => {
    const response = await request
      .post("/api/users/me/resume")
      .set("Cookie", cookie)
      .attach("resume", TEST_RESUME_PATH);

    TestHelpers.validateApiResponse(response, 200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.data).toHaveProperty(
      "message",
      "Resume upload initiated",
    );
  });

  it("should enqueue a FILE_UPLOAD_QUEUE job with correct payload", async () => {
    await request
      .post("/api/users/me/resume")
      .set("Cookie", cookie)
      .attach("resume", TEST_RESUME_PATH);

    expect(queueService.addJob).toHaveBeenCalledTimes(1);
    expect(queueService.addJob).toHaveBeenCalledWith(
      "fileUploadQueue",
      "uploadFile",
      expect.objectContaining({
        entityType: "user",
        entityId: String(profileId),
        folder: "resumes",
        mergeWithExisting: true,
        tempFiles: expect.arrayContaining([
          expect.objectContaining({
            originalname: "test-resume.pdf",
            mimetype: "application/pdf",
            fieldName: "resume",
          }),
        ]),
      }),
    );
  });

  it("should return 400 when no file is attached", async () => {
    const response = await request
      .post("/api/users/me/resume")
      .set("Cookie", cookie);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
  });

  it("should return 401 when not authenticated", async () => {
    const response = await request
      .post("/api/users/me/resume")
      .attach("resume", TEST_RESUME_PATH);

    expect(response.status).toBe(401);
  });

  it("should reject non-PDF/Word files", async () => {
    const textFilePath = path.resolve(
      __dirname,
      "../../../../fixtures/test-file.txt",
    );
    await fs.writeFile(textFilePath, "not a resume");

    try {
      const response = await request
        .post("/api/users/me/resume")
        .set("Cookie", cookie)
        .attach("resume", textFilePath);

      // Multer fileFilter rejects non-allowed types with an error.
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).not.toBe(true);
    } finally {
      await fs.unlink(textFilePath).catch(() => {});
    }
  });
});

describe("Resume Delete - DELETE /api/users/me/resume", () => {
  it("should delete resume and enqueue Firebase cleanup job", async () => {
    const result = await seedAndLogin();

    vi.mocked(queueService.addJob).mockClear();

    const response = await request
      .delete("/api/users/me/resume")
      .set("Cookie", result.cookie);

    TestHelpers.validateApiResponse(response, 200);
    expect(response.body.data).toHaveProperty("message", "Resume deleted");

    // Verify Firebase cleanup was enqueued via BullMQ
    expect(queueService.addJob).toHaveBeenCalledWith(
      "fileDeleteQueue",
      "deleteFile",
      expect.objectContaining({
        entityType: "user",
        entityId: String(result.profile.id),
        fileUrl: expect.any(String),
        correlationId: expect.any(String),
      }),
    );
  });

  it("should return 400 when no resume exists", async () => {
    const user = await createUser({
      email: "resume-delete-test@example.com",
      password: "Password@123",
      name: "Resume Delete Test",
    });
    await createUserProfile(user.id, { resumeUrl: null });

    const loginResponse = await request
      .post("/api/auth/sign-in/email")
      .send({ email: user.email, password: "Password@123" });
    const cookie = loginResponse.headers["set-cookie"]?.[0] ?? "";

    const response = await request
      .delete("/api/users/me/resume")
      .set("Cookie", cookie);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
  });

  it("should return 401 when not authenticated", async () => {
    const response = await request.delete("/api/users/me/resume");

    expect(response.status).toBe(401);
  });
});
