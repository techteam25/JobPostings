import { Request, Response } from "express";
import { JobService } from "@/services/job.service";
import { JobMatchingService } from "@/services/job-matching.service";
import { BaseController } from "./base.controller";
import {
  ForbiddenError,
  AppError,
  ErrorCode,
  NotFoundError,
} from "@/utils/errors";
import {
  CreateJobSchema,
  DeleteJobSchema,
  GetJobSchema,
  type JobWithSkills,
  UpdateJobSchema,
  ApplyForJobSchema,
  applyForJobSchema,
  Job,
  JobWithEmployer,
  UpdateJobApplication,
} from "@/validations/job.validation";
import { GetOrganizationSchema } from "@/validations/organization.validation";
import { SearchParams, searchParams } from "@/validations/base.validation";
import { GetJobApplicationSchema, JobApplication } from "@/validations/jobApplications.validation";
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
    res: Response<PaginatedResponse<JobWithEmployer>>
  ) => {
    try {
      const { page, limit } = req.query;
      const { items, pagination } = await this.jobService.getAllActiveJobs({
        page,
        limit,
      });

      return res.json({
        success: true,
        data: items,
        pagination,
        message: "Jobs retrieved successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve jobs",
        error: (error as Error).message,
        status: "error",
        timestamp: new Date().toISOString(),
      });
    }
  };

  searchJobs = async (
    req: Request<{}, {}, {}, SearchParams["query"]>,
    res: Response<PaginatedResponse<JobWithEmployer>>
  ) => {
    try {
      const {
        page,
        limit = 10,
        q,
        jobType,
        sortBy,
        city,
        state,
        country,
        zipcode,
        experience,
        includeRemote,
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
        state,
        country,
        zipcode,
        experience,
        includeRemote,
        order,
        status,
      });

      const pagination = buildPaginationMeta(result, limit);

      this.sendPaginatedResponse(
        res,
        result.hits?.map((h) => h.document) ?? [],
        pagination,
        "Jobs retrieved successfully",
      );
    } catch (error) {
      return this.handleControllerError(res, error, "Failed to search jobs");
    }
  };

  getJobById = async (
    req: Request<GetJobSchema["params"], {}, {}, {}>,
    res: Response<ApiResponse<Job>>
  ) => {
    try {
      const jobId = parseInt(req.params.jobId);

      const job = await this.jobService.getJobById(jobId);

      // Increment view count for active jobs
      if (job.isActive) {
        await this.jobService.incrementJobViews(jobId);
      }

      return res.json({
        success: true,
        data: job,
        message: "Job retrieved successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: "Failed to retrieve job",
          error: error.message,
          status: "error",
          timestamp: new Date().toISOString(),
        });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve job",
        error: (error as Error).message,
        status: "error",
        timestamp: new Date().toISOString(),
      });
    }
  };

  getRecommendedJobs = async (
    req: Request<{}, {}, {}, SearchParams["query"]>,
    res: Response<PaginatedResponse<JobWithEmployer>>
  ) => {
    try {
      const userId = req.userId;
      const { page, limit } = this.extractPaginationParams(req);

      if (!userId) {
        return this.handleControllerError(
          res,
          new AppError("User not authenticated", 401, ErrorCode.UNAUTHORIZED),
          "Failed to retrieve recommended jobs"
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
        "Recommended jobs retrieved successfully"
      );
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Failed to retrieve recommended jobs"
      );
    }
  };

  getSimilarJobs = async (
    req: Request<GetJobSchema["params"], {}, {}, {}>,
    res: Response<ApiResponse<JobWithEmployer[]>>
  ) => {
    try {
      const jobId = Number(req.params.jobId);

      // const { limit = 5 } = req.query;
      const result = await this.jobMatchingService.getSimilarJobs(jobId, 5);

      return this.sendSuccess(res, result, "Similar jobs retrieved successfully");
    } catch (error) {
      return this.handleControllerError(res, error, "Failed to retrieve similar jobs");
    }
  };

  createJob = async (
    req: Request<{}, {}, CreateJobSchema["body"]>,
    res: Response<ApiResponse<JobWithSkills>>,
  ) => {
    try {
      if (!req.organizationId) {
        return res.status(403).json({
          success: false,
          message:
            "You must be associated with an organization to create a job",
          status: "error",
          timestamp: new Date().toISOString(),
        });
      }

      const jobData = {
        ...req.body,
        employerId: req.organizationId,
      };

      const job = await this.jobService.createJob(jobData);

      return res.status(201).json({
        success: true,
        data: job,
        message: "Job created successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Failed to create job",
        error: (error as Error).message,
        status: "error",
        timestamp: new Date().toISOString(),
      });
    }
  };

  updateJob = async (
    req: Request<UpdateJobSchema["params"], {}, UpdateJobSchema["body"], {}>,
    res: Response<ApiResponse<Job>>
  ) => {
    try {
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
        
      );
      return res.status(200).json({
        success: true,
        data: job,
        message: "Job updated successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Failed to update job",
        error: (error as Error).message,
        status: "error",
        timestamp: new Date().toISOString(),
      });
    }
  };

  deleteJob = async (
    req: Request<DeleteJobSchema["params"], {}, {}, {}>,
    res: Response<ApiResponse<void>>
  ) => {
    try {
      const jobId = parseInt(req.params.jobId);

      await this.jobService.deleteJob(jobId, req.userId!);
      return res.json({
        success: true,
        message: "Job deleted successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete job",
        error: (error as Error).message,
        status: "error",
        timestamp: new Date().toISOString(),
      });
    }
  };

  getJobsByEmployer = async (
    req: Request<
      GetOrganizationSchema["params"],
      {},
      {},
      SearchParams["query"]
    >,
    res: Response<PaginatedResponse<Job>>
  ) => {
    try {
      const organizationId = Number(req.params.organizationId);

      const { page, limit } = req.query;

      const result = await this.jobService.getJobsByEmployer(
        organizationId,
        { page, limit },
        req.userId!
      );

      return this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Jobs retrieved successfully"
      );
    } catch (error) {
      return this.handleControllerError(res, error, "Failed to retrieve jobs");
    }
  };

  getMyJobs = async (
    req: Request<
      GetOrganizationSchema["params"],
      {},
      {},
      SearchParams["query"]
    >,
    res: Response<PaginatedResponse<Job>>
  ) => {
    try {
      const { page, limit } = req.query;
      const organizationId = Number(req.params.organizationId);

      if (!organizationId) {
        return this.handleControllerError(
          res,
          new ForbiddenError(
            "You must be associated with an organization to view jobs"
          )
        );
      }

      const result = await this.jobService.getJobsByEmployer(
        organizationId,
        { page, limit },
        req.userId!
      );

      return this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Your jobs retrieved successfully"
      );
    } catch (error) {
      return this.handleControllerError(res, error, "Failed to retrieve jobs");
    }
  };

  // Job Application Methods
  applyForJob = async (
    req: Request<
      ApplyForJobSchema["params"],
      {},
      ApplyForJobSchema["body"],
      {}
    >,
    res: Response<ApiResponse<{ applicationId: number; message: string }>>
  ) => {
    try {
      const jobId = Number(req.params.jobId);

      // Validate request with schema (optional if using middleware)
      const parsed = applyForJobSchema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          error: JSON.stringify(parsed.error.issues),
          status: "error",
          timestamp: new Date().toISOString(),
        });
      }

      const applicationData = {
        ...req.body,
        jobId,
        applicantId: req.userId!,
      };

      const result = await this.jobService.applyForJob(applicationData);
      return this.sendSuccess(res, result, "Application submitted successfully", 201);
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Failed to submit application",
        400
      );
    }
  };

  getJobApplications = async (
    req: Request<GetJobSchema["params"], {}, {}, SearchParams["query"]>,
    res: Response
  ) => {
    try {
      const jobId = Number(req.params.jobId);

      const { page, limit, status } = req.query;

      const result = await this.jobService.getJobApplications(
        jobId,
        { page, limit, status },
        req.userId!
      );

      return this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Applications retrieved successfully"
      );
    } catch (error) {
      return this.handleControllerError(res, error, "Failed to retrieve applications");
    }
  };

  getUserApplications = async (
    req: Request<{}, {}, {}, SearchParams["query"]>,
    res: Response<PaginatedResponse<{
      application: JobApplication;
      job: { id: number; title: string; location: string; jobType: string };
      employer: { id: number; name: string };
    }>>
  ) => {
    try {
      const userId = req.userId!;
      const { page, limit, status } = req.query;

      const result = await this.jobService.getUserApplications(userId, {
        page,
        limit,
        status,
      });
      return this.sendPaginatedResponse(
        res,
        result.items,
        result.pagination,
        "Your applications retrieved successfully"
      );
    } catch (error) {
      return this.handleControllerError(res, error, "Failed to retrieve applications");
    }
  };

  updateApplicationStatus = async (
    req: Request<GetJobApplicationSchema["params"], {}, UpdateJobApplication, {}>,
    res: Response<ApiResponse<{ message: string }>>
  ) => {
    try {
      const applicationId = Number(req.params.applicationId);

      const payload = req.body;

      const result = await this.jobService.updateApplicationStatus(
        applicationId,
        payload,
        req.userId!
      );

      return this.sendSuccess(res, result, "Application status updated successfully");
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Failed to update application status"
      );
    }
  };

  withdrawApplication = async (
    req: Request<GetJobApplicationSchema["params"], {}, {}, {}>,
    res: Response<ApiResponse<{
      message: string;
      applicationDetails: {
        userEmail: string;
        userFirstName: string;
        jobTitle: string;
        companyName: string;
      };
    }>>
  ) => {
    try {
      const applicationId = Number(req.params.applicationId);

      const result = await this.jobService.withdrawApplication(applicationId);

      // Controller handles response formatting
    const response = {
      message: "Application withdrawn successfully",
      applicationDetails: {
        userEmail: result.user.email,
        userFirstName: result.user.fullName?.split(" ")[0] ?? "",
        jobTitle: result.job.title,
        companyName: result.employer?.name ?? "Company",
      },
    };
      return this.sendSuccess(res, result, "Application withdrawn successfully");
    } catch (error) {
      return this.handleControllerError(res, error, "Failed to withdraw application");
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