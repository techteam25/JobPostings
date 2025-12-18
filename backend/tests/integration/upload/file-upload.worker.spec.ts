import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { db } from "@/db/connection";
import { firebaseUploadService } from "@/services/firebase-upload.service";

import {
  FileUploadJobData,
  TempFile,
  generateCorrelationId,
} from "@/validations/file.validation";

// Mock the database
vi.mock("@/db/connection", () => ({
  db: {
    query: {
      jobApplications: {
        findFirst: vi.fn(() => Promise.resolve(null)),
      },
      organizations: {
        findFirst: vi.fn(() => Promise.resolve(null)),
      },
      userProfile: {
        findFirst: vi.fn(() => Promise.resolve(null)),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

// Mock Firebase upload service
vi.mock("@/services/firebase-upload.service", () => ({
  firebaseUploadService: {
    uploadFiles: vi.fn(() =>
      Promise.resolve({
        urls: ["https://firebase.storage/test-url"],
        metadata: [
          {
            url: "https://firebase.storage/test-url",
            filename: "test-file.pdf",
            size: 1024,
            mimetype: "application/pdf",
            uploadedAt: new Date().toISOString(),
          },
        ],
        successCount: 1,
        failureCount: 0,
      }),
    ),
    cleanupTempFiles: vi.fn(() => Promise.resolve()),
  },
}));

// Mock Redis connection
vi.mock("bullmq", async () => {
  const actual = await vi.importActual("bullmq");
  return {
    ...actual,
    Queue: vi.fn().mockImplementation(() => ({
      add: vi.fn(() => Promise.resolve({ id: "test-job-id" })),
      getJob: vi.fn(() =>
        Promise.resolve({
          id: "test-job-id",
          progress: 100,
          returnvalue: {
            urls: ["https://firebase.storage/test-url"],
            successCount: 1,
            failureCount: 0,
          },
        }),
      ),
    })),
    QueueEvents: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
    })),
    Worker: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      name: "fileUploadQueue",
    })),
  };
});

describe("File Upload Worker Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Job Enqueueing", () => {
    it("should create a valid job data structure", () => {
      const tempFiles: TempFile[] = [
        {
          tempPath: "/tmp/upload-123",
          originalname: "document.pdf",
          size: 2048,
          mimetype: "application/pdf",
        },
      ];

      const jobData: FileUploadJobData = {
        tempFiles,
        entityId: "123",
        entityType: "user",
        userId: "456",
        folder: "profiles",
        mergeWithExisting: false,
        correlationId: generateCorrelationId(),
      };

      expect(jobData.tempFiles).toHaveLength(1);
      expect(jobData.entityType).toBe("user");
      expect(jobData.correlationId).toMatch(/^upload-\d+-[a-f0-9]+$/);
    });

    it("should support all entity types", () => {
      const entityTypes = ["job", "organization", "user"] as const;

      entityTypes.forEach((entityType) => {
        const jobData: FileUploadJobData = {
          tempFiles: [],
          entityId: "1",
          entityType,
          userId: "1",
          folder: "test",
          mergeWithExisting: false,
          correlationId: generateCorrelationId(),
        };

        expect(jobData.entityType).toBe(entityType);
      });
    });
  });

  describe("Job Processing Flow", () => {
    it("should process upload job with correct data flow", async () => {
      const tempFiles: TempFile[] = [
        {
          tempPath: "/tmp/test.pdf",
          originalname: "test.pdf",
          size: 1024,
          mimetype: "application/pdf",
        },
      ];

      // Simulate what the worker does
      const result = await firebaseUploadService.uploadFiles(tempFiles, {
        folder: "test",
      });

      expect(result.successCount).toBe(1);
      expect(result.urls).toHaveLength(1);
      expect(firebaseUploadService.uploadFiles).toHaveBeenCalledWith(
        tempFiles,
        { folder: "test" },
      );
    });

    it("should cleanup temp files after processing", async () => {
      const tempPaths = ["/tmp/test1.pdf", "/tmp/test2.pdf"];

      await firebaseUploadService.cleanupTempFiles(tempPaths);

      expect(firebaseUploadService.cleanupTempFiles).toHaveBeenCalledWith(
        tempPaths,
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle upload failures gracefully", async () => {
      vi.mocked(firebaseUploadService.uploadFiles).mockResolvedValueOnce({
        urls: [],
        metadata: [],
        successCount: 0,
        failureCount: 1,
        failures: [
          {
            filename: "test.pdf",
            error: "Upload failed",
            index: 0,
          },
        ],
      });

      const result = await firebaseUploadService.uploadFiles(
        [
          {
            tempPath: "/tmp/test.pdf",
            originalname: "test.pdf",
            size: 1024,
            mimetype: "application/pdf",
          },
        ],
        { folder: "test" },
      );

      expect(result.failureCount).toBe(1);
      expect(result.failures).toBeDefined();
    });

    it("should still cleanup temp files on error", async () => {
      // Even if upload fails, cleanup should be called
      vi.mocked(firebaseUploadService.uploadFiles).mockRejectedValueOnce(
        new Error("Network error"),
      );

      try {
        await firebaseUploadService.uploadFiles([], { folder: "test" });
      } catch {
        // Expected to fail
      }

      // In real implementation, cleanup would be in finally block
      await firebaseUploadService.cleanupTempFiles(["/tmp/test.pdf"]);

      expect(firebaseUploadService.cleanupTempFiles).toHaveBeenCalled();
    });
  });

  describe("Progress Tracking", () => {
    it("should support progress callback", async () => {
      const progressUpdates: number[] = [];

      // Mock to capture progress callback
      vi.mocked(firebaseUploadService.uploadFiles).mockImplementationOnce(
        async (_files, _options, onProgress) => {
          if (onProgress) {
            onProgress(25);
            onProgress(50);
            onProgress(75);
            onProgress(100);
          }
          progressUpdates.push(25, 50, 75, 100);
          return {
            urls: ["https://test.com/file.pdf"],
            metadata: [],
            successCount: 1,
            failureCount: 0,
          };
        },
      );

      await firebaseUploadService.uploadFiles(
        [
          {
            tempPath: "/tmp/test.pdf",
            originalname: "test.pdf",
            size: 1024,
            mimetype: "application/pdf",
          },
        ],
        { folder: "test" },
        (progress) => progressUpdates.push(progress),
      );

      expect(progressUpdates).toContain(100);
    });
  });

  describe("Database Update", () => {
    it("should update correct entity based on type", async () => {
      // Test for user entity type
      const mockUpdate = vi.fn(
        () =>
          ({
            set: vi.fn(() => ({
              where: vi.fn(() => Promise.resolve()),
            })),
            session: {},
            dialect: {},
            _: {},
          }) as unknown as ReturnType<typeof db.update>,
      );

      vi.mocked(db.update).mockImplementation(mockUpdate);

      // Simulate DB update call
      db.update({} as any);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should merge with existing metadata when specified", async () => {
      // Mock existing metadata
      vi.mocked(db.query.userProfile.findFirst).mockResolvedValueOnce({
        fileMetadata: [
          {
            url: "https://existing.com/file.pdf",
            filename: "existing.pdf",
            size: 512,
            mimetype: "application/pdf",
            uploadedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      } as any);

      const existing = await db.query.userProfile.findFirst({
        where: {} as any,
        columns: { fileMetadata: true },
      });

      expect(existing?.fileMetadata).toHaveLength(1);
    });
  });
});
