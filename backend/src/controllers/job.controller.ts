import { Request, Response } from "express";

import { JobService } from "@/services/job.service";
import { JobMatchingService } from "@/services/job-matching.service";
import { BaseController } from "./base.controller";
import { AppError, ErrorCode, ForbiddenError } from "@/utils/errors";
import {
  CreateJobSchema,
  DeleteJobSchema,
  GetJobSchema,
  Job,
  JobWithEmployer,
  type JobWithSkills,
  UpdateJobApplication,
  UpdateJobSchema,
} from "@/validations/job.validation";
import { GetOrganizationSchema } from "@/validations/organization.validation";
import { SearchParams } from "@/validations/base.validation";
import {
  ApplyForJobSchema,
  GetJobApplicationSchema,
} from "@/validations/jobApplications.validation";
import { ApiResponse, PaginatedResponse } from "@/types";
import { buildPaginationMeta } from "@/utils/build-search-pagination";

export class JobController extends BaseController {
  private jobService: JobService;
  private jobMatchingService: JobMatchingService;

  constructor() {
    super();
    this.jobService = new JobService();
    this.jobMatchingService = new JobMatchingService();
  }

  getAllJobs = async (
    req: Request<{}, {}, {}, SearchParams["query"]>,
    res: Response<PaginatedResponse<JobWithEmployer>>,
  ) => {
    const { page, limit } = req.query;
    const result = await this.jobService.getAllActiveJobs({
      page,
      limit,
    });

    if (result.isSuccess) {
      const { items, pagination } = result.value;
      return this.sendPaginatedResponse(
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
    req: Request<{}, {}, {}, SearchParams["query"]>,
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
      status,
    } = req.query;

    const result = await this.jobService.searchJobs({
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
      status,
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

  getJobById = async (
    req: Request<GetJobSchema["params"]>,
    res: Response<
      ApiResponse<Job & { employer: { name: string; logoUrl: string | null } }>
    >,
  ) => {
    const jobId = parseInt(req.params.jobId);

    const job = await this.jobService.getJobById(jobId);

    if (job.isSuccess) {
      return this.sendSuccess<JobWithEmployer[number]>(
        res,
        job.value,
        "Job retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, job.error);
    }
  };

  getRecommendedJobs = async (req: Request, res: Response) => {
    const userId = req.userId;
    const { page, limit } = this.extractPaginationParams(req);

    if (!userId) {
      return this.handleControllerError(
        res,
        new AppError("User not authenticated", 401, ErrorCode.UNAUTHORIZED),
        "Failed to retrieve recommended jobs",
      );
    }

    const result = await this.jobMatchingService.getRecommendedJobs(userId, {
      page,
      limit,
    });

    if (result.isSuccess) {
      return this.sendPaginatedResponse(
        res,
        result.value.items,
        result.value.pagination,
        "Recommended jobs retrieved successfully",
      );
    } else {
      return this.handleControllerError(
        res,
        result.error,
        "Failed to retrieve recommended jobs",
      );
    }
  };

  getSimilarJobs = async (
    req: Request<GetJobSchema["params"]>,
    res: Response,
  ) => {
    try {
      const jobId = Number(req.params.jobId);

      // const { limit = 5 } = req.query;
      const result = await this.jobMatchingService.getSimilarJobs(jobId, 5);

      return this.sendSuccess(
        res,
        result,
        "Similar jobs retrieved successfully",
      );
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Failed to retrieve similar jobs",
      );
    }
  };

  createJob = async (
    req: Request<{}, {}, CreateJobSchema["body"]>,
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

    const job = await this.jobService.createJob(jobData);

    if (job.isSuccess) {
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
    req: Request<UpdateJobSchema["params"], {}, UpdateJobSchema["body"]>,
    res: Response<ApiResponse<Job>>,
  ) => {
    const jobId = parseInt(req.params.jobId);
    const updateData = req.body;

    // Authorization check is handled in service
    const job = await this.jobService.updateJob(
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

    const result = await this.jobService.deleteJob(
      jobId,
      req.userId!,
      req.organizationId!,
    );

    if (result.isSuccess) {
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
      {},
      {},
      GetOrganizationSchema["query"]
    >,
    res: Response,
  ) => {
    const organizationId = Number(req.params.organizationId);

    const { page, limit, sortBy, q, order } = req.query;

    const result = await this.jobService.getJobsByEmployer(
      organizationId,
      { page, limit, sortBy, q, order },
      req.userId!,
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
      {},
      {},
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

    const result = await this.jobService.getJobsByEmployer(
      organizationId,
      { page, limit },
      req.userId!,
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

  // Job Application Methods
  applyForJob = async (
    req: Request<ApplyForJobSchema["params"], {}, ApplyForJobSchema["body"]>,
    res: Response,
  ) => {
    const jobId = Number(req.params.jobId);

    const applicationData = {
      ...req.body,
      jobId,
      applicantId: req.userId!,
    };

    const result = await this.jobService.applyForJob(applicationData);

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
    req: Request<GetJobSchema["params"], {}, {}, SearchParams["query"]>,
    res: Response,
  ) => {
    const jobId = Number(req.params.jobId);

    const { page, limit, status } = req.query;

    const result = await this.jobService.getJobApplications(
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
    req: Request<{}, {}, {}, SearchParams["query"]>,
    res: Response,
  ) => {
    const userId = req.userId!;
    const { page, limit, status } = req.query;

    const result = await this.jobService.getUserApplications(userId, {
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

    const result = await this.jobService.updateApplicationStatus(
      applicationId,
      payload,
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result,
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

    const result = await this.jobService.withdrawApplication(
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

  getOrganizationJobsStats = async (
    req: Request<GetOrganizationSchema["params"]>,
    res: Response,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const result = await this.jobService.getEmployerJobStats(organizationId);

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

  // getJobStats = async (req: Request, res: Response) => {
  //   try {
  //     const stats = await this.jobService.getJobStatistics();
  //     this.sendSuccess(res, stats, "Job statistics retrieved successfully");
  //   } catch (error) {
  //     this.handleControllerError(
  //       res,
  //       error,
  //       "Failed to retrieve job statistics",
  //     );
  //   }
  // };
}
