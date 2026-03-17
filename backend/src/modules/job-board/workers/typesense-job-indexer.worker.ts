import { Job as BullMqJob } from "bullmq";
import { JobWithSkills } from "@/validations/job.validation";
import type { TypesenseServicePort } from "@shared/ports/typesense-service.port";
import logger from "@shared/logger";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { ModuleWorkers } from "@shared/types/module-workers";

interface TypesenseJobIndexerDeps {
  typesenseService: TypesenseServicePort;
}

function createTypesenseHandler(deps: TypesenseJobIndexerDeps) {
  return async function indexAddedJobInTypesense(
    job: BullMqJob<JobWithSkills & { correlationId: string }>,
  ): Promise<void> {
    const jobData = job.data;

    logger.info("Processing Typesense indexing job", {
      jobId: job.id,
      jobName: job.name,
      employer: jobData.employer.name,
      correlationId: jobData.correlationId,
    });

    const startTime = Date.now();

    try {
      switch (job.name) {
        case "indexJob":
          await deps.typesenseService.indexJobDocument(jobData);
          break;
        case "updateJobIndex":
          await deps.typesenseService.updateJobDocumentById(
            `${jobData.id}`,
            jobData,
          );
          break;
        case "deleteJobIndex":
          await deps.typesenseService.deleteJobDocumentById(`${jobData.id}`);
          break;
        default:
          logger.warn("Unknown job name for Typesense indexing", {
            jobName: job.name,
          });
      }
    } catch (error) {
      logger.error("Error processing Typesense job indexing", {
        jobId: job.id,
        jobName: job.name,
        error: error instanceof Error ? error.message : "Unknown error",
        correlationId: jobData.correlationId,
      });
      throw error;
    }

    const duration = Date.now() - startTime;
    logger.info("Completed Typesense job indexing", {
      jobId: job.id,
      jobName: job.name,
      durationMs: duration,
      correlationId: jobData.correlationId,
    });
  };
}

export function createTypesenseJobIndexerWorker(
  deps: TypesenseJobIndexerDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<
        JobWithSkills & { correlationId: string },
        void
      >(QUEUE_NAMES.TYPESENSE_QUEUE, createTypesenseHandler(deps), {
        concurrency: 5,
        limiter: {
          max: 50,
          duration: 60000,
        },
      });

      logger.info("Typesense worker initialized");
    },

    async scheduleJobs() {
      // Typesense indexer has no scheduled jobs — jobs are enqueued on demand
    },
  };
}
