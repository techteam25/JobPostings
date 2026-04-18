import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import logger from "@shared/logger";

export type CandidateSearchSyncJobName =
  | "indexProfile"
  | "updateProfile"
  | "deleteProfile";

/**
 * Fire-and-forget enqueue for candidate-search Typesense sync. Swallows
 * errors and logs them — indexing failures must never break the user-facing
 * write that triggered the sync.
 *
 * Lives in shared/infrastructure rather than any single module so every
 * bounded context (user-profile, identity, …) can emit sync signals
 * without cross-module imports.
 */
export async function enqueueCandidateSearchSync(
  userId: number,
  jobName: CandidateSearchSyncJobName,
): Promise<void> {
  try {
    await queueService.addJob(
      QUEUE_NAMES.TYPESENSE_CANDIDATE_SEARCH_PROFILE_QUEUE,
      jobName,
      { userId, correlationId: crypto.randomUUID() },
    );
  } catch (error) {
    logger.error("Failed to enqueue candidate-search Typesense sync", {
      userId,
      jobName,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
