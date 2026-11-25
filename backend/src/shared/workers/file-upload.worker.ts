import logger from "@shared/logger";
import { Job as BullMqJob } from "bullmq";
import { firebaseUploadService } from "@shared/infrastructure/firebase-upload.service";
import { CacheService } from "@shared/infrastructure/cache.service";
import {
  fileDeleteTotal,
  fileUploadBytes,
  fileUploadTotal,
} from "@shared/metrics";
import {
  FileDeleteJobData,
  FileUploadJobData,
  FileUploadResult,
  sanitizeFilename,
} from "@/validations/file.validation";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { FileMetadataUpdatePort } from "@shared/ports/file-metadata-update.port";
import type { ModuleWorkers } from "@shared/types/module-workers";

interface FileUploadWorkerDeps {
  fileMetadataUpdate: FileMetadataUpdatePort;
}

export function createFileUploadHandler(deps: FileUploadWorkerDeps) {
  return async function processFileUploadJob(
    job: BullMqJob<FileUploadJobData>,
  ) {
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
    let completed = false;

    try {
      await job.updateProgress(0);

      // Record size histogram per file at job start — captures all files
      // regardless of per-file outcome.
      for (const f of tempFiles) {
        fileUploadBytes.record(f.size, { category: folder });
      }

      const deterministicNames = tempFiles.map(
        (f, index) => `${job.id}-${index}-${sanitizeFilename(f.originalname)}`,
      );

      const result = await firebaseUploadService.uploadFiles(
        tempFiles,
        { folder, deterministicNames },
        async (progress) => {
          await job.updateProgress(progress);
        },
      );

      // A single-file profile upload can fail without uploadFiles throwing.
      // Retry it through BullMQ while the temp file is still available.
      if (result.failureCount > 0 && result.successCount === 0) {
        throw new Error("File upload failed");
      }

      fileUploadTotal.add(result.successCount, {
        category: folder,
        outcome: "success",
      });
      if (result.failureCount > 0) {
        fileUploadTotal.add(result.failureCount, {
          category: folder,
          outcome: "failure",
        });
      }

      await job.updateProgress(90);

      if (result.metadata.length > 0) {
        await deps.fileMetadataUpdate.updateEntityFileMetadata(
          entityType,
          entityId,
          result.urls,
          result.metadata,
          mergeWithExisting,
          tempFiles,
        );

        // Invalidate relevant caches now that the DB is updated
        const cachePatterns: Record<string, string> = {
          user: "users/me",
          organization: `organizations/${entityId}`,
        };
        const pattern = cachePatterns[entityType];
        if (pattern) {
          await CacheService.invalidate(pattern);
          logger.debug(
            { correlationId, pattern },
            "Cache invalidated after file upload",
          );
        }
      }

      await job.updateProgress(100);

      logger.info(
        {
          correlationId,
          successCount: result.successCount,
          failureCount: result.failureCount,
        },
        "File upload job completed",
      );

      completed = true;
      return {
        urls: result.urls,
        successCount: result.successCount,
        failureCount: result.failureCount,
        failures: result.failures,
      };
    } catch (error) {
      // Entire job threw (not a per-file failure handled above).
      // Count all files in the job as failures so the counter stays honest.
      fileUploadTotal.add(tempFiles.length, {
        category: folder,
        outcome: "failure",
      });
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { correlationId, error: errorMessage },
        "File upload job failed",
      );
      throw error;
    } finally {
      const attempts = Math.max(1, job.opts.attempts ?? 1);
      if (completed || job.attemptsMade + 1 >= attempts) {
        try {
          await firebaseUploadService.cleanupTempFiles(tempPaths);
          logger.debug({ correlationId }, "Temp files cleaned up");
        } catch (cleanupError) {
          logger.error(
            { correlationId, error: cleanupError },
            "Unable to clean up upload temp files",
          );
        }
      } else {
        logger.debug(
          { correlationId, attemptsMade: job.attemptsMade + 1, attempts },
          "Retaining temp files for upload retry",
        );
      }
    }
  };
}

function createFileDeleteHandler() {
  return async function processFileDeleteJob(
    job: BullMqJob<FileDeleteJobData>,
  ) {
    const { fileUrl, entityType, entityId, correlationId } = job.data;

    logger.info(
      { correlationId, entityType, entityId, fileUrl },
      "Starting file delete job",
    );

    try {
      const deleted = await firebaseUploadService.deleteFile(fileUrl);

      if (deleted) {
        fileDeleteTotal.add(1, {
          entity_type: entityType,
          outcome: "success",
        });
        logger.info(
          { correlationId, fileUrl },
          "File deleted from storage successfully",
        );
      } else {
        // Distinguish "not found in storage" from hard failures — useful
        // when chasing orphaned DB pointers vs. Firebase outages.
        fileDeleteTotal.add(1, {
          entity_type: entityType,
          outcome: "missing",
        });
        logger.warn(
          { correlationId, fileUrl },
          "File delete returned false — file may not exist in storage",
        );
      }

      return { deleted };
    } catch (error) {
      fileDeleteTotal.add(1, {
        entity_type: entityType,
        outcome: "failure",
      });
      throw error;
    }
  };
}

export function createFileUploadWorker(
  deps: FileUploadWorkerDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<
        FileUploadJobData & { correlationId: string },
        FileUploadResult
      >(QUEUE_NAMES.FILE_UPLOAD_QUEUE, createFileUploadHandler(deps), {
        concurrency: 3,
        limiter: {
          max: 15,
          duration: 60000,
        },
      });

      queueService.registerWorker<FileDeleteJobData, { deleted: boolean }>(
        QUEUE_NAMES.FILE_DELETE_QUEUE,
        createFileDeleteHandler(),
        {
          concurrency: 3,
        },
      );

      logger.info("File upload and delete workers initialized");
    },

    async scheduleJobs() {
      // File workers have no scheduled jobs — jobs are enqueued on demand
    },
  };
}
