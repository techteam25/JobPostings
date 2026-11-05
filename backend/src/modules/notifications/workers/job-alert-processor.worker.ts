import { Job as BullMqJob } from "bullmq";
import logger from "@shared/logger";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { NotificationsRepositoryPort } from "@/modules/notifications";
import type { JobMatchingServicePort } from "../ports/job-matching-service.port";
import type { ModuleWorkers } from "@shared/types/module-workers";

interface JobAlertProcessorDeps {
  notificationsRepository: NotificationsRepositoryPort;
  jobMatchingService: JobMatchingServicePort;
}

function createAlertProcessorHandler(deps: JobAlertProcessorDeps) {
  return async function processJobAlerts(
    job: BullMqJob<{ frequency: "daily" | "weekly" | "monthly" }>,
  ) {
    const { frequency } = job.data;

    logger.info(`Starting ${frequency} job alert processing`);

    try {
      const now = new Date();
      const cutoffTime = new Date(now);

      if (frequency === "daily") {
        cutoffTime.setHours(cutoffTime.getHours() - 24);
      } else if (frequency === "weekly") {
        cutoffTime.setDate(cutoffTime.getDate() - 7);
      } else if (frequency === "monthly") {
        cutoffTime.setDate(cutoffTime.getDate() - 30);
      }

      const alerts = await deps.notificationsRepository.getAlertsForProcessing(
        frequency,
        cutoffTime,
      );

      logger.info(`Found ${alerts.length} ${frequency} alerts to process`);

      let processedCount = 0;
      let matchesFoundCount = 0;
      let emailsQueuedCount = 0;

      for (const alert of alerts) {
        try {
          const alertWithUser = alert as typeof alert & {
            user?: { id: number; email: string; fullName: string };
          };

          logger.debug(
            `Processing alert ${alertWithUser.id} for user ${alertWithUser.userId}`,
          );

          const matchResult =
            await deps.jobMatchingService.findMatchingJobsForAlert(alert, 50);

          if (!matchResult.isSuccess) {
            logger.error(
              `Failed to find matches for alert ${alertWithUser.id}`,
              {
                error: matchResult.error,
              },
            );
            continue;
          }

          const matches = matchResult.value;

          if (matches.length === 0) {
            logger.debug(`No matches found for alert ${alertWithUser.id}`);
            await deps.notificationsRepository.updateAlertLastSentAt(
              alertWithUser.id,
              now,
            );
            processedCount++;
            continue;
          }

          logger.info(
            `Found ${matches.length} matches for alert ${alertWithUser.id}`,
          );

          await deps.notificationsRepository.saveAlertMatches(
            matches.map((match) => ({
              jobAlertId: alertWithUser.id,
              jobId: match.job.id!,
              matchScore: match.matchScore,
            })),
          );

          matchesFoundCount += matches.length;

          const unsentMatches =
            await deps.notificationsRepository.getUnsentMatches(
              alertWithUser.id,
              10,
            );
          const totalUnsentCount =
            await deps.notificationsRepository.getUnsentMatchCount(
              alertWithUser.id,
            );

          if (unsentMatches.length > 0 && alertWithUser.user) {
            type MatchWithJob = (typeof unsentMatches)[number];

            const buildLocation = (match: MatchWithJob) => {
              const parts: string[] = [];
              if (match.job?.city) parts.push(match.job.city);
              if (match.job?.state) parts.push(match.job.state);
              return parts.length > 0 ? parts.join(", ") : undefined;
            };

            await queueService.addJob(
              QUEUE_NAMES.EMAIL_QUEUE,
              `job-alert-notification-${alertWithUser.id}`,
              {
                userId: alertWithUser.userId,
                email: alertWithUser.user.email,
                fullName: alertWithUser.user.fullName,
                alertName: alertWithUser.name || "Your Job Alert",
                matches: unsentMatches.map((match) => ({
                  job: {
                    id: match.job?.id || 0,
                    title: match.job?.title || "",
                    company: match.job?.employer?.name || "Unknown Company",
                    location: buildLocation(match),
                    jobType: match.job?.jobType || undefined,
                    experienceLevel: match.job?.experience || undefined,
                    description: match.job?.description || undefined,
                  },
                  matchScore: match.matchScore,
                })),
                totalMatches: totalUnsentCount,
              },
            );

            emailsQueuedCount++;
            logger.debug(
              `Queued email notification for alert ${alertWithUser.id}`,
            );

            const matchIds = unsentMatches.map((m) => m.id);
            await deps.notificationsRepository.markMatchesAsSent(matchIds);
          }

          await deps.notificationsRepository.updateAlertLastSentAt(
            alertWithUser.id,
            now,
          );
          processedCount++;
        } catch (error) {
          const alertId = "id" in alert ? alert.id : "unknown";
          logger.error(`Error processing alert ${alertId}`, {
            error: error instanceof Error ? error.message : "Unknown error",
            alertId,
          });
        }
      }

      logger.info(`${frequency} job alert processing completed`, {
        totalAlerts: alerts.length,
        processed: processedCount,
        matchesFound: matchesFoundCount,
        emailsQueued: emailsQueuedCount,
      });

      return {
        frequency,
        totalAlerts: alerts.length,
        processed: processedCount,
        matchesFound: matchesFoundCount,
        emailsQueued: emailsQueuedCount,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`${frequency} job alert processing failed`, {
        error: errorMessage,
      });
      throw error;
    }
  };
}

export function createJobAlertProcessorWorker(
  deps: JobAlertProcessorDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<
        { frequency: "daily" | "weekly" | "monthly" },
        {
          frequency: string;
          totalAlerts: number;
          processed: number;
          matchesFound: number;
          emailsQueued: number;
        }
      >(QUEUE_NAMES.JOB_ALERT_QUEUE, createAlertProcessorHandler(deps), {
        concurrency: 2,
        limiter: {
          max: 10,
          duration: 60000,
        },
      });

      logger.info("Job alert processor worker initialized");
    },

    async scheduleJobs() {
      try {
        await queueService.addJob(
          QUEUE_NAMES.JOB_ALERT_QUEUE,
          "daily-job-alerts",
          { frequency: "daily" as const },
          {
            repeat: { pattern: "0 8 * * *" },
            jobId: "daily-job-alert-processing",
          },
        );
        logger.info("Scheduled daily job alert processing (8:00 AM daily)");
      } catch (error) {
        logger.error(
          { error },
          "Failed to schedule daily job alert processing",
        );
      }

      try {
        await queueService.addJob(
          QUEUE_NAMES.JOB_ALERT_QUEUE,
          "weekly-job-alerts",
          { frequency: "weekly" as const },
          {
            repeat: { pattern: "0 8 * * 1" },
            jobId: "weekly-job-alert-processing",
          },
        );
        logger.info(
          "Scheduled weekly job alert processing (8:00 AM every Monday)",
        );
      } catch (error) {
        logger.error(
          { error },
          "Failed to schedule weekly job alert processing",
        );
      }

      try {
        await queueService.addJob(
          QUEUE_NAMES.JOB_ALERT_QUEUE,
          "monthly-job-alerts",
          { frequency: "monthly" as const },
          {
            repeat: { pattern: "0 8 1 * *" },
            jobId: "monthly-job-alert-processing",
          },
        );
        logger.info(
          "Scheduled monthly job alert processing (8:00 AM on the 1st)",
        );
      } catch (error) {
        logger.error(
          { error },
          "Failed to schedule monthly job alert processing",
        );
      }
    },
  };
}
