import path from "path";
import fs from "fs";
import logger from "@shared/logger";
import { Job as BullMqJob } from "bullmq";
import {
  extractTimestampFromFilename,
  isExpiredTempFile,
} from "@/validations/file.validation";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { ModuleWorkers } from "@shared/types/module-workers";

async function tempFileCleanupHandler(_job: BullMqJob) {
  const uploadsDir = path.resolve("uploads");

  logger.info("Starting temp file cleanup job");

  try {
    if (!fs.existsSync(uploadsDir)) {
      logger.debug("Uploads directory does not exist, skipping cleanup");
      return { deleted: 0 };
    }

    const files = await fs.promises.readdir(uploadsDir);
    let deletedCount = 0;

    for (const filename of files) {
      if (filename.startsWith(".")) continue;

      const filePath = path.join(uploadsDir, filename);
      const stat = await fs.promises.stat(filePath);

      if (stat.isDirectory()) continue;

      const filenameTimestamp = extractTimestampFromFilename(filename);
      const fileAge = filenameTimestamp || stat.mtimeMs;

      if (isExpiredTempFile(fileAge)) {
        try {
          await fs.promises.unlink(filePath);
          deletedCount++;
          logger.debug({ filename }, "Deleted expired temp file");
        } catch (err) {
          logger.warn({ filename, error: err }, "Failed to delete temp file");
        }
      }
    }

    logger.info({ deletedCount }, "Temp file cleanup completed");
    return { deleted: deletedCount };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Temp file cleanup failed");
    throw error;
  }
}

export function createTempFileCleanupWorker(): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<
        { correlationId: string },
        { deleted: number }
      >(QUEUE_NAMES.TEMP_FILE_CLEANUP_QUEUE, tempFileCleanupHandler, {
        concurrency: 5,
        limiter: {
          max: 50,
          duration: 60000,
        },
      });

      logger.info("Temp file cleanup worker initialized");
    },

    async scheduleJobs() {
      try {
        await queueService.addJob(
          QUEUE_NAMES.TEMP_FILE_CLEANUP_QUEUE,
          "cleanupTempFiles",
          {},
          {
            repeat: {
              pattern: "*/15 * * * *",
            },
            jobId: "temp-file-cleanup",
          },
        );
        logger.info("Scheduled temp file cleanup job (every 15 minutes)");
      } catch (error) {
        logger.error({ error }, "Failed to schedule temp file cleanup job");
      }
    },
  };
}
