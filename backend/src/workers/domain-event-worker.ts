import { Job as BullMqJob } from "bullmq";
import { DomainEventType } from "@shared/events";
import type { DomainEvent } from "@shared/events";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import { JobInsightsRepository } from "@/modules/job-board";
import { NotificationsRepository } from "@/modules/notifications";
import logger from "@shared/logger";
import type { ApplicationSubmittedPayload } from "@/modules/applications";
import type { UserDeactivatedPayload } from "@/modules/identity";

const jobInsightsRepository = new JobInsightsRepository();
const notificationsRepository = new NotificationsRepository();

export async function processDomainEvent(
  job: BullMqJob<DomainEvent>,
): Promise<void> {
  const event = job.data;

  logger.info("Processing domain event", {
    jobId: job.id,
    eventType: event.eventType,
    correlationId: event.correlationId,
  });

  const startTime = Date.now();

  try {
    switch (event.eventType) {
      case DomainEventType.APPLICATION_SUBMITTED: {
        const payload = event.payload as ApplicationSubmittedPayload;
        await jobInsightsRepository.incrementJobApplications(payload.jobId);
        logger.info("Incremented application count for job", {
          jobId: payload.jobId,
          applicationId: payload.applicationId,
        });
        break;
      }

      case DomainEventType.USER_DEACTIVATED: {
        const deactivatedPayload = event.payload as UserDeactivatedPayload;
        const alertsPaused = await notificationsRepository.pauseAlertsForUser(
          deactivatedPayload.userId,
        );
        logger.info("Paused alerts for deactivated user", {
          userId: deactivatedPayload.userId,
          alertsPaused,
        });
        break;
      }

      default:
        logger.warn("Unknown domain event type", {
          eventType: event.eventType,
        });
    }
  } catch (error) {
    logger.error("Error processing domain event", {
      jobId: job.id,
      eventType: event.eventType,
      error: error instanceof Error ? error.message : "Unknown error",
      correlationId: event.correlationId,
    });
    throw error;
  }

  const duration = Date.now() - startTime;
  logger.info("Completed domain event processing", {
    jobId: job.id,
    eventType: event.eventType,
    durationMs: duration,
    correlationId: event.correlationId,
  });
}

/**
 * Initialize domain event worker
 */
export function initializeDomainEventWorker(): void {
  queueService.registerWorker<DomainEvent, void>(
    QUEUE_NAMES.DOMAIN_EVENTS_QUEUE,
    processDomainEvent,
    {
      concurrency: 5,
      limiter: {
        max: 100,
        duration: 60000, // per minute
      },
    },
  );
}
