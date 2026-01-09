import cron from "node-cron";
import { AuditService } from "@/services/audit.service";
import logger from "@/logger";

/**
 * Worker for cleaning up old audit logs based on retention policy
 */
export class AuditCleanupWorker {
  private auditService: AuditService;
  private retentionDays: number;
  private cronSchedule: string;

  /**
   * @param retentionDays Number of days to retain audit logs (default: 90)
   * @param cronSchedule Cron schedule for cleanup job (default: daily at 2 AM)
   */
  constructor(retentionDays: number = 90, cronSchedule: string = "0 2 * * *") {
    this.auditService = new AuditService();
    this.retentionDays = retentionDays;
    this.cronSchedule = cronSchedule;
  }

  /**
   * Starts the cleanup worker
   */
  start() {
    logger.info(
      `Starting audit log cleanup worker (retention: ${this.retentionDays} days, schedule: ${this.cronSchedule})`
    );

    cron.schedule(this.cronSchedule, async () => {
      try {
        logger.info("Running audit log cleanup job...");

        const result = await this.auditService.cleanupOldLogs(
          this.retentionDays
        );

        if (result.isSuccess) {
          logger.info(
            `Audit log cleanup completed successfully. Logs older than ${this.retentionDays} days removed.`
          );
        } else {
          logger.error(
            `Audit log cleanup failed: ${result.error.message}`
          );
        }
      } catch (error) {
        logger.error("Audit log cleanup job encountered an error:", error);
      }
    });
  }

  /**
   * Runs the cleanup job immediately (useful for testing)
   */
  async runNow() {
    logger.info("Running audit log cleanup job immediately...");

    try {
      const result = await this.auditService.cleanupOldLogs(
        this.retentionDays
      );

      if (result.isSuccess) {
        logger.info(
          `Audit log cleanup completed successfully. Logs older than ${this.retentionDays} days removed.`
        );
        return true;
      } else {
        logger.error(
          `Audit log cleanup failed: ${result.error.message}`
        );
        return false;
      }
    } catch (error) {
      logger.error("Audit log cleanup job encountered an error:", error);
      return false;
    }
  }
}

/**
 * Initialize the audit cleanup worker
 * Call this in your app.ts or server startup file
 */
export function initializeAuditCleanupWorker() {
  const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || "90");
  const cronSchedule = process.env.AUDIT_CLEANUP_SCHEDULE || "0 2 * * *";

  const worker = new AuditCleanupWorker(retentionDays, cronSchedule);
  worker.start();

  return worker;
}

/**
 * Example: Schedule cleanup job for immediate execution
 */
export async function scheduleAuditCleanupJob() {
  const worker = new AuditCleanupWorker();
  return await worker.runNow();
}