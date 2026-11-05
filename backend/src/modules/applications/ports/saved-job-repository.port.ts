import type { SavedJobs } from "@/validations/user.validation";
import type { PaginationMeta } from "@shared/types";

export interface SavedJobRepositoryPort {
  getSavedJobsForUser(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{ items: SavedJobs[]; pagination: PaginationMeta }>;
  saveJobForUser(userId: number, jobId: number): Promise<{ success: boolean }>;
  isJobSavedByUser(userId: number, jobId: number): Promise<boolean>;
  countSavedJobs(userId: number): Promise<number>;
  getSavedJobIdsForJobs(userId: number, jobIds: number[]): Promise<Set<number>>;
  unsaveJobForUser(
    userId: number,
    jobId: number,
  ): Promise<{ success: boolean }>;
}
