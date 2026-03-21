import { Job as BullMqJob } from "bullmq";
import logger from "@shared/logger";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { NotificationsRepositoryPort } from "@/modules/notifications";
import type { UserActivityQueryPort } from "@/modules/notifications";
import type { ModuleWorkers } from "@shared/types/module-workers";

interface InactiveUserAlertPauserDeps {
  userActivityQuery: UserActivityQueryPort;
  notificationsRepository: NotificationsRepositoryPort;
}

function createPauseHandler(deps: InactiveUserAlertPauserDeps) {
  return async function pauseInactiveUserAlerts(_job: BullMqJob) {
    logger.info("Starting inactive user alert pausing (deactivated users)");

    try {
      const inactiveUserIds = await deps.userActivityQuery.getInactiveUserIds();

      if (inactiveUserIds.length === 0) {
        logger.info("No inactive users found — skipping alert pausing");
        return { alertsPaused: 0, usersAffected: 0 };
      }

      const result =
        await deps.notificationsRepository.pauseAlertsForInactiveUsers(
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

export function createInactiveUserAlertPauserWorker(
  deps: InactiveUserAlertPauserDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<
        Record<string, never>,
        { alertsPaused: number; usersAffected: number }
      >(QUEUE_NAMES.JOB_ALERT_QUEUE, createPauseHandler(deps), {
        concurrency: 1,
        limiter: {
          max: 1,
          duration: 60000,
        },
      });

      logger.info("Inactive user alert pausing worker initialized");
    },

    async scheduleJobs() {
      try {
        await queueService.addJob(
          QUEUE_NAMES.JOB_ALERT_QUEUE,
          "pause-inactive-user-alerts",
          {},
          {
            repeat: {
              pattern: "0 2 * * 0",
            },
            jobId: "pause-inactive-user-alerts",
          },
        );
        logger.info(
          "Scheduled inactive user alert pausing (2:00 AM every Sunday)",
        );
      } catch (error) {
        logger.error(
          { error },
          "Failed to schedule inactive user alert pausing",
        );
      }
    },
  };
}
