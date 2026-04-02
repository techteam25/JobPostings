import path from "path";
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

const TEST_IMAGE_PATH = path.resolve(
  __dirname,
  "../../../../fixtures/test-image.png",
);

async function seedAndLogin() {
  const user = await createUser({
    email: "picture-test@example.com",
    password: "Password@123",
    name: "Picture Test",
  });
  const profile = await createUserProfile(user.id);

  const loginResponse = await request
    .post("/api/auth/sign-in/email")
    .send({ email: user.email, password: "Password@123" });

  const cookie = loginResponse.headers["set-cookie"]?.[0] ?? "";

  return { user, profile, cookie };
}

describe("Profile Picture Upload - POST /api/users/me/profile-picture", () => {
  let cookie: string;
  let profileId: number;

  beforeEach(async () => {
    vi.mocked(queueService.addJob).mockClear();
    const result = await seedAndLogin();
    cookie = result.cookie;
    profileId = result.profile.id;
  });

  it("should accept a valid image upload and return 200", async () => {
    const response = await request
      .post("/api/users/me/profile-picture")
      .set("Cookie", cookie)
      .attach("profilePicture", TEST_IMAGE_PATH);

    TestHelpers.validateApiResponse(response, 200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.data).toHaveProperty(
      "message",
      "Profile picture upload initiated",
    );
  });

  it("should enqueue a FILE_UPLOAD_QUEUE job with correct payload", async () => {
    await request
      .post("/api/users/me/profile-picture")
      .set("Cookie", cookie)
      .attach("profilePicture", TEST_IMAGE_PATH);

    expect(queueService.addJob).toHaveBeenCalledTimes(1);
    expect(queueService.addJob).toHaveBeenCalledWith(
      "fileUploadQueue",
      "uploadFile",
      expect.objectContaining({
        entityType: "user",
        entityId: String(profileId),
        folder: "profile-pictures",
        mergeWithExisting: true,
        tempFiles: expect.arrayContaining([
          expect.objectContaining({
            originalname: "test-image.png",
            mimetype: "image/png",
          }),
        ]),
      }),
    );
  });

  it("should return 400 when no file is attached", async () => {
    const response = await request
      .post("/api/users/me/profile-picture")
      .set("Cookie", cookie);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("success", false);
  });

  it("should return 401 when not authenticated", async () => {
    const response = await request
      .post("/api/users/me/profile-picture")
      .attach("profilePicture", TEST_IMAGE_PATH);

    expect(response.status).toBe(401);
  });

  it("should reject non-image files", async () => {
    const textFilePath = path.resolve(
      __dirname,
      "../../../../fixtures/test-file.txt",
    );
    // Create a temporary text file for this test
    const fs = await import("fs/promises");
    await fs.writeFile(textFilePath, "not an image");

    try {
      const response = await request
        .post("/api/users/me/profile-picture")
        .set("Cookie", cookie)
        .attach("profilePicture", textFilePath);

      // Multer fileFilter rejects non-image types with an error.
      // The file is rejected and does not reach the controller.
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).not.toBe(true);
    } finally {
      await fs.unlink(textFilePath).catch(() => {});
    }
  });
});
