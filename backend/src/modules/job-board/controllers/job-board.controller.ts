import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import { ForbiddenError } from "@shared/errors";
import { auditService } from "@shared/audit";
import type { JobBoardServicePort } from "@/modules/job-board";
import type {
  CreateJobSchema,
  DeleteJobSchema,
  GetJobSchema,
  Job,
  JobWithEmployer,
  JobWithSkills,
  UpdateJobSchema,
} from "@/validations/job.validation";
import type { GetOrganizationSchema } from "@/validations/organization.validation";
import type { SearchParams } from "@/validations/base.validation";
import type { ApiResponse, EmptyBody, PaginatedResponse } from "@shared/types";
import { buildPaginationMeta } from "@shared/infrastructure/typesense.service/build-search-pagination";
import type { JobRecommendationServicePort } from "@/modules/job-board";

export class JobBoardController extends BaseController {
  constructor(
    private jobBoardService: JobBoardServicePort,
    private recommendationService: JobRecommendationServicePort,
  ) {
    super();
  }

  getAllJobs = async (
    req: Request<EmptyBody, EmptyBody, EmptyBody, SearchParams["query"]>,
    res: Response<PaginatedResponse<JobWithEmployer[]>>,
  ) => {
    const { page, limit } = req.query;
    const userId = req.userId;
    const result = await this.jobBoardService.getAllActiveJobs(userId, {
      page,
      limit,
    });

    if (result.isSuccess) {
      const { items, pagination } = result.value;
      return this.sendPaginatedResponse<JobWithEmployer>(
        res,
        items,
        pagination,
        "Jobs retrieved successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to retrieve jobs",
      );
    }
  };

  searchJobs = async (
    req: Request<EmptyBody, EmptyBody, EmptyBody, SearchParams["query"]>,
    res: Response,
  ) => {
    const {
      page,
      limit = 10,
      q,
      jobType,
      sortBy,
      city,
      state,
      country,
      skills,
      zipcode,
      experience,
      includeRemote,
      isActive,
      order,
      datePosted,
    } = req.query;

    const result = await this.jobBoardService.searchJobs({
      page,
      limit,
      q,
      jobType,
      sortBy,
      city,
      skills,
      state,
      country,
      zipcode,
      experience,
      includeRemote,
      isActive,
      order,
      datePosted,
    });

    if (result.isSuccess) {
      const { value } = result;
      const pagination = buildPaginationMeta(value, limit);

      return this.sendPaginatedResponse(
        res,
        value.hits?.map((h) => h.document) ?? [],
        pagination,
        "Jobs retrieved successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to search jobs",
      );
    }
  };

  getRecommendations = async (req: Request, res: Response) => {
    const userId = req.userId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await this.recommendationService.getRecommendations(
      userId,
      page,
      limit,
    );

    if (result.isSuccess) {
      const { jobs, total, hasPersonalization } = result.value;
      const pagination = buildPaginationMeta({ found: total, page }, limit);

      return res.status(200).json({
        success: true,
        message: "Recommendations retrieved successfully",
        data: jobs,
        pagination,
        hasPersonalization,
        timestamp: new Date().toISOString(),
      });
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to retrieve recommendations",
      );
    }
  };

  getJobById = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<
      ApiResponse<Job & { employer: { name: string; logoUrl: string | null } }>
    >,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.userId;

    const job = await this.jobBoardService.getJobById(jobId, userId);

    if (job.isSuccess) {
      return this.sendSuccess<JobWithEmployer>(
        res,
        job.value,
        "Job retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, job.error);
    }
  };

  createJob = async (
    req: Request<EmptyBody, EmptyBody, CreateJobSchema["body"]>,
    res: Response<ApiResponse<JobWithSkills>>,
  ) => {
    if (!req.organizationId) {
      return this.handleControllerError(
        res,
        new ForbiddenError(
          "You must be associated with an organization to create a job",
        ),
      );
    }

    const jobData = {
      ...req.body,
      employerId: req.organizationId,
    };

    const job = await this.jobBoardService.createJob(jobData);

    if (job.isSuccess) {
      auditService.emit({
        name: "job.created",
        actor: {
          id: req.userId,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        },
        resource: { type: "job", id: job.value.id },
        action: "created job",
        outcome: "success",
        metadata: { organizationId: req.organizationId },
      });
      return this.sendSuccess<JobWithSkills>(
        res,
        job.value,
        "Job created successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, job.error, "Failed to create job");
    }
  };

  updateJob = async (
    req: Request<UpdateJobSchema["params"], EmptyBody, UpdateJobSchema["body"]>,
    res: Response<ApiResponse<Job>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const updateData = req.body;

    const job = await this.jobBoardService.updateJob(
      jobId,
      {
        ...updateData,
        applicationDeadline: updateData.applicationDeadline
          ? new Date(updateData.applicationDeadline)
          : undefined,
      },
      req.userId!,
    );

    if (job.isSuccess) {
      const eventName =
        updateData.isActive === true
          ? "job.published"
          : updateData.isActive === false
            ? "job.unpublished"
            : "job.updated";
      auditService.emit({
        name: eventName,
        actor: {
          id: req.userId,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        },
        resource: { type: "job", id: jobId },
        action:
          eventName === "job.published"
            ? "published job"
            : eventName === "job.unpublished"
              ? "unpublished job"
              : "updated job",
        outcome: "success",
        metadata: { fields: Object.keys(updateData ?? {}) },
      });
      return this.sendSuccess<Job>(res, job.value, "Job updated successfully");
    } else {
      return this.handleControllerError(res, job.error, "Failed to update job");
    }
  };

  deleteJob = async (
    req: Request<DeleteJobSchema["params"]>,
    res: Response<ApiResponse<void>>,
  ) => {
    const jobId = parseInt(req.params.jobId);

    const result = await this.jobBoardService.deleteJob(
      jobId,
      req.userId!,
      req.organizationId!,
    );

    if (result.isSuccess) {
      auditService.emit({
        name: "job.deleted",
        actor: {
          id: req.userId,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        },
        resource: { type: "job", id: jobId },
        action: "deleted job",
        outcome: "success",
        metadata: { organizationId: req.organizationId },
      });
      return this.sendSuccess<void>(res, undefined, "Job deleted successfully");
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to delete job",
      );
    }
  };

  getJobsByEmployer = async (
    req: Request<
      GetOrganizationSchema["params"],
      EmptyBody,
      EmptyBody,
      GetOrganizationSchema["query"]
    >,
    res: Response,
  ) => {
    const organizationId = Number(req.params.organizationId);
    const { page, limit, sortBy, q, order } = req.query;

    const result = await this.jobBoardService.getJobsByEmployer(
      organizationId,
      { page, limit, sortBy, q, order },
    );

    if (result.isSuccess) {
      return this.sendPaginatedResponse<Job>(
        res,
        result.value.items,
        result.value.pagination,
        "Jobs retrieved successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to retrieve jobs",
      );
    }
  };

  getMyJobs = async (
    req: Request<
      GetOrganizationSchema["params"],
      EmptyBody,
      EmptyBody,
      SearchParams["query"]
    >,
    res: Response,
  ) => {
    const { page, limit } = req.query;
    const organizationId = Number(req.params.organizationId);

    if (!organizationId) {
      return this.handleControllerError(
        res,
        new ForbiddenError(
          "You must be associated with an organization to view jobs",
        ),
      );
    }

    const result = await this.jobBoardService.getJobsByEmployer(
      organizationId,
      { page, limit },
    );

    if (result.isSuccess) {
      return this.sendPaginatedResponse(
        res,
        result.value.items,
        result.value.pagination,
        "Your jobs retrieved successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to retrieve your jobs",
      );
    }
  };

  getOrganizationJobsStats = async (
    req: Request<GetOrganizationSchema["params"]>,
    res: Response,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const result =
      await this.jobBoardService.getEmployerJobStats(organizationId);

    if (result.isSuccess) {
      return this.sendSuccess<{
        total: number;
        active: number;
        inactive: number;
        totalApplications: number;
        totalViews: number;
      }>(
        res,
        result.value,
        "Organization job statistics retrieved successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to retrieve organization job statistics",
      );
    }
  };
}
