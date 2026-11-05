/**
 * Port for querying application status from the job-board module's perspective.
 * The job-board module needs to know whether users have applied to jobs
 * and whether jobs have any applications (for deletion guards).
 *
 * Implemented by an adapter in src/shared/adapters/.
 */
export interface ApplicationStatusQueryPort {
  getAppliedJobIds(userId: number, jobIds: number[]): Promise<Set<number>>;
  hasUserApplied(userId: number, jobId: number): Promise<boolean>;
  hasApplicationsForJob(jobId: number): Promise<boolean>;
}
