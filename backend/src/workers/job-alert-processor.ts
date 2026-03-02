import { Job as BullMqJob } from "bullmq";
import logger from "@/logger";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";
import { UserRepository } from "@/repositories/user.repository";
import { JobMatchingService } from "@/services/job-matching.service";

/**
 * Worker function to process job alerts and find matches.
 * @param job The BullMQ job containing the frequency type.
 */
export async function processJobAlerts(job: BullMqJob<{ frequency: "daily" | "weekly" | "monthly" }>) {
  const { frequency } = job.data;
  const userRepository = new UserRepository();
  const jobMatchingService = new JobMatchingService();

  logger.info(`Starting ${frequency} job alert processing`);

  try {
    // Calculate cutoff time based on frequency
    const now = new Date();
    const cutoffTime = new Date(now);
    
    if (frequency === "daily") {
      // Process alerts that haven't been sent in the last 24 hours
      cutoffTime.setHours(cutoffTime.getHours() - 24);
    } else if (frequency === "weekly") {
      // Process alerts that haven't been sent in the last 7 days
      cutoffTime.setDate(cutoffTime.getDate() - 7);
    } else if (frequency === "monthly") {
      // Process alerts that haven't been sent in the last 30 days
      cutoffTime.setDate(cutoffTime.getDate() - 30);
    }

    // Get all alerts that need processing
    const alerts = await userRepository.getAlertsForProcessing(frequency, cutoffTime);

    logger.info(`Found ${alerts.length} ${frequency} alerts to process`);

    let processedCount = 0;
    let matchesFoundCount = 0;
    let emailsQueuedCount = 0;

    // Process each alert
    for (const alert of alerts) {
      try {
        // Type assertion for alert with user relation
        const alertWithUser = alert as typeof alert & {
          user?: { id: number; email: string; fullName: string };
        };

        logger.debug(`Processing alert ${alertWithUser.id} for user ${alertWithUser.userId}`);

        // Find matching jobs using Typesense
        const matchResult = await jobMatchingService.findMatchingJobsForAlert(alert, 50);

        if (!matchResult.isSuccess) {
          logger.error(`Failed to find matches for alert ${alertWithUser.id}`, {
            error: matchResult.error,
          });
          continue;
        }

        const matches = matchResult.value;

        if (matches.length === 0) {
          logger.debug(`No matches found for alert ${alertWithUser.id}`);
          // Update lastSentAt even if no matches found
          await userRepository.updateAlertLastSentAt(alertWithUser.id, now);
          processedCount++;
          continue;
        }

        logger.info(`Found ${matches.length} matches for alert ${alertWithUser.id}`);

        // Save matches to database
        await userRepository.saveAlertMatches(
          matches.map((match) => ({
            jobAlertId: alertWithUser.id,
            jobId: match.job.id!,
            matchScore: match.matchScore,
          })),
        );

        matchesFoundCount += matches.length;

        // Get unsent matches (limit to top 10 for email)
        const unsentMatches = await userRepository.getUnsentMatches(alertWithUser.id, 10);
        const totalUnsentCount = await userRepository.getUnsentMatchCount(alertWithUser.id);

        if (unsentMatches.length > 0 && alertWithUser.user) {
          // Type for match with job relation
          type MatchWithJob = typeof unsentMatches[number];
          
          // Build location string from city and state
          const buildLocation = (match: MatchWithJob) => {
            const parts: string[] = [];
            if (match.job?.city) parts.push(match.job.city);
            if (match.job?.state) parts.push(match.job.state);
            return parts.length > 0 ? parts.join(", ") : undefined;
          };

          // Queue email notification
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
          logger.debug(`Queued email notification for alert ${alertWithUser.id}`);

          // Mark matches as sent
          const matchIds = unsentMatches.map((m) => m.id);
          await userRepository.markMatchesAsSent(matchIds);
        }

        // Update lastSentAt timestamp
        await userRepository.updateAlertLastSentAt(alertWithUser.id, now);
        processedCount++;
      } catch (error) {
        const alertId = "id" in alert ? alert.id : "unknown";
        logger.error(`Error processing alert ${alertId}`, {
          error: error instanceof Error ? error.message : "Unknown error",
          alertId,
        });
        // Continue processing other alerts
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`${frequency} job alert processing failed`, { error: errorMessage });
    throw error;
  }
}

/**
 * Initialize job alert processor worker.
 */
export function initializeJobAlertWorker(): void {
  queueService.registerWorker<
    { frequency: "daily" | "weekly" | "monthly" },
    {
      frequency: string;
      totalAlerts: number;
      processed: number;
      matchesFound: number;
      emailsQueued: number;
    }
  >(
    QUEUE_NAMES.JOB_ALERT_QUEUE,
    processJobAlerts,
    {
      concurrency: 2, // Process 2 job alert batches concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000, // per minute
      },
    },
  );

  logger.info("Job alert processor worker initialized");
}

/**
 * Schedule daily job alert processing (runs every day at 8:00 AM).
 */
export async function scheduleDailyAlertProcessing() {
  try {
    await queueService.addJob(
      QUEUE_NAMES.JOB_ALERT_QUEUE,
      "daily-job-alerts",
      { frequency: "daily" as const },
      {
        repeat: {
          pattern: "0 8 * * *", // Every day at 8:00 AM
        },
        jobId: "daily-job-alert-processing", // Prevent duplicate jobs
      },
    );
    logger.info("📅 Scheduled daily job alert processing (8:00 AM daily)");
  } catch (error) {
    logger.error({ error }, "Failed to schedule daily job alert processing");
  }
}

/**
 * Schedule weekly job alert processing (runs every Monday at 8:00 AM).
 */
export async function scheduleWeeklyAlertProcessing() {
  try {
    await queueService.addJob(
      QUEUE_NAMES.JOB_ALERT_QUEUE,
      "weekly-job-alerts",
      { frequency: "weekly" as const },
      {
        repeat: {
          pattern: "0 8 * * 1", // Every Monday at 8:00 AM
        },
        jobId: "weekly-job-alert-processing", // Prevent duplicate jobs
      },
    );
    logger.info("📅 Scheduled weekly job alert processing (8:00 AM every Monday)");
  } catch (error) {
    logger.error({ error }, "Failed to schedule weekly job alert processing");
  }
}

/**
 * Schedule monthly job alert processing (runs on the 1st of every month at 8:00 AM).
 */
export async function scheduleMonthlyAlertProcessing() {
  try {
    await queueService.addJob(
      QUEUE_NAMES.JOB_ALERT_QUEUE,
      "monthly-job-alerts",
      { frequency: "monthly" as const },
      {
        repeat: {
          pattern: "0 8 1 * *", // 1st of every month at 8:00 AM
        },
        jobId: "monthly-job-alert-processing", // Prevent duplicate jobs
      },
    );
    logger.info("📅 Scheduled monthly job alert processing (8:00 AM on the 1st of each month)");
  } catch (error) {
    logger.error({ error }, "Failed to schedule monthly job alert processing");
  }
}
