import logger from "@/logger";
import { Job as BullMqJob } from "bullmq";
import { AuditService } from "@/services/audit.service";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

/**
 * Audit log cleanup worker job payload
 */
interface AuditCleanupJobPayload {
  retentionDays?: number;
  correlationId?: string;
}

/**
 * Audit log cleanup worker job result
 */
interface AuditCleanupJobResult {
  deleted: number;
  success: boolean;
}

/**
 * Worker function for cleaning up old audit logs
 * @param job BullMQ job containing cleanup parameters
 */
export async function auditCleanupWorker(
  job: BullMqJob<AuditCleanupJobPayload>
): Promise<AuditCleanupJobResult> {
  const { retentionDays = 90 } = job.data;

  logger.info(
    { retentionDays, jobId: job.id },
    "Starting audit log cleanup job"
  );

  try {
    const auditService = new AuditService();
    const result = await auditService.cleanupOldLogs(retentionDays);

    if (result.isSuccess) {
      logger.info(
        { retentionDays, jobId: job.id },
        `Audit log cleanup completed successfully. Logs older than ${retentionDays} days removed.`
      );

      return {
        deleted: 0, 
        success: true,
      };
    } else {
      logger.error(
        { retentionDays, error: result.error.message, jobId: job.id },
        "Audit log cleanup failed"
      );

      return {
        deleted: 0,
        success: false,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage, retentionDays, jobId: job.id },
      "Audit log cleanup encountered an error"
    );
    throw error;
  }
}

/**
 * Initialize audit cleanup worker
 * Registers the worker with the queue service
 */
export function initializeAuditCleanupWorker(): void {
  queueService.registerWorker<AuditCleanupJobPayload, AuditCleanupJobResult>(
    QUEUE_NAMES.AUDIT_CLEANUP_QUEUE,
    auditCleanupWorker,
    {
      concurrency: 1, 
      limiter: {
        max: 10, 
        duration: 60000, 
      },
    }
  );

  logger.info("Audit cleanup worker initialized");
}

/**
 * Schedule repeatable cleanup job
 * Default: Daily at 2 AM
 */
export async function scheduleAuditCleanupJob() {
  try {
    const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || "90");
    const cronSchedule = process.env.AUDIT_CLEANUP_SCHEDULE || "0 2 * * *";

    await queueService.addJob(
      QUEUE_NAMES.AUDIT_CLEANUP_QUEUE,
      "cleanupAuditLogs",
      { retentionDays },
      {
        repeat: {
          pattern: cronSchedule, 
        },
        jobId: "audit-log-cleanup", 
      }
    );

    logger.info(
      { retentionDays, schedule: cronSchedule },
      "📅 Scheduled audit log cleanup job"
    );
  } catch (error) {
    logger.error({ error }, "Failed to schedule audit log cleanup job");
  }
}