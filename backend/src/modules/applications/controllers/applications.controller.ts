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
  JobApplicationWithNotes,
} from "@/validations/jobApplications.validation";
import type {
  CreateJobApplicationNoteInputSchema,
  GetOrganizationSchema,
  JobApplicationManagementSchema,
  JobApplicationsManagementSchema,
  OrganizationJobApplicationsResponse,
  UpdateJobStatusInputSchema,
} from "@/validations/organization.validation";
import type { ApiResponse, EmptyBody } from "@shared/types";

export class ApplicationsController extends BaseController {
  constructor(private applicationsService: ApplicationsServicePort) {
    super();
  }

  applyForJob = async (
    req: Request<
      ApplyForJobSchema["params"],
      EmptyBody,
      ApplyForJobSchema["body"]
    >,
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
    req: Request<
      GetJobSchema["params"],
      EmptyBody,
      EmptyBody,
      ApplicationQueryParams
    >,
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
    req: Request<EmptyBody, EmptyBody, EmptyBody, ApplicationQueryParams>,
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
    req: Request<
      GetJobApplicationSchema["params"],
      EmptyBody,
      UpdateJobApplication
    >,
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

  // ─── Employer/Organization-scoped application methods ─────────────

  getJobApplicationForOrganization = async (
    req: Request<JobApplicationManagementSchema["params"]>,
    res: Response<ApiResponse<OrganizationJobApplicationsResponse>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const applicationId = parseInt(req.params.applicationId);
    const jobId = parseInt(req.params.jobId);

    const application =
      await this.applicationsService.getJobApplicationForOrganization(
        organizationId,
        jobId,
        applicationId,
      );

    if (application.isSuccess) {
      return this.sendSuccess<OrganizationJobApplicationsResponse>(
        res,
        application.value,
        "Job application retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, application.error);
    }
  };

  updateOrgJobApplicationStatus = async (
    req: Request<
      JobApplicationManagementSchema["params"],
      EmptyBody,
      UpdateJobStatusInputSchema["body"]
    >,
    res: Response<ApiResponse<OrganizationJobApplicationsResponse>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const applicationId = parseInt(req.params.applicationId);
    const jobId = parseInt(req.params.jobId);

    const application =
      await this.applicationsService.updateOrgJobApplicationStatus(
        organizationId,
        jobId,
        applicationId,
        req.body.status,
      );

    if (application.isSuccess) {
      return this.sendSuccess<OrganizationJobApplicationsResponse>(
        res,
        application.value,
        "Job application status updated successfully",
      );
    } else {
      return this.handleControllerError(res, application.error);
    }
  };

  attachNoteToJobApplication = async (
    req: Request<
      JobApplicationManagementSchema["params"],
      EmptyBody,
      CreateJobApplicationNoteInputSchema["body"]
    >,
    res: Response<ApiResponse<JobApplicationWithNotes>>,
  ) => {
    const applicationId = parseInt(req.params.applicationId);
    const jobId = parseInt(req.params.jobId);

    const note = req.body;

    const result = await this.applicationsService.createJobApplicationNote(
      applicationId,
      jobId,
      note,
    );

    if (result.isSuccess) {
      return this.sendSuccess<JobApplicationWithNotes>(
        res,
        result.value,
        "Note added to job application successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  getNotesForJobApplication = async (
    req: Request<JobApplicationManagementSchema["params"]>,
    res: Response<ApiResponse<{ note: string; createdAt: Date }[]>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const applicationId = parseInt(req.params.applicationId);
    const jobId = parseInt(req.params.jobId);

    const applicationNotes =
      await this.applicationsService.getNotesForJobApplication(
        organizationId,
        jobId,
        applicationId,
      );

    if (applicationNotes.isSuccess) {
      return this.sendSuccess<{ note: string; createdAt: Date }[]>(
        res,
        applicationNotes.value,
        "Job application notes retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, applicationNotes.error);
    }
  };

  getJobApplicationsForOrganization = async (
    req: Request<JobApplicationsManagementSchema["params"]>,
    res: Response,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const jobId = parseInt(req.params.jobId);

    const applications =
      await this.applicationsService.getJobApplicationsForOrganization(
        organizationId,
        jobId,
      );

    if (applications.isSuccess) {
      return this.sendSuccess(
        res,
        applications.value,
        "Job applications retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, applications.error);
    }
  };

  getApplicationsForOrganization = async (
    req: Request<
      GetOrganizationSchema["params"],
      EmptyBody,
      EmptyBody,
      GetOrganizationSchema["query"]
    >,
    res: Response,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const { page, limit } = req.query;

    const applications =
      await this.applicationsService.getApplicationsForOrganization(
        organizationId,
        { page, limit },
      );

    if (applications.isSuccess) {
      const { items, pagination } = applications.value;
      return this.sendPaginatedResponse(
        res,
        items,
        pagination,
        "Job applications retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, applications.error);
    }
  };
}
