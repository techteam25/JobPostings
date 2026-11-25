import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Job } from "bullmq";

import { createFileUploadHandler } from "@shared/workers/file-upload.worker";
import { firebaseUploadService } from "@shared/infrastructure/firebase-upload.service";
import type { FileUploadJobData } from "@/validations/file.validation";

vi.mock("@shared/infrastructure/firebase-upload.service", () => ({
  firebaseUploadService: {
    uploadFiles: vi.fn(),
    cleanupTempFiles: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("@shared/infrastructure/cache.service", () => ({
  CacheService: { invalidate: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@shared/metrics", () => ({
  fileDeleteTotal: { add: vi.fn() },
  fileUploadBytes: { record: vi.fn() },
  fileUploadTotal: { add: vi.fn() },
}));

function makeJob(attemptsMade: number) {
  return {
    id: "upload-1",
    data: {
      tempFiles: [
        {
          tempPath: "test-temp.pdf",
          originalname: "resume.pdf",
          size: 100,
          mimetype: "application/pdf",
        },
      ],
      entityId: "1",
      entityType: "user",
      userId: "2",
      folder: "resumes",
      mergeWithExisting: true,
      correlationId: "test-correlation",
    },
    opts: { attempts: 3 },
    attemptsMade,
    updateProgress: vi.fn().mockResolvedValue(undefined),
  } as unknown as Job<FileUploadJobData>;
}

const deps = {
  fileMetadataUpdate: {
    updateEntityFileMetadata: vi.fn().mockResolvedValue(undefined),
  },
};

describe("file upload worker temp files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retains the file after a retryable failure", async () => {
    vi.mocked(firebaseUploadService.uploadFiles).mockRejectedValueOnce(
      new Error("Storage unavailable"),
    );

    await expect(createFileUploadHandler(deps)(makeJob(0))).rejects.toThrow(
      "Storage unavailable",
    );
    expect(firebaseUploadService.cleanupTempFiles).not.toHaveBeenCalled();
  });

  it("cleans the file after the final failed attempt", async () => {
    vi.mocked(firebaseUploadService.uploadFiles).mockRejectedValueOnce(
      new Error("Storage unavailable"),
    );

    await expect(createFileUploadHandler(deps)(makeJob(2))).rejects.toThrow(
      "Storage unavailable",
    );
    expect(firebaseUploadService.cleanupTempFiles).toHaveBeenCalledWith([
      "test-temp.pdf",
    ]);
  });

  it("retries a storage result where the only file failed", async () => {
    vi.mocked(firebaseUploadService.uploadFiles).mockResolvedValueOnce({
      urls: [],
      metadata: [],
      successCount: 0,
      failureCount: 1,
      failures: [{ filename: "resume.pdf", error: "Storage failed", index: 0 }],
    });

    await expect(createFileUploadHandler(deps)(makeJob(0))).rejects.toThrow(
      "File upload failed",
    );
    expect(firebaseUploadService.cleanupTempFiles).not.toHaveBeenCalled();
    expect(
      deps.fileMetadataUpdate.updateEntityFileMetadata,
    ).not.toHaveBeenCalled();
  });

  it("cleans the file after a completed upload", async () => {
    vi.mocked(firebaseUploadService.uploadFiles).mockResolvedValueOnce({
      urls: ["https://storage.example/resume.pdf"],
      metadata: [
        {
          url: "https://storage.example/resume.pdf",
          filename: "resume.pdf",
          size: 100,
          mimetype: "application/pdf",
          uploadedAt: new Date().toISOString(),
        },
      ],
      successCount: 1,
      failureCount: 0,
    });

    await createFileUploadHandler(deps)(makeJob(0));

    expect(deps.fileMetadataUpdate.updateEntityFileMetadata).toHaveBeenCalled();
    expect(firebaseUploadService.cleanupTempFiles).toHaveBeenCalledWith([
      "test-temp.pdf",
    ]);
  });

  it("keeps the upload successful if temp cleanup itself fails", async () => {
    vi.mocked(firebaseUploadService.uploadFiles).mockResolvedValueOnce({
      urls: ["https://storage.example/resume.pdf"],
      metadata: [
        {
          url: "https://storage.example/resume.pdf",
          filename: "resume.pdf",
          size: 100,
          mimetype: "application/pdf",
          uploadedAt: new Date().toISOString(),
        },
      ],
      successCount: 1,
      failureCount: 0,
    });
    vi.mocked(firebaseUploadService.cleanupTempFiles).mockRejectedValueOnce(
      new Error("Disk cleanup failed"),
    );

    await expect(
      createFileUploadHandler(deps)(makeJob(0)),
    ).resolves.toMatchObject({
      successCount: 1,
    });
  });
});
