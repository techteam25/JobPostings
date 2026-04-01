import logger from "@shared/logger";
import { Job as BullMqJob } from "bullmq";
import { firebaseUploadService } from "@shared/infrastructure/firebase-upload.service";
import { CacheService } from "@shared/infrastructure/cache.service";
import {
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

function createFileUploadHandler(deps: FileUploadWorkerDeps) {
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

    try {
      await job.updateProgress(0);

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
      await firebaseUploadService.cleanupTempFiles(tempPaths);
      logger.debug({ correlationId }, "Temp files cleaned up");
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

      logger.info("File upload worker initialized");
    },

    async scheduleJobs() {
      // File upload worker has no scheduled jobs — jobs are enqueued on demand
    },
  };
}
