import { Job as BullMqJob } from "bullmq";
import type {
  EmployerDocument,
  TypesenseEmployerServicePort,
} from "@shared/ports/typesense-employer-service.port";
import logger from "@shared/logger";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { ModuleWorkers } from "@shared/types/module-workers";

interface TypesenseEmployerIndexerDeps {
  typesenseEmployerService: TypesenseEmployerServicePort;
}

function createTypesenseHandler(deps: TypesenseEmployerIndexerDeps) {
  return async function indexEmployerInTypesense(
    job: BullMqJob<EmployerDocument & { correlationId: string }>,
  ): Promise<void> {
    const jobData = job.data;

    logger.info("Processing Typesense employer indexing job", {
      jobId: job.id,
      jobName: job.name,
      employerId: jobData.id,
      correlationId: jobData.correlationId,
    });

    const startTime = Date.now();

    try {
      switch (job.name) {
        case "indexEmployer":
          await deps.typesenseEmployerService.indexEmployerDocument(jobData);
          break;
        case "updateEmployerIndex":
          await deps.typesenseEmployerService.updateEmployerDocument(
            jobData.id,
            jobData,
          );
          break;
        case "deleteEmployerIndex":
          await deps.typesenseEmployerService.deleteEmployerDocument(
            jobData.id,
          );
          break;
        default:
          logger.warn("Unknown job name for Typesense employer indexing", {
            jobName: job.name,
          });
      }
    } catch (error) {
      logger.error("Error processing Typesense employer indexing", {
        jobId: job.id,
        jobName: job.name,
        error: error instanceof Error ? error.message : "Unknown error",
        correlationId: jobData.correlationId,
      });
      throw error;
    }

    const duration = Date.now() - startTime;
    logger.info("Completed Typesense employer indexing", {
      jobId: job.id,
      jobName: job.name,
      durationMs: duration,
      correlationId: jobData.correlationId,
    });
  };
}

export function createTypesenseEmployerIndexerWorker(
  deps: TypesenseEmployerIndexerDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<
        EmployerDocument & { correlationId: string },
        void
      >(QUEUE_NAMES.TYPESENSE_EMPLOYER_QUEUE, createTypesenseHandler(deps), {
        concurrency: 5,
        limiter: {
          max: 50,
          duration: 60000,
        },
      });

      logger.info("Typesense employer indexer worker initialized");
    },

    async scheduleJobs() {
      // Employer indexer has no scheduled jobs — jobs are enqueued on demand
    },
  };
}
