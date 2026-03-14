import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { ApplicationsServicePort } from "@/modules/applications";
import type {
  GetJobSchema,
  UpdateJobApplication,
} from "@/validations/job.validation";
import type {
  ApplicationQueryParams,
  ApplyForJobSchema,
  GetJobApplicationSchema,
} from "@/validations/jobApplications.validation";

export class ApplicationsController extends BaseController {
  constructor(private applicationsService: ApplicationsServicePort) {
    super();
  }

  applyForJob = async (
    req: Request<ApplyForJobSchema["params"], {}, ApplyForJobSchema["body"]>,
    res: Response,
  ) => {
    const jobId = Number(req.params.jobId);

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const resumeFile = files?.resume?.[0];
    const coverLetterFile = files?.coverLetter?.[0];

    const applicationData = {
      ...req.body,
      resume: resumeFile,
      coverLetterFile,
      jobId,
      applicantId: req.userId!,
    };

    const result = await this.applicationsService.applyForJob(
      applicationData,
      req.correlationId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Application submitted successfully",
        201,
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to submit application",
      );
    }
  };

  getJobApplications = async (
    req: Request<GetJobSchema["params"], {}, {}, ApplicationQueryParams>,
    res: Response,
  ) => {
    const jobId = Number(req.params.jobId);
    const { page, limit, status } = req.query;

    const result = await this.applicationsService.getJobApplications(
      jobId,
      { page, limit, status },
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendPaginatedResponse(
        res,
        result.value.items,
        result.value.pagination,
        "Applications retrieved successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to retrieve applications",
      );
    }
  };

  getUserApplications = async (
    req: Request<{}, {}, {}, ApplicationQueryParams>,
    res: Response,
  ) => {
    const userId = req.userId!;
    const { page, limit, status } = req.query;

    const result = await this.applicationsService.getUserApplications(userId, {
      page,
      limit,
      status,
    });

    if (result.isSuccess) {
      return this.sendPaginatedResponse(
        res,
        result.value.items,
        result.value.pagination,
        "Your applications retrieved successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to retrieve applications",
      );
    }
  };

  updateApplicationStatus = async (
    req: Request<GetJobApplicationSchema["params"], {}, UpdateJobApplication>,
    res: Response,
  ) => {
    const applicationId = Number(req.params.applicationId);
    const payload = req.body;

    const result = await this.applicationsService.updateApplicationStatus(
      applicationId,
      payload,
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Application status updated successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to update application status",
      );
    }
  };

  withdrawApplication = async (
    req: Request<GetJobApplicationSchema["params"]>,
    res: Response,
  ) => {
    const applicationId = Number(req.params.applicationId);

    const result = await this.applicationsService.withdrawApplication(
      applicationId,
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Application withdrawn successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to withdraw application",
      );
    }
  };
}
