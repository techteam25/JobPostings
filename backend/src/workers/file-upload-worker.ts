import logger from "@/logger";
import { Job as BullMqJob } from "bullmq";

import { db } from "@/db/connection";
import { eq } from "drizzle-orm";
import { firebaseUploadService } from "@/infrastructure/firebase-upload.service";
import { jobApplications, organizations, userProfile } from "@/db/schema";

import {
  FileMetadata,
  FileUploadJobData,
  FileUploadResult,
} from "@/validations/file.validation";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

export enum StorageFolder {
  PROFILE_PICTURES = "profile-pictures",
  ORGANIZATION_LOGOS = "organization-logos",
  JOB_ATTACHMENTS = "job-attachments",
  RESUMES = "resumes",
}

/** * Update file metadata for the specified entity
 *
 * @param entityType Can be one of 'job', 'organization', or 'user'
 * @param entityId The ID of the entity to update. Either job application ID, organization ID, or user ID
 * @param urls The URLs of the uploaded files
 * @param metadata The metadata of the uploaded files
 * @param mergeWithExisting Whether to merge with existing metadata or replace it
 */
async function updateEntityFileMetadata(
  entityType: FileUploadJobData["entityType"],
  entityId: string,
  urls: string[],
  metadata: FileMetadata[],
  mergeWithExisting: boolean,
): Promise<void> {
  const id = parseInt(entityId, 10);

  switch (entityType) {
    case "job": {
      if (mergeWithExisting) {
        const existing = await db.query.jobApplications.findFirst({
          where: eq(jobApplications.id, id),
          columns: { fileMetadata: true },
        });
        const existingMetadata =
          (existing?.fileMetadata as FileMetadata[]) || [];
        metadata = [...existingMetadata, ...metadata];
      }
      await db
        .update(jobApplications)
        .set({ fileMetadata: metadata, resumeUrl: urls[0] || null })
        .where(eq(jobApplications.id, id));
      break;
    }
    case "organization": {
      if (mergeWithExisting) {
        const existing = await db.query.organizations.findFirst({
          where: eq(organizations.id, id),
          columns: { fileMetadata: true },
        });
        const existingMetadata =
          (existing?.fileMetadata as FileMetadata[]) || [];
        metadata = [...existingMetadata, ...metadata];
      }
      await db
        .update(organizations)
        .set({ fileMetadata: metadata, logoUrl: urls[0] || null })
        .where(eq(organizations.id, id));
      break;
    }
    case "user": {
      if (mergeWithExisting) {
        const existing = await db.query.userProfile.findFirst({
          where: eq(userProfile.id, id),
          columns: { fileMetadata: true },
        });
        const existingMetadata =
          (existing?.fileMetadata as FileMetadata[]) || [];
        metadata = [...existingMetadata, ...metadata];
      }
      await db
        .update(userProfile)
        .set({ fileMetadata: metadata })
        .where(eq(userProfile.id, id));
      break;
    }
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/** * Process a file upload job
 * @param job The BullMQ job object
 * @returns The result of the file upload
 */
export async function processFileUploadJob(job: BullMqJob<FileUploadJobData>) {
  const {
    tempFiles,
    entityId,
    entityType,
    folder,
    mergeWithExisting,
    correlationId,
  } = job.data;

  logger.info(
    { correlationId, entityType, entityId, fileCount: tempFiles.length },
    "Starting file upload job",
  );

  const tempPaths = tempFiles.map((f) => f.tempPath);

  try {
    // Update progress: starting
    await job.updateProgress(0);

    // Upload files to Firebase
    const result = await firebaseUploadService.uploadFiles(
      tempFiles,
      { folder },
      async (progress) => {
        await job.updateProgress(progress);
      },
    );

    // Update progress: uploads complete
    await job.updateProgress(90);

    // Update database with file metadata
    if (result.metadata.length > 0) {
      await updateEntityFileMetadata(
        entityType,
        entityId,
        result.urls,
        result.metadata,
        mergeWithExisting,
      );
    }

    // Update progress: complete
    await job.updateProgress(100);

    logger.info(
      {
        correlationId,
        successCount: result.successCount,
        failureCount: result.failureCount,
      },
      "File upload job completed",
    );

    // Return result for job completion tracking
    return {
      urls: result.urls,
      successCount: result.successCount,
      failureCount: result.failureCount,
      failures: result.failures,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { correlationId, error: errorMessage },
      "File upload job failed",
    );
    throw error;
  } finally {
    // Always cleanup temp files
    await firebaseUploadService.cleanupTempFiles(tempPaths);
    logger.debug({ correlationId }, "Temp files cleaned up");
  }
}

/**
 * Initialize File Upload worker
 */
export function initializeFileUploadWorker(): void {
  queueService.registerWorker<
    FileUploadJobData & { correlationId: string },
    FileUploadResult
  >(QUEUE_NAMES.FILE_UPLOAD_QUEUE, processFileUploadJob, {
    concurrency: 3, // Process 2-3 upload jobs simultaneously
    limiter: {
      max: 15, // Max 15 jobs
      duration: 60000, // Per minute
    },
  });

  logger.info("File upload initialized");
}
