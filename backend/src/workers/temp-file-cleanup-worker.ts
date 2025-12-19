import path from "path";
import fs from "fs";
import logger from "@/logger";

import { Job as BullMqJob } from "bullmq";
import {
  extractTimestampFromFilename,
  isExpiredTempFile,
} from "@/validations/file.validation";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

export async function tempFileCleanupWorker(_job: BullMqJob) {
  const uploadsDir = path.resolve("uploads");

  logger.info("Starting temp file cleanup job");

  try {
    // Check if uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      logger.debug("Uploads directory does not exist, skipping cleanup");
      return { deleted: 0 };
    }

    const files = await fs.promises.readdir(uploadsDir);
    let deletedCount = 0;

    for (const filename of files) {
      // Skip directories and hidden files
      if (filename.startsWith(".")) continue;

      const filePath = path.join(uploadsDir, filename);
      const stat = await fs.promises.stat(filePath);

      if (stat.isDirectory()) continue;

      // Check if file is expired using filename timestamp or file mtime
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

/**
 * Initialize Email Sender worker
 */
export function initializeFileCleanupWorker(): void {
  queueService.registerWorker<{ correlationId: string }, { deleted: number }>(
    QUEUE_NAMES.TEMP_FILE_CLEANUP_QUEUE,
    tempFileCleanupWorker,
    {
      concurrency: 5, // Process 5 cleanup jobs concurrently
      limiter: {
        max: 50, // Max 50 files
        duration: 60000, // per minute
      },
    },
  );

  logger.info("Email worker initialized");
}

// Schedule repeatable cleanup job (every 15 minutes)
export async function scheduleCleanupJob() {
  try {
    await queueService.addJob(
      QUEUE_NAMES.TEMP_FILE_CLEANUP_QUEUE,
      "cleanupTempFiles",
      {},
      {
        repeat: {
          pattern: "*/15 * * * *", // Every 15 minutes
        },
        jobId: "temp-file-cleanup", // Prevent duplicate jobs
      },
    );
    logger.info("📅 Scheduled temp file cleanup job (every 15 minutes)");
  } catch (error) {
    logger.error({ error }, "Failed to schedule temp file cleanup job");
  }
}
