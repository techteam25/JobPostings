import { Job as BullMqJob } from "bullmq";
import logger from "@/logger";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";
import { UserRepository } from "@/repositories/user.repository";

/**
 * Worker function to pause job alerts for inactive users.
 * Runs weekly to clean up alerts for users with "deactivated" status.
 * @param _job The BullMQ job.
 */
export async function pauseInactiveUserAlerts(_job: BullMqJob) {
  const userRepository = new UserRepository();

  logger.info("Starting inactive user alert pausing (deactivated users)");

  try {
    // Pause alerts for users with status "deactivated"
    const result = await userRepository.pauseAlertsForInactiveUsers();

    logger.info("Inactive user alert pausing completed", {
      alertsPaused: result.alertsPaused,
      usersAffected: result.usersAffected,
    });

    return {
      alertsPaused: result.alertsPaused,
      usersAffected: result.usersAffected,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Inactive user alert pausing failed", { error: errorMessage });
    throw error;
  }
}

/**
 * Initialize the inactive user alert pausing worker.
 */
export function initializeInactiveUserAlertWorker(): void {
  queueService.registerWorker<
    Record<string, never>,
    {
      alertsPaused: number;
      usersAffected: number;
    }
  >(QUEUE_NAMES.JOB_ALERT_QUEUE, pauseInactiveUserAlerts, {
    concurrency: 1, // Only one cleanup job at a time
    limiter: {
      max: 1,
      duration: 60000, // Max 1 per minute
    },
  });

  logger.info("Inactive user alert pausing worker initialized");
}

/**
 * Schedule weekly inactive user alert pausing (runs every Sunday at 2:00 AM).
 */
export async function scheduleInactiveUserAlertPausing() {
  try {
    await queueService.addJob(
      QUEUE_NAMES.JOB_ALERT_QUEUE,
      "pause-inactive-user-alerts",
      {},
      {
        repeat: {
          pattern: "0 2 * * 0", // Every Sunday at 2:00 AM
        },
        jobId: "pause-inactive-user-alerts", // Prevent duplicate jobs
      },
    );
    logger.info(
      "📅 Scheduled inactive user alert pausing (2:00 AM every Sunday)",
    );
  } catch (error) {
    logger.error({ error }, "Failed to schedule inactive user alert pausing");
  }
}
