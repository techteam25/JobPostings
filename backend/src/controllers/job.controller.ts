import { Request, Response } from "express";
import { JobService } from "../services/job.service";
import { JobMatchingService } from "../services/job-matching.service";
import { BaseController } from "./base.controller";
import { ForbiddenError, AppError, ErrorCode } from "../utils/errors";
import {
  CreateJobSchema,
  DeleteJobSchema,
  GetJobSchema,
  UpdateJobSchema,
} from "../validations/job.validation";
import { GetOrganizationSchema } from "../validations/organization.validation";
import { SearchParams } from "../validations/base.validation";
import { GetJobApplicationSchema } from "../validations/jobApplications.validation";
import { UpdateJobApplication } from "../db/schema";

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
    res: Response,
  ) => {
    try {
      const { page, limit } = req.query;
      const result = await this.jobService.getAllActiveJobs({ page, limit });

      this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Jobs retrieved successfully",
      );
    } catch (error) {
      this.handleControllerError(res, error, "Failed to retrieve jobs");
    }
  };

  searchJobs = async (
    req: Request<{}, {}, {}, SearchParams["query"]>,
    res: Response,
  ) => {
    try {
      const { page, limit, status } = req.query;
      // const {
      //   search,
      //   jobType,
      //   location,
      //   experienceLevel,
      //   compensationType,
      //   isRemote,
      //   salaryMin,
      //   salaryMax,
      // } = req.query;

      const filters = {
        // searchTerm: typeof search === "string" ? search : undefined,
        // jobType: typeof jobType === "string" ? jobType : undefined,
        // location: typeof location === "string" ? location : undefined,
        // experienceLevel:
        //   typeof experienceLevel === "string" ? experienceLevel : undefined,
        // compensationType:
        //   typeof compensationType === "string" ? compensationType : undefined,
        // isRemote: isRemote === "true",
        // salaryMin: salaryMin ? Number(salaryMin) : undefined,
        // salaryMax: salaryMax ? Number(salaryMax) : undefined,
        page,
        limit,
        status,
      };

      const result = await this.jobService.searchJobs(filters);
      this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Jobs retrieved successfully",
      );
    } catch (error) {
      this.handleControllerError(res, error, "Failed to search jobs");
    }
  };

  getJobById = async (req: Request<GetJobSchema["params"]>, res: Response) => {
    try {
      const jobId = Number(req.params.jobId);

      const job = await this.jobService.getJobById(jobId);

      // Increment view count
      await this.jobService.incrementJobViews(jobId);

      this.sendSuccess(res, job, "Job retrieved successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Failed to retrieve job");
    }
  };

  getRecommendedJobs = async (req: Request, res: Response) => {
    try {
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
      return this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Recommended jobs retrieved successfully",
      );
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
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

      this.sendSuccess(res, result, "Similar jobs retrieved successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Failed to retrieve similar jobs");
    }
  };

  createJob = async (
    req: Request<{}, {}, CreateJobSchema["body"]>,
    res: Response,
  ) => {
    try {
      const jobData = {
        ...req.body,
        employerId: req.user?.organizationId!,
        postedById: req.userId!,
      };

      const job = await this.jobService.createJob(jobData);
      this.sendSuccess(res, job, "Job created successfully", 201);
    } catch (error) {
      this.handleControllerError(res, error, "Failed to create job", 400);
    }
  };

  updateJob = async (
    req: Request<UpdateJobSchema["params"], {}, UpdateJobSchema["body"]>,
    res: Response,
  ) => {
    try {
      const jobId = Number(req.params.jobId);
      const updateData = req.body;

      // Authorization check is handled in service
      const job = await this.jobService.updateJob(
        jobId,
        updateData,
        req.userId!,
        req.user!.role,
      );
      this.sendSuccess(res, job, "Job updated successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Failed to update job");
    }
  };

  deleteJob = async (
    req: Request<DeleteJobSchema["params"]>,
    res: Response,
  ) => {
    try {
      const jobId = Number(req.params.jobId);

      await this.jobService.deleteJob(jobId, req.userId!, req.user!.role);
      this.sendSuccess(res, null, "Job deleted successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Failed to delete job");
    }
  };

  getJobsByEmployer = async (
    req: Request<
      GetOrganizationSchema["params"],
      {},
      {},
      SearchParams["query"]
    >,
    res: Response,
  ) => {
    try {
      const organizationId = Number(req.params.organizationId);

      const { page, limit } = req.query;

      const result = await this.jobService.getJobsByEmployer(
        organizationId,
        { page, limit },
        req.userId!,
        req.user!.role,
      );

      this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Jobs retrieved successfully",
      );
    } catch (error) {
      this.handleControllerError(res, error, "Failed to retrieve jobs");
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
      req.user!.role,
    );

    return this.sendPaginatedResponse(
      res,
      result.items,
      result.pagination,
      "Your jobs retrieved successfully",
    );
  };

  // Job Application Methods
  applyForJob = async (req: Request<GetJobSchema["params"]>, res: Response) => {
    try {
      const jobId = Number(req.params.jobId);

      const applicationData = {
        ...req.body,
        jobId,
        applicantId: req.userId!,
      };

      const result = await this.jobService.applyForJob(applicationData);
      this.sendSuccess(res, result, "Application submitted successfully", 201);
    } catch (error) {
      this.handleControllerError(
        res,
        error,
        "Failed to submit application",
        400,
      );
    }
  };

  getJobApplications = async (
    req: Request<GetJobSchema["params"], {}, {}, SearchParams["query"]>,
    res: Response,
  ) => {
    try {
      const jobId = Number(req.params.jobId);

      const { page, limit, status } = req.query;

      const result = await this.jobService.getJobApplications(
        jobId,
        { page, limit, status },
        req.userId!,
        req.user!.role,
      );

      this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Applications retrieved successfully",
      );
    } catch (error) {
      this.handleControllerError(res, error, "Failed to retrieve applications");
    }
  };

  getUserApplications = async (
    req: Request<{}, {}, {}, SearchParams["query"]>,
    res: Response,
  ) => {
    try {
      const userId = req.userId!;
      const { page, limit, status } = req.query;

      const result = await this.jobService.getUserApplications(userId, {
        page,
        limit,
        status,
      });
      this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Your applications retrieved successfully",
      );
    } catch (error) {
      this.handleControllerError(res, error, "Failed to retrieve applications");
    }
  };

  updateApplicationStatus = async (
    req: Request<GetJobApplicationSchema["params"], {}, UpdateJobApplication>,
    res: Response,
  ) => {
    try {
      const applicationId = Number(req.params.applicationId);

      const payload = req.body;

      const result = await this.jobService.updateApplicationStatus(
        applicationId,
        payload,
        req.userId!,
        req.user!.role,
      );

      this.sendSuccess(res, result, "Application status updated successfully");
    } catch (error) {
      this.handleControllerError(
        res,
        error,
        "Failed to update application status",
      );
    }
  };

  withdrawApplication = async (
    req: Request<GetJobApplicationSchema["params"]>,
    res: Response,
  ) => {
    try {
      const applicationId = Number(req.params.applicationId);

      const result = await this.jobService.withdrawApplication(
        applicationId,
        req.userId!,
      );
      this.sendSuccess(res, result, "Application withdrawn successfully");
    } catch (error) {
      this.handleControllerError(res, error, "Failed to withdraw application");
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

  // getDashboardData = async (req: AuthRequest, res: Response) => {
  //   try {
  //     const userId = req.userId!;
  //     const userRole = req.user!.role;
  //
  //     let dashboardData;
  //
  //     if (userRole === "user") {
  //       dashboardData = await this.jobService.getUserDashboard(userId);
  //     } else if (userRole === "employer") {
  //       const organizationId = req.user!.organizationId;
  //       if (!organizationId) {
  //         throw new ForbiddenError(
  //           "Employer must be associated with an organization",
  //         );
  //       }
  //       dashboardData =
  //         await this.jobService.getEmployerDashboard(organizationId);
  //     } else if (userRole === "admin") {
  //       dashboardData = await this.jobService.getAdminDashboard();
  //     } else {
  //       throw new ForbiddenError("Invalid user role for dashboard access");
  //     }
  //
  //     this.sendSuccess(
  //       res,
  //       dashboardData,
  //       "Dashboard data retrieved successfully",
  //     );
  //   } catch (error) {
  //     this.handleControllerError(
  //       res,
  //       error,
  //       "Failed to retrieve dashboard data",
  //     );
  //   }
  // };
}
