import { Job as BullMqJob } from "bullmq";
import type {
  TypesenseUserProfileServicePort,
  UserProfileDocument,
} from "@shared/ports/typesense-user-profile-service.port";
import logger from "@shared/logger";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { ModuleWorkers } from "@shared/types/module-workers";

interface TypesenseUserProfileIndexerDeps {
  typesenseUserProfileService: TypesenseUserProfileServicePort;
}

function createTypesenseUserProfileHandler(
  deps: TypesenseUserProfileIndexerDeps,
) {
  return async function indexUserProfileInTypesense(
    job: BullMqJob<UserProfileDocument & { correlationId: string }>,
  ): Promise<void> {
    const jobData = job.data;

    logger.info("Processing Typesense user profile indexing job", {
      jobId: job.id,
      jobName: job.name,
      userId: jobData.userId,
      correlationId: jobData.correlationId,
    });

    const startTime = Date.now();

    try {
      switch (job.name) {
        case "indexUserProfile":
        case "updateUserProfile":
          await deps.typesenseUserProfileService.upsertUserProfile(jobData);
          break;
        case "deleteUserProfile":
          await deps.typesenseUserProfileService.deleteUserProfile(jobData.id);
          break;
        default:
          logger.warn("Unknown job name for Typesense user profile indexing", {
            jobName: job.name,
          });
      }
    } catch (error) {
      logger.error("Error processing Typesense user profile indexing", {
        jobId: job.id,
        jobName: job.name,
        error: error instanceof Error ? error.message : "Unknown error",
        correlationId: jobData.correlationId,
      });
      throw error;
    }

    const duration = Date.now() - startTime;
    logger.info("Completed Typesense user profile indexing", {
      jobId: job.id,
      jobName: job.name,
      durationMs: duration,
      correlationId: jobData.correlationId,
    });
  };
}

export function createTypesenseUserProfileIndexerWorker(
  deps: TypesenseUserProfileIndexerDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<
        UserProfileDocument & { correlationId: string },
        void
      >(
        QUEUE_NAMES.TYPESENSE_USER_PROFILE_QUEUE,
        createTypesenseUserProfileHandler(deps),
        {
          concurrency: 5,
          limiter: {
            max: 50,
            duration: 60000,
          },
        },
      );

      logger.info("Typesense user profile worker initialized");
    },

    async scheduleJobs() {
      // User profile indexer has no scheduled jobs — jobs are enqueued on demand
    },
  };
}
