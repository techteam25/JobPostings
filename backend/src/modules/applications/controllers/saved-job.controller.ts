import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { SavedJobServicePort } from "../ports/saved-job-service.port";
import type {
  SavedJobs,
  SavedJobsQuerySchema,
} from "@/validations/user.validation";
import type { GetJobSchema } from "@/validations/job.validation";
import type { ApiResponse, EmptyBody } from "@shared/types";

export class SavedJobController extends BaseController {
  constructor(private savedJobService: SavedJobServicePort) {
    super();
  }

  getSavedJobsForCurrentUser = async (
    req: Request<
      EmptyBody,
      EmptyBody,
      EmptyBody,
      SavedJobsQuerySchema["query"]
    >,
    res: Response<ApiResponse<SavedJobs>>,
  ) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const savedJobs = await this.savedJobService.getSavedJobsForUser(
      req.userId!,
      page,
      limit,
    );

    if (savedJobs.isSuccess) {
      return this.sendPaginatedResponse<SavedJobs>(
        res,
        savedJobs.value.items,
        savedJobs.value.pagination,
        "Saved jobs retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, savedJobs.error);
    }
  };

  checkIfJobIsSaved = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<{ isSaved: boolean }>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;

    const isSaved = await this.savedJobService.isJobSavedByUser(userId, jobId);

    if (isSaved.isSuccess) {
      return this.sendSuccess<{ isSaved: boolean }>(
        res,
        { isSaved: isSaved.value },
        "Job saved status retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, isSaved.error);
    }
  };

  saveJobForCurrentUser = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<void>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;

    const result = await this.savedJobService.saveJobForCurrentUser(
      userId,
      jobId,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, null, "Job saved successfully", 200);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  unsaveJobForCurrentUser = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<ApiResponse<void>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId!;

    const result = await this.savedJobService.unsaveJobForCurrentUser(
      userId,
      jobId,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, null, "Job unsaved successfully", 200);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
