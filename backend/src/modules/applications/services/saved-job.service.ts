import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import type { SavedJobServicePort } from "../ports/saved-job-service.port";
import type { SavedJobRepositoryPort } from "../ports/saved-job-repository.port";
import { AppError, DatabaseError, ValidationError } from "@shared/errors";

export class SavedJobService
  extends BaseService
  implements SavedJobServicePort
{
  static readonly MAX_SAVED_JOBS = 50;

  constructor(private savedJobRepository: SavedJobRepositoryPort) {
    super();
  }

  async getSavedJobsForUser(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      return ok(
        await this.savedJobRepository.getSavedJobsForUser(userId, page, limit),
      );
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve saved jobs"));
    }
  }

  async saveJobForCurrentUser(userId: number, jobId: number) {
    try {
      const savedCount = await this.savedJobRepository.countSavedJobs(userId);

      if (savedCount >= SavedJobService.MAX_SAVED_JOBS) {
        return fail(
          new ValidationError(
            `Saved jobs limit reached. You can save up to ${SavedJobService.MAX_SAVED_JOBS} jobs.`,
          ),
        );
      }

      return ok(await this.savedJobRepository.saveJobForUser(userId, jobId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to save job"));
    }
  }

  async isJobSavedByUser(userId: number, jobId: number) {
    try {
      return ok(await this.savedJobRepository.isJobSavedByUser(userId, jobId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to check saved job status"));
    }
  }

  async unsaveJobForCurrentUser(userId: number, jobId: number) {
    try {
      return ok(await this.savedJobRepository.unsaveJobForUser(userId, jobId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to unsave job"));
    }
  }
}
