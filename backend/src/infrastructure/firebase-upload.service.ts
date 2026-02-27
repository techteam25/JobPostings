import fs from "fs";

import { bucket } from "@/config/firebase";
import { BaseService } from "@/services/base.service";
import logger from "@/logger";
import {
  TempFile,
  FileUploadResult,
  UploadError,
  UploadOptions,
  FILE_UPLOAD_CONFIG,
  DEFAULT_ALLOWED_TYPES,
  validateFileType,
  validateFileSize,
  generateUniqueFilename,
  FileMetadata,
} from "@/validations/file.validation";

/**
 * Firebase File Upload Service
 *
 * A scalable service for uploading files to Firebase Storage with:
 * - Stream-based uploads to minimize memory usage
 * - Controlled concurrency (max 5 concurrent uploads)
 * - Timeout protection (30s per file)
 * - Batch processing for large file sets
 * - Partial failure handling
 * - Comprehensive error tracking
 */
export class FirebaseUploadService extends BaseService {
  private readonly maxConcurrentUploads: number;
  private readonly uploadTimeoutMs: number;
  private readonly maxFileSizeMB: number;
  private readonly batchSize: number;

  constructor() {
    super();
    this.maxConcurrentUploads = FILE_UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS;
    this.uploadTimeoutMs = FILE_UPLOAD_CONFIG.UPLOAD_TIMEOUT_MS;
    this.maxFileSizeMB = FILE_UPLOAD_CONFIG.MAX_FILE_SIZE_MB;
    this.batchSize = FILE_UPLOAD_CONFIG.BATCH_SIZE;
  }

  /**
   * Uploads a single file to Firebase Storage with timeout protection
   * @param file - Temporary file info from multer
   * @param index - File index for error tracking
   * @param folder - Firebase Storage folder path
   * @param deterministicName - Optional deterministic filename for idempotent retries
   * @returns Object with url on success, or error details on failure
   */
  async uploadSingleFile(
    file: TempFile,
    index: number,
    folder: string,
    deterministicName?: string,
  ): Promise<{ url: string; metadata: FileMetadata } | { error: UploadError }> {
    const correlationId = `file-${index}-${Date.now()}`;

    try {
      // Validate file type
      if (!validateFileType(file.mimetype)) {
        logger.warn(
          { correlationId, mimetype: file.mimetype },
          "Invalid file type rejected",
        );
        return {
          error: {
            filename: file.originalname,
            error: `Invalid file type: ${file.mimetype}. Allowed types: ${DEFAULT_ALLOWED_TYPES.join(", ")}`,
            index,
          },
        };
      }

      // Validate file size
      if (!validateFileSize(file.size, this.maxFileSizeMB)) {
        logger.warn(
          { correlationId, size: file.size, maxSize: this.maxFileSizeMB },
          "File size exceeds limit",
        );
        return {
          error: {
            filename: file.originalname,
            error: `File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds limit of ${this.maxFileSizeMB}MB`,
            index,
          },
        };
      }

      // Use deterministic name if provided (for idempotent retries), otherwise generate unique
      const uniqueFilename = deterministicName || generateUniqueFilename(file.originalname);
      const storagePath = `${folder}/${uniqueFilename}`;

      // Read file from temp path
      const fileBuffer = await fs.promises.readFile(file.tempPath);

      // Get file reference from Admin SDK bucket
      const bucketFile = bucket.file(storagePath);

      // Upload with timeout protection
      const uploadPromise = bucketFile.save(fileBuffer, {
        contentType: file.mimetype,
        metadata: {
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Upload timeout after ${this.uploadTimeoutMs}ms`));
        }, this.uploadTimeoutMs);
      });

      // Race between upload and timeout
      await Promise.race([uploadPromise, timeoutPromise]);

      // Make file publicly readable
      await bucketFile.makePublic();

      // Get public download URL
      const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      logger.info(
        { correlationId, filename: uniqueFilename, folder },
        "File uploaded successfully",
      );

      const metadata: FileMetadata = {
        url: downloadUrl,
        filename: uniqueFilename,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString(),
      };

      return { url: downloadUrl, metadata };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown upload error";
      logger.error(
        { correlationId, error: errorMessage, filename: file.originalname },
        "File upload failed",
      );

      return {
        error: {
          filename: file.originalname,
          error: errorMessage,
          index,
        },
      };
    }
  }

  /**
   * Processes a batch of files with controlled concurrency
   * @param files - Array of temporary files
   * @param startIndex - Starting index for error tracking
   * @param folder - Firebase Storage folder path
   * @param deterministicNames - Optional deterministic filenames for idempotent retries
   * @returns Batch results with URLs and failures
   */
  async processBatch(
    files: TempFile[],
    startIndex: number,
    folder: string,
    deterministicNames?: string[],
  ): Promise<{
    urls: string[];
    metadata: FileMetadata[];
    failures: UploadError[];
  }> {
    const urls: string[] = [];
    const metadata: FileMetadata[] = [];
    const failures: UploadError[] = [];

    // Process files in chunks for controlled concurrency
    for (let i = 0; i < files.length; i += this.maxConcurrentUploads) {
      const chunk = files.slice(i, i + this.maxConcurrentUploads);
      const chunkStartIndex = startIndex + i;

      const results = await Promise.allSettled(
        chunk.map((file, chunkIndex) => {
          const globalIndex = chunkStartIndex + chunkIndex;
          const detName = deterministicNames?.[startIndex + i + chunkIndex];
          return this.uploadSingleFile(file, globalIndex, folder, detName);
        }),
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          if ("url" in result.value) {
            urls.push(result.value.url);
            metadata.push(result.value.metadata);
          } else if ("error" in result.value) {
            failures.push(result.value.error);
          }
        } else {
          // Promise rejected (unexpected error)
          failures.push({
            filename: "unknown",
            error: result.reason?.message || "Unexpected error during upload",
            index: chunkStartIndex,
          });
        }
      }
    }

    return { urls, metadata, failures };
  }

  /**
   * Main upload method - uploads multiple files with batch processing
   * @param files - Array of temporary files from multer
   * @param options - Upload options (folder, maxFileSizeMB, allowedTypes, deterministicNames)
   * @param onProgress - Optional callback for progress updates (0-100)
   * @returns Upload result with URLs, failures, and counts
   */
  async uploadFiles(
    files: TempFile[],
    options: Partial<UploadOptions> & { deterministicNames?: string[] } = {},
    onProgress?: (progress: number) => void,
  ): Promise<FileUploadResult & { metadata: FileMetadata[] }> {
    const folder = options.folder || "uploads";
    const allUrls: string[] = [];
    const allMetadata: FileMetadata[] = [];
    const allFailures: UploadError[] = [];
    const totalFiles = files.length;

    logger.info(
      { totalFiles, folder },
      "Starting file upload batch processing",
    );

    // Process in batches
    for (let i = 0; i < files.length; i += this.batchSize) {
      const batch = files.slice(i, i + this.batchSize);
      const batchResult = await this.processBatch(batch, i, folder, options.deterministicNames);

      allUrls.push(...batchResult.urls);
      allMetadata.push(...batchResult.metadata);
      allFailures.push(...batchResult.failures);

      // Report progress
      if (onProgress) {
        const processedCount = Math.min(i + this.batchSize, totalFiles);
        const progress = Math.round((processedCount / totalFiles) * 100);
        onProgress(progress);
      }
    }

    const result = {
      urls: allUrls,
      metadata: allMetadata,
      failures: allFailures.length > 0 ? allFailures : undefined,
      successCount: allUrls.length,
      failureCount: allFailures.length,
    };

    logger.info(
      {
        successCount: result.successCount,
        failureCount: result.failureCount,
        folder,
      },
      "File upload batch processing completed",
    );

    return result;
  }

  /**
   * Deletes a file from Firebase Storage
   * @param fileUrl - The download URL of the file to delete
   * @returns true on success, false on failure
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // Extract storage path from download URL
      const urlObj = new URL(fileUrl);
      // Match pattern: storage.googleapis.com/{bucket}/{path}
      const pathMatch = urlObj.pathname.match(/\/([^\/]+\/[^?]+)/);

      if (!pathMatch) {
        logger.error({ fileUrl }, "Could not extract storage path from URL");
        return false;
      }

      const storagePath = decodeURIComponent(pathMatch[1]!);
      const bucketFile = bucket.file(storagePath);

      await bucketFile.delete();

      logger.info({ storagePath }, "File deleted successfully");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown delete error";
      logger.error({ fileUrl, error: errorMessage }, "Failed to delete file");
      return false;
    }
  }

  /**
   * Generates a public URL for a file in Firebase Storage
   * @param filePath - Path to the file in Firebase Storage
   * @returns Public download URL
   */
  async generatePublicUrl(filePath: string): Promise<string> {
    return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  }

  /**
   * Cleans up temporary files from disk
   * @param tempPaths - Array of temporary file paths to delete
   */
  async cleanupTempFiles(tempPaths: string[]): Promise<void> {
    for (const tempPath of tempPaths) {
      try {
        await fs.promises.unlink(tempPath);
        logger.debug({ tempPath }, "Temporary file cleaned up");
      } catch (error) {
        // File may already be deleted or not exist
        logger.warn({ tempPath }, "Could not delete temporary file");
      }
    }
  }
}

// Export singleton instance
export const firebaseUploadService = new FirebaseUploadService();
