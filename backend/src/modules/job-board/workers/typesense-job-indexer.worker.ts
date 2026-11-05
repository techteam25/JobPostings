import { Job as BullMqJob } from "bullmq";
import { JobWithSkills } from "@/validations/job.validation";
import type { TypesenseJobServicePort } from "@shared/ports/typesense-service.port";
import logger from "@shared/logger";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { ModuleWorkers } from "@shared/types/module-workers";

interface TypesenseJobIndexerDeps {
  typesenseService: TypesenseJobServicePort;
}

/**
 * Queue payload shapes the Typesense job indexer accepts. `indexJob` and
 * `updateJobIndex` need the full DB row to rebuild the document; delete
 * only needs the id because the row is already gone from MySQL by the
 * time the event fires.
 */
type IndexerJobPayload = JobWithSkills | { id: number };

function isFullJob(payload: IndexerJobPayload): payload is JobWithSkills {
  return "title" in payload && "employer" in payload && "skills" in payload;
}

function createTypesenseHandler(deps: TypesenseJobIndexerDeps) {
  return async function indexAddedJobInTypesense(
    job: BullMqJob<IndexerJobPayload>,
  ): Promise<void> {
    const jobData = job.data;

    logger.info("Processing Typesense indexing job", {
      jobId: job.id,
      jobName: job.name,
      targetId: jobData.id,
      employer: isFullJob(jobData) ? jobData.employer.name : undefined,
    });

    const startTime = Date.now();

    try {
      switch (job.name) {
        case "indexJob":
          if (!isFullJob(jobData)) {
            throw new Error("indexJob payload missing job fields");
          }
          await deps.typesenseService.indexJobDocument(jobData);
          break;
        case "updateJobIndex":
          if (!isFullJob(jobData)) {
            throw new Error("updateJobIndex payload missing job fields");
          }
          await deps.typesenseService.upsertJobDocument(jobData);
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
        targetId: jobData.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }

    const duration = Date.now() - startTime;
    logger.info("Completed Typesense job indexing", {
      jobId: job.id,
      jobName: job.name,
      targetId: jobData.id,
      durationMs: duration,
    });
  };
}

export function createTypesenseJobIndexerWorker(
  deps: TypesenseJobIndexerDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<IndexerJobPayload, void>(
        QUEUE_NAMES.TYPESENSE_JOB_QUEUE,
        createTypesenseHandler(deps),
        {
          concurrency: 5,
          limiter: {
            max: 50,
            duration: 60000,
          },
        },
      );

      logger.info("Typesense worker initialized");
    },

    async scheduleJobs() {
      // Typesense indexer has no scheduled jobs — jobs are enqueued on demand
    },
  };
}
