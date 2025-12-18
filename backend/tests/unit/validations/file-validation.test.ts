import { describe, it, expect } from "vitest";

import {
  validateFileType,
  validateFileSize,
  sanitizeFilename,
  generateUniqueFilename,
  generateCorrelationId,
  isExpiredTempFile,
  extractTimestampFromFilename,
  DEFAULT_ALLOWED_TYPES,
  FILE_UPLOAD_CONFIG,
  fileMetadataSchema,
  tempFileSchema,
  fileUploadJobDataSchema,
} from "@/validations/file.validation";

describe("file.validation", () => {
  describe("validateFileType", () => {
    it("should return true for allowed image types", () => {
      expect(validateFileType("image/jpeg")).toBe(true);
      expect(validateFileType("image/png")).toBe(true);
      expect(validateFileType("image/gif")).toBe(true);
      expect(validateFileType("image/webp")).toBe(true);
    });

    it("should return true for allowed document types", () => {
      expect(validateFileType("application/pdf")).toBe(true);
      expect(validateFileType("application/msword")).toBe(true);
      expect(
        validateFileType(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      ).toBe(true);
    });

    it("should return false for disallowed types", () => {
      expect(validateFileType("text/plain")).toBe(false);
      expect(validateFileType("application/javascript")).toBe(false);
      expect(validateFileType("video/mp4")).toBe(false);
      expect(validateFileType("application/x-executable")).toBe(false);
    });

    it("should validate against custom allowed types", () => {
      const customTypes = ["text/plain", "text/csv"];
      expect(validateFileType("text/plain", customTypes)).toBe(true);
      expect(validateFileType("text/csv", customTypes)).toBe(true);
      expect(validateFileType("image/jpeg", customTypes)).toBe(false);
    });
  });

  describe("validateFileSize", () => {
    it("should return true for files within size limit", () => {
      const fiveMB = 5 * 1024 * 1024;
      expect(validateFileSize(fiveMB)).toBe(true);
    });

    it("should return true for files exactly at limit", () => {
      const tenMB = FILE_UPLOAD_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
      expect(validateFileSize(tenMB)).toBe(true);
    });

    it("should return false for files exceeding limit", () => {
      const elevenMB = 11 * 1024 * 1024;
      expect(validateFileSize(elevenMB)).toBe(false);
    });

    it("should return false for zero or negative size", () => {
      expect(validateFileSize(0)).toBe(false);
      expect(validateFileSize(-100)).toBe(false);
    });

    it("should validate against custom size limit", () => {
      const twoMB = 2 * 1024 * 1024;
      const threeMB = 3 * 1024 * 1024;
      expect(validateFileSize(twoMB, 5)).toBe(true);
      expect(validateFileSize(threeMB, 2)).toBe(false);
    });
  });

  describe("sanitizeFilename", () => {
    it("should keep alphanumeric characters and dashes", () => {
      expect(sanitizeFilename("my-file-123.pdf")).toBe("my-file-123.pdf");
    });

    it("should replace special characters with underscores", () => {
      expect(sanitizeFilename("my file@2024!.pdf")).toBe("my_file_2024_.pdf");
    });

    it("should collapse multiple underscores", () => {
      expect(sanitizeFilename("my___file.pdf")).toBe("my_file.pdf");
    });

    it("should trim leading/trailing underscores", () => {
      expect(sanitizeFilename("__myfile__.pdf")).toBe("myfile.pdf");
    });

    it("should preserve file extension in lowercase", () => {
      expect(sanitizeFilename("MyFile.PDF")).toBe("MyFile.pdf");
      expect(sanitizeFilename("Document.DOCX")).toBe("Document.docx");
    });

    it("should limit filename length to 100 characters", () => {
      const longName = "a".repeat(150) + ".pdf";
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(104); // 100 + .pdf
    });
  });

  describe("generateUniqueFilename", () => {
    it("should generate filename with timestamp prefix", () => {
      const result = generateUniqueFilename("test.pdf");
      expect(result).toMatch(/^\d+-[a-f0-9]+-test\.pdf$/);
    });

    it("should generate unique filenames for same input", () => {
      const result1 = generateUniqueFilename("test.pdf");
      const result2 = generateUniqueFilename("test.pdf");
      expect(result1).not.toBe(result2);
    });

    it("should sanitize the original filename", () => {
      const result = generateUniqueFilename("my file@2024.pdf");
      expect(result).toMatch(/^\d+-[a-f0-9]+-my_file_2024_\.pdf$/);
    });
  });

  describe("generateCorrelationId", () => {
    it("should generate correlation ID with upload prefix", () => {
      const result = generateCorrelationId();
      expect(result).toMatch(/^upload-\d+-[a-f0-9]+$/);
    });

    it("should generate unique IDs", () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("isExpiredTempFile", () => {
    it("should return true for files older than max age", () => {
      const oldTimestamp =
        Date.now() - FILE_UPLOAD_CONFIG.TEMP_FILE_MAX_AGE_MS - 1000;
      expect(isExpiredTempFile(oldTimestamp)).toBe(true);
    });

    it("should return false for recent files", () => {
      const recentTimestamp = Date.now() - 1000; // 1 second ago
      expect(isExpiredTempFile(recentTimestamp)).toBe(false);
    });

    it("should return false for files exactly at max age", () => {
      const exactTimestamp =
        Date.now() - FILE_UPLOAD_CONFIG.TEMP_FILE_MAX_AGE_MS;
      expect(isExpiredTempFile(exactTimestamp)).toBe(false);
    });
  });

  describe("extractTimestampFromFilename", () => {
    it("should extract timestamp from valid filename", () => {
      const timestamp = Date.now();
      const filename = `${timestamp}-abc123-test.pdf`;
      expect(extractTimestampFromFilename(filename)).toBe(timestamp);
    });

    it("should return null for filename without timestamp", () => {
      expect(extractTimestampFromFilename("test.pdf")).toBeNull();
      expect(extractTimestampFromFilename("abc-test.pdf")).toBeNull();
    });

    it("should return null for invalid timestamp format", () => {
      expect(extractTimestampFromFilename("-test.pdf")).toBeNull();
    });
  });

  describe("Zod schemas", () => {
    describe("fileMetadataSchema", () => {
      it("should validate valid file metadata", () => {
        const validMetadata = {
          url: "https://example.com/file.pdf",
          filename: "test.pdf",
          size: 1024,
          mimetype: "application/pdf",
          uploadedAt: new Date().toISOString(),
        };
        expect(() => fileMetadataSchema.parse(validMetadata)).not.toThrow();
      });

      it("should reject invalid URL", () => {
        const invalidMetadata = {
          url: "not-a-url",
          filename: "test.pdf",
          size: 1024,
          mimetype: "application/pdf",
          uploadedAt: new Date().toISOString(),
        };
        expect(() => fileMetadataSchema.parse(invalidMetadata)).toThrow();
      });

      it("should reject negative size", () => {
        const invalidMetadata = {
          url: "https://example.com/file.pdf",
          filename: "test.pdf",
          size: -100,
          mimetype: "application/pdf",
          uploadedAt: new Date().toISOString(),
        };
        expect(() => fileMetadataSchema.parse(invalidMetadata)).toThrow();
      });
    });

    describe("tempFileSchema", () => {
      it("should validate valid temp file info", () => {
        const validTempFile = {
          tempPath: "/tmp/upload-123",
          originalname: "document.pdf",
          size: 2048,
          mimetype: "application/pdf",
        };
        expect(() => tempFileSchema.parse(validTempFile)).not.toThrow();
      });
    });

    describe("fileUploadJobDataSchema", () => {
      it("should validate valid job data", () => {
        const validJobData = {
          tempFiles: [
            {
              tempPath: "/tmp/upload-123",
              originalname: "document.pdf",
              size: 2048,
              mimetype: "application/pdf",
            },
          ],
          entityId: "123",
          entityType: "user",
          userId: "456",
          folder: "profiles",
          mergeWithExisting: false,
          correlationId: "upload-123-abc",
        };
        expect(() => fileUploadJobDataSchema.parse(validJobData)).not.toThrow();
      });

      it("should reject invalid entity type", () => {
        const invalidJobData = {
          tempFiles: [],
          entityId: "123",
          entityType: "invalid",
          userId: "456",
          folder: "profiles",
          correlationId: "upload-123",
        };
        expect(() => fileUploadJobDataSchema.parse(invalidJobData)).toThrow();
      });
    });
  });

  describe("DEFAULT_ALLOWED_TYPES", () => {
    it("should contain expected image types", () => {
      expect(DEFAULT_ALLOWED_TYPES).toContain("image/jpeg");
      expect(DEFAULT_ALLOWED_TYPES).toContain("image/png");
      expect(DEFAULT_ALLOWED_TYPES).toContain("image/gif");
      expect(DEFAULT_ALLOWED_TYPES).toContain("image/webp");
    });

    it("should contain expected document types", () => {
      expect(DEFAULT_ALLOWED_TYPES).toContain("application/pdf");
      expect(DEFAULT_ALLOWED_TYPES).toContain("application/msword");
      expect(DEFAULT_ALLOWED_TYPES).toContain(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    });
  });

  describe("FILE_UPLOAD_CONFIG", () => {
    it("should have expected default values", () => {
      expect(FILE_UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS).toBe(5);
      expect(FILE_UPLOAD_CONFIG.UPLOAD_TIMEOUT_MS).toBe(30000);
      expect(FILE_UPLOAD_CONFIG.MAX_FILE_SIZE_MB).toBe(10);
      expect(FILE_UPLOAD_CONFIG.BATCH_SIZE).toBe(10);
      expect(FILE_UPLOAD_CONFIG.TEMP_FILE_MAX_AGE_MS).toBe(60 * 60 * 1000);
    });
  });
});
