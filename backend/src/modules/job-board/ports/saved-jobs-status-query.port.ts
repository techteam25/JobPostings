/**
 * Port for querying saved-job status from the job-board module's perspective.
 * The job-board module needs to know whether users have saved specific jobs
 * so it can enrich job listings with a `hasSaved` flag.
 *
 * Implemented by an adapter in src/shared/adapters/.
 */
export interface SavedJobsStatusQueryPort {
  getSavedJobIds(userId: number, jobIds: number[]): Promise<Set<number>>;
  hasUserSavedJob(userId: number, jobId: number): Promise<boolean>;
}
