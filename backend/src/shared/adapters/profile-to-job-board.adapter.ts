import type { ProfileRepositoryPort } from "@/modules/user-profile";
import type { SavedJobsStatusQueryPort } from "@/modules/job-board";

/**
 * Adapter bridging the profile repository into the job-board module's
 * SavedJobsStatusQueryPort. Translates saved-job data into the shape
 * the job-board module expects.
 */
export class ProfileToJobBoardAdapter implements SavedJobsStatusQueryPort {
  constructor(private readonly profileRepository: ProfileRepositoryPort) {}

  async getSavedJobIds(userId: number, jobIds: number[]): Promise<Set<number>> {
    if (jobIds.length === 0) {
      return new Set();
    }

    return this.profileRepository.getSavedJobIdsForJobs(userId, jobIds);
  }

  async hasUserSavedJob(userId: number, jobId: number): Promise<boolean> {
    return this.profileRepository.isJobSavedByUser(userId, jobId);
  }
}
