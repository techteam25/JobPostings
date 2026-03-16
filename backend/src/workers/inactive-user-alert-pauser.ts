import { Job as BullMqJob } from "bullmq";
import logger from "@shared/logger";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { NotificationsRepositoryPort } from "@/modules/notifications/ports/notifications-repository.port";
import type { UserActivityQueryPort } from "@/modules/notifications/ports/user-activity-query.port";

/**
 * Creates a worker function to pause job alerts for inactive users.
 * Uses UserActivityQueryPort (ACL) to get deactivated user IDs, then passes them
 * to the notifications repository. This is the safety-net reconciliation sweep
 * that catches any events missed by the real-time UserDeactivated event handler.
 */
export function createPauseInactiveUserAlerts(
  userActivityQuery: UserActivityQueryPort,
  notificationsRepository: NotificationsRepositoryPort,
) {
  return async function pauseInactiveUserAlerts(_job: BullMqJob) {
    logger.info("Starting inactive user alert pausing (deactivated users)");

    try {
      // Use ACL to query identity module for deactivated user IDs
      const inactiveUserIds = await userActivityQuery.getInactiveUserIds();

      if (inactiveUserIds.length === 0) {
        logger.info("No inactive users found — skipping alert pausing");
        return { alertsPaused: 0, usersAffected: 0 };
      }

      // Pass IDs to notifications repository (no cross-module JOIN)
      const result =
        await notificationsRepository.pauseAlertsForInactiveUsers(
          inactiveUserIds,
        );

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
      logger.error("Inactive user alert pausing failed", {
        error: errorMessage,
      });
      throw error;
    }
  };
}

/**
 * Initialize the inactive user alert pausing worker.
 */
export function initializeInactiveUserAlertWorker(
  userActivityQuery: UserActivityQueryPort,
  notificationsRepository: NotificationsRepositoryPort,
): void {
  const handler = createPauseInactiveUserAlerts(
    userActivityQuery,
    notificationsRepository,
  );

  queueService.registerWorker<
    Record<string, never>,
    {
      alertsPaused: number;
      usersAffected: number;
    }
  >(QUEUE_NAMES.JOB_ALERT_QUEUE, handler, {
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
    logger.info("Scheduled inactive user alert pausing (2:00 AM every Sunday)");
  } catch (error) {
    logger.error({ error }, "Failed to schedule inactive user alert pausing");
  }
}
