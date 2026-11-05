import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type { SavedJobs } from "@/validations/user.validation";
import type { PaginationMeta } from "@shared/types";

export interface SavedJobServicePort {
  getSavedJobsForUser(
    userId: number,
    page?: number,
    limit?: number,
  ): Promise<
    Result<{ items: SavedJobs[]; pagination: PaginationMeta }, AppError>
  >;

  saveJobForCurrentUser(
    userId: number,
    jobId: number,
  ): Promise<Result<{ success: boolean }, AppError>>;

  isJobSavedByUser(
    userId: number,
    jobId: number,
  ): Promise<Result<boolean, AppError>>;

  unsaveJobForCurrentUser(
    userId: number,
    jobId: number,
  ): Promise<Result<{ success: boolean }, AppError>>;
}
