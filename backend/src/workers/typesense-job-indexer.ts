import { Job as BullMqJob } from "bullmq";
import { JobWithSkills } from "@/validations/job.validation";
import { TypesenseService } from "@/infrastructure/typesense.service/typesense.service";
import logger from "@/logger";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

const typesenseService = new TypesenseService();

export async function indexAddedJobInTypesense(
  job: BullMqJob<JobWithSkills & { correlationId: string }>,
): Promise<void> {
  const jobData = job.data;

  logger.info("Processing email job", {
    jobId: job.id,
    jobName: job.name,
    employer: jobData.employer.name,
    correlationId: jobData.correlationId,
  });

  const startTime = Date.now();

  try {
    switch (job.name) {
      case "indexJob":
        await typesenseService.indexJobDocument(jobData);
        break;
      case "updateJobIndex":
        await typesenseService.updateJobDocumentById(`${jobData.id}`, jobData);
        break;
      case "deleteJobIndex":
        await typesenseService.deleteJobDocumentById(`${jobData.id}`);
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
}

/**
 * Initialize Typesense worker
 */
export function initializeTypesenseWorker(): void {
  queueService.registerWorker<JobWithSkills & { correlationId: string }, void>(
    QUEUE_NAMES.TYPESENSE_QUEUE,
    indexAddedJobInTypesense,
    {
      concurrency: 5, // Process 5 Typesense indexing jobs concurrently
      limiter: {
        max: 50, // Max 50 jobs
        duration: 60000, // per minute
      },
    },
  );

  logger.info("Typesense worker initialized");
}
