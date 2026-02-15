import { z } from "@/swagger/registry";
import path from "path";
import crypto from "crypto";

/**
 * Allowed file types for upload validation
 */
export const allowedFileTypesSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type AllowedFileTypes = z.infer<typeof allowedFileTypesSchema>;

/**
 * File metadata stored in database JSON column
 */
export const fileMetadataSchema = z.object({
  url: z.url(),
  filename: z.string(),
  size: z.number().positive(),
  mimetype: z.string(),
  uploadedAt: z.iso.datetime(),
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

/**
 * Temporary file info from multer
 */
export const tempFileSchema = z.object({
  tempPath: z.string(),
  originalname: z.string(),
  size: z.number().positive(),
  mimetype: z.string(),
  fieldName: z.string().optional(),
});

export type TempFile = z.infer<typeof tempFileSchema>;

/**
 * Entity types that support file uploads
 */
export const entityTypeSchema = z.enum(["job", "organization", "user"]);
export type EntityType = z.infer<typeof entityTypeSchema>;

/**
 * Job data for file upload queue
 */
export const fileUploadJobDataSchema = z.object({
  tempFiles: z.array(tempFileSchema),
  entityId: z.string(),
  entityType: entityTypeSchema,
  userId: z.string(),
  folder: z.string(),
  mergeWithExisting: z.boolean().default(false),
  correlationId: z.string(),
});

export type FileUploadJobData = z.infer<typeof fileUploadJobDataSchema>;

/**
 * Upload error tracking
 */
export const uploadErrorSchema = z.object({
  filename: z.string(),
  error: z.string(),
  index: z.number().int().nonnegative(),
});

export type UploadError = z.infer<typeof uploadErrorSchema>;

/**
 * Result of file upload operation
 */
export const fileUploadResultSchema = z.object({
  urls: z.array(z.url()),
  failures: z.array(uploadErrorSchema).optional(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
});

export type FileUploadResult = z.infer<typeof fileUploadResultSchema>;

/**
 * Upload options configuration
 */
export const uploadOptionsSchema = z.object({
  folder: z.string().default("uploads"),
  maxFileSizeMB: z.number().positive().default(10),
  allowedTypes: z.array(allowedFileTypesSchema).optional(),
});

export type UploadOptions = z.infer<typeof uploadOptionsSchema>;

// ============================================================================
// Configuration Constants
// ============================================================================

export const FILE_UPLOAD_CONFIG = {
  MAX_CONCURRENT_UPLOADS: 5,
  UPLOAD_TIMEOUT_MS: 30000,
  MAX_FILE_SIZE_MB: 10,
  BATCH_SIZE: 10,
  TEMP_FILE_MAX_AGE_MS: 60 * 60 * 1000, // 1 hour
} as const;

export const DEFAULT_ALLOWED_TYPES: AllowedFileTypes[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates if the given mimetype is in the allowed types list
 * @param mimetype - The file's MIME type
 * @param allowedTypes - Array of allowed MIME types (defaults to DEFAULT_ALLOWED_TYPES)
 * @returns true if valid, false otherwise
 */
export function validateFileType(
  mimetype: string,
  allowedTypes: string[] = DEFAULT_ALLOWED_TYPES,
): boolean {
  return allowedTypes.includes(mimetype);
}

/**
 * Validates if the file size is within the allowed limit
 * @param sizeInBytes - File size in bytes
 * @param maxSizeMB - Maximum allowed size in megabytes (defaults to config value)
 * @returns true if valid, false otherwise
 */
export function validateFileSize(
  sizeInBytes: number,
  maxSizeMB: number = FILE_UPLOAD_CONFIG.MAX_FILE_SIZE_MB,
): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeInBytes > 0 && sizeInBytes <= maxSizeBytes;
}

/**
 * Sanitizes a filename by removing potentially dangerous characters
 * @param filename - Original filename
 * @returns Sanitized filename safe for storage
 */
export function sanitizeFilename(filename: string): string {
  // Get extension
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);

  // Remove or replace dangerous characters
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, "_") // Replace non-alphanumeric with underscore
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_|_$/g, "") // Trim leading/trailing underscores
    .substring(0, 100); // Limit length

  return sanitized + ext.toLowerCase();
}

/**
 * Generates a unique filename with timestamp and random suffix
 * @param originalName - Original filename
 * @returns Unique filename with format: timestamp-random-sanitizedname
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const sanitized = sanitizeFilename(originalName);

  return `${timestamp}-${randomSuffix}-${sanitized}`;
}

/**
 * Generates a correlation ID for tracking upload jobs
 * @returns Unique correlation ID
 */
export function generateCorrelationId(): string {
  return `upload-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

/**
 * Checks if a temp file is older than the max age
 * @param fileCreatedAt - File creation timestamp (ms)
 * @returns true if file should be cleaned up
 */
export function isExpiredTempFile(fileCreatedAt: number): boolean {
  return Date.now() - fileCreatedAt > FILE_UPLOAD_CONFIG.TEMP_FILE_MAX_AGE_MS;
}

/**
 * Extracts timestamp from a generated unique filename
 * @param filename - Filename generated by generateUniqueFilename
 * @returns Timestamp or null if not parseable
 */
export function extractTimestampFromFilename(filename: string): number | null {
  const match = filename.match(/^(\d+)-/);
  if (match && match[1]) {
    const timestamp = parseInt(match[1], 10);
    return isNaN(timestamp) ? null : timestamp;
  }
  return null;
}
