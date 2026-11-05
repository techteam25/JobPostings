import type { SavedJobRepositoryPort } from "@/modules/applications";
import type { SavedJobsStatusQueryPort } from "@/modules/job-board";

/**
 * Adapter bridging the saved-job repository (applications module) into
 * the job-board module's SavedJobsStatusQueryPort.
 */
export class ProfileToJobBoardAdapter implements SavedJobsStatusQueryPort {
  constructor(private readonly savedJobRepository: SavedJobRepositoryPort) {}

  async getSavedJobIds(userId: number, jobIds: number[]): Promise<Set<number>> {
    if (jobIds.length === 0) {
      return new Set();
    }

    return this.savedJobRepository.getSavedJobIdsForJobs(userId, jobIds);
  }

  async hasUserSavedJob(userId: number, jobId: number): Promise<boolean> {
    return this.savedJobRepository.isJobSavedByUser(userId, jobId);
  }
}
