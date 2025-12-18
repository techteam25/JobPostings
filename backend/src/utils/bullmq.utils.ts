import { Queue, QueueEvents, Worker, Job as BullMqJob } from "bullmq";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";

import logger from "@/logger";

import { env } from "@/config/env";
import { JobWithSkills } from "@/validations/job.validation";
import { TypesenseService } from "@/services/typesense.service/typesense.service";
import { EmailService } from "@/services/email.service";
import { firebaseUploadService } from "@/services/firebase-upload.service";
import {
  FileUploadJobData,
  FileMetadata,
  extractTimestampFromFilename,
  isExpiredTempFile,
} from "@/validations/file.validation";
import { db } from "@/db/connection";
import { jobApplications, organizations, userProfile } from "@/db/schema";

const typesenseService = new TypesenseService();
const emailService = new EmailService();

export const jobIndexerQueueEvents = new QueueEvents("jobIndexQueue", {
  connection: { url: env.REDIS_URL },
});
const emailSenderQueueEvents = new QueueEvents("emailQueue", {
  connection: { url: env.REDIS_URL },
});

export const jobIndexerQueue = new Queue("jobIndexQueue", {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export const emailSenderQueue = new Queue("emailQueue", {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 500,
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

const jobIndexerWorker = new Worker(
  "jobIndexQueue",
  async (job: BullMqJob<JobWithSkills>) => {
    const jobData = job.data;

    if (job.name === "indexJob") {
      await typesenseService.indexJobDocument(jobData);
      return;
    }
    if (job.name === "updateJobIndex") {
      await typesenseService.updateJobDocumentById(`${jobData.id}`, jobData);
      return;
    }
    if (job.name === "deleteJobIndex") {
      await typesenseService.deleteJobDocumentById(`${jobData.id}`);
      return;
    }
  },
  {
    connection: {
      url: env.REDIS_URL,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
);

const emailSenderWorker = new Worker(
  "emailQueue",
  async (job: BullMqJob<{ email: string; fullName: string }>) => {
    switch (job.name) {
      case "sendWelcomeEmail":
        // await emailService.sendWelcomeEmail(job.data);
        break;
      case "sendPasswordResetEmail":
        // await emailService.sendPasswordResetEmail(job.data);
        break;
      case "sendJobApplicationConfirmation":
        await emailService.sendJobApplicationConfirmation(
          job.data.email,
          job.data.fullName,
          (job.data as any).jobTitle,
          (job.data as any).jobId,
        );
        break;
      case "sendApplicationWithdrawalConfirmation":
        await emailService.sendApplicationWithdrawalConfirmation(
          job.data.email,
          job.data.fullName,
          (job.data as any).jobTitle,
          (job.data as any).applicationId,
        );
        break;
      case "sendAccountDeletionConfirmation":
        const user = job.data;
        await emailService.sendAccountDeletionConfirmation(
          user.email,
          user.fullName,
        );
        break;
      case "sendAccountDeactivationConfirmation":
        await emailService.sendAccountDeactivationConfirmation(
          job.data.email,
          job.data.fullName,
        );
        break;
      case "sendJobDeletionEmail":
        await emailService.sendJobDeletionEmail(
          job.data.email,
          job.data.fullName,
          (job.data as any).jobTitle,
          (job.data as any).jobId,
        );
        break;

      default:
        logger.error(`Unknown email job type: ${job.name}`);
    }
  },
  {
    connection: {
      url: env.REDIS_URL,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
);

jobIndexerQueueEvents.on("completed", () => {
  // update statistics
  logger.info("Job completed");
});

emailSenderQueueEvents.on("completed", () => {
  // update statistics
});

jobIndexerQueueEvents.on("failed", ({ jobId, failedReason }) => {
  // update statistics
  logger.error(`Job Indexer Job ${jobId} failed: ${failedReason}`);
});

emailSenderQueueEvents.on("failed", ({ jobId, failedReason }) => {
  // update statistics
  logger.error(`Email Sender Job ${jobId} failed: ${failedReason}`);
});

jobIndexerWorker.on("error", (err) => {
  logger.error(err);
});

emailSenderWorker.on("error", (err) => {
  logger.error(err);
});

logger.info("🚀 Worker started for queue:" + jobIndexerWorker.name);
logger.info("🚀 Worker started for queue:" + emailSenderWorker.name);

// ============================================================================
// File Upload Queue & Worker
// ============================================================================

export const fileUploadQueueEvents = new QueueEvents("fileUploadQueue", {
  connection: { url: env.REDIS_URL },
});

export const fileUploadQueue = new Queue<FileUploadJobData>("fileUploadQueue", {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 500,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

/**
 * Updates the database entity with file metadata
 */
async function updateEntityFileMetadata(
  entityType: FileUploadJobData["entityType"],
  entityId: string,
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
        .set({ fileMetadata: metadata })
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
        .set({ fileMetadata: metadata })
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

const fileUploadWorker = new Worker<FileUploadJobData>(
  "fileUploadQueue",
  async (job) => {
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
  },
  {
    connection: {
      url: env.REDIS_URL,
    },
    concurrency: 3, // Process 2-3 jobs simultaneously
    limiter: {
      max: 15, // Max 15 jobs
      duration: 60000, // Per minute
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
);

// ============================================================================
// Temp File Cleanup Queue & Worker (Repeatable Job)
// ============================================================================

export const tempFileCleanupQueue = new Queue("tempFileCleanupQueue", {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

const tempFileCleanupWorker = new Worker(
  "tempFileCleanupQueue",
  async (_job) => {
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
  },
  {
    connection: {
      url: env.REDIS_URL,
    },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 50 },
  },
);

// Schedule repeatable cleanup job (every 15 minutes)
async function scheduleCleanupJob() {
  try {
    await tempFileCleanupQueue.add(
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

// Initialize cleanup job
scheduleCleanupJob();

// ============================================================================
// File Upload Queue Event Handlers
// ============================================================================

fileUploadQueueEvents.on("completed", ({ jobId }) => {
  logger.info({ jobId }, "File upload job completed");
});

fileUploadQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error({ jobId, failedReason }, "File upload job failed");
});

fileUploadQueueEvents.on("progress", ({ jobId, data }) => {
  logger.debug({ jobId, progress: data }, "File upload progress");
});

fileUploadWorker.on("error", (err) => {
  logger.error(err, "File upload worker error");
});

tempFileCleanupWorker.on("error", (err) => {
  logger.error(err, "Temp file cleanup worker error");
});

logger.info("🚀 Worker started for queue:" + fileUploadWorker.name);
logger.info("🚀 Worker started for queue:" + tempFileCleanupWorker.name);
