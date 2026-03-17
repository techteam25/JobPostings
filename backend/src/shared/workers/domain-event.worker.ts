import { Job as BullMqJob } from "bullmq";
import { DomainEventType } from "@shared/events";
import type { DomainEvent } from "@shared/events";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import logger from "@shared/logger";
import type { ApplicationSubmittedPayload } from "@/modules/applications";
import type { UserDeactivatedPayload } from "@/modules/identity";
import type { ApplicationInsightsPort } from "@shared/ports/application-insights.port";
import type { NotificationsRepositoryPort } from "@/modules/notifications";
import type { ModuleWorkers } from "@shared/types/module-workers";

interface DomainEventWorkerDeps {
  applicationInsights: ApplicationInsightsPort;
  notificationsRepository: Pick<
    NotificationsRepositoryPort,
    "pauseAlertsForUser"
  >;
}

function createDomainEventHandler(deps: DomainEventWorkerDeps) {
  return async function processDomainEvent(
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
          await deps.applicationInsights.incrementJobApplications(
            payload.jobId,
          );
          logger.info("Incremented application count for job", {
            jobId: payload.jobId,
            applicationId: payload.applicationId,
          });
          break;
        }

        case DomainEventType.USER_DEACTIVATED: {
          const deactivatedPayload = event.payload as UserDeactivatedPayload;
          const alertsPaused =
            await deps.notificationsRepository.pauseAlertsForUser(
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
  };
}

export function createDomainEventWorker(
  deps: DomainEventWorkerDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<DomainEvent, void>(
        QUEUE_NAMES.DOMAIN_EVENTS_QUEUE,
        createDomainEventHandler(deps),
        {
          concurrency: 5,
          limiter: {
            max: 100,
            duration: 60000,
          },
        },
      );

      logger.info("Domain event worker initialized");
    },

    async scheduleJobs() {
      // Domain event worker has no scheduled jobs — events are dispatched on demand
    },
  };
}
