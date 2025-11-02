import { Request, Response } from "express";
import { OrganizationService } from "@/services/organization.service";
import { BaseController } from "./base.controller";
import {
  CreateJobApplicationNoteInputSchema,
  CreateOrganizationSchema,
  DeleteOrganizationSchema,
  GetOrganizationSchema,
  JobApplicationManagementSchema,
  JobApplicationsManagementSchema,
  JobApplicationsResponseSchema,
  OrganizationJobApplicationsResponse,
  UpdateJobStatusInputSchema,
  UpdateOrganizationSchema,
} from "@/validations/organization.validation";
import { ApiResponse, PaginatedResponse } from "@/types";
import {
  Organization,
  OrganizationMember,
} from "@/validations/organization.validation";
import { JobApplicationWithNotes } from "@/validations/jobApplications.validation";

export class OrganizationController extends BaseController {
  private organizationService: OrganizationService;

  constructor() {
    super();
    this.organizationService = new OrganizationService();
  }

  getAllOrganizations = async (
    req: Request,
    res: Response<PaginatedResponse<Organization>>,
  ) => {
    const { page, limit, search } = req.query;
    const options = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      searchTerm: search as string,
    };

    const result = await this.organizationService.getAllOrganizations(options);

    if (result.isSuccess) {
      const { items, pagination } = result.value;
      return this.sendPaginatedResponse<Organization>(
        res,
        items,
        pagination,
        "Organizations retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  getOrganizationById = async (
    req: Request<GetOrganizationSchema["params"]>,
    res: Response<ApiResponse<Organization>>,
  ) => {
    const id = parseInt(req.params.organizationId);
    const organization = await this.organizationService.getOrganizationById(id);

    if (organization.isSuccess) {
      return this.sendSuccess<Organization>(
        res,
        organization.value,
        "Organization retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, organization.error);
    }
  };

  createOrganization = async (
    req: Request<{}, {}, CreateOrganizationSchema["body"]>,
    res: Response<
      ApiResponse<Organization & { members: OrganizationMember[] }>
    >,
  ) => {
    const organizationData = req.body;
    const userId = req.userId;
    const organization = await this.organizationService.createOrganization(
      organizationData,
      userId!,
    );

    if (organization.isSuccess) {
      return this.sendSuccess<Organization & { members: OrganizationMember[] }>(
        res,
        organization.value,
        "Organization created successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, organization.error);
    }
  };

  updateOrganization = async (
    req: Request<
      UpdateOrganizationSchema["params"],
      {},
      UpdateOrganizationSchema["body"]
    >,
    res: Response<ApiResponse<Organization>>,
  ) => {
    const id = parseInt(req.params.organizationId);
    const updateData = req.body;
    const organization = await this.organizationService.updateOrganization(
      id,
      updateData,
    );

    if (organization.isSuccess) {
      return this.sendSuccess<Organization>(
        res,
        organization.value,
        "Organization updated successfully",
      );
    } else {
      return this.handleControllerError(res, organization.error);
    }
  };

  deleteOrganization = async (
    req: Request<DeleteOrganizationSchema["params"]>,
    res: Response<ApiResponse<void>>,
  ) => {
    const id = parseInt(req.params.organizationId);
    const result = await this.organizationService.deleteOrganization(id);

    if (result.isSuccess) {
      return this.sendSuccess(res, null, result.value.message, 204);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  // Job Application Controller methods
  getJobApplicationForOrganization = async (
    req: Request<JobApplicationManagementSchema["params"]>,
    res: Response<ApiResponse<OrganizationJobApplicationsResponse>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const applicationId = parseInt(req.params.applicationId);
    const jobId = parseInt(req.params.jobId);

    const application =
      await this.organizationService.getJobApplicationForOrganization(
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

  updateJobApplicationStatus = async (
    req: Request<
      JobApplicationManagementSchema["params"],
      {},
      UpdateJobStatusInputSchema["body"]
    >,
    res: Response<ApiResponse<OrganizationJobApplicationsResponse>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const applicationId = parseInt(req.params.applicationId);
    const jobId = parseInt(req.params.jobId);

    const application =
      await this.organizationService.updateJobApplicationStatus(
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
      {},
      CreateJobApplicationNoteInputSchema["body"]
    >,
    res: Response<ApiResponse<JobApplicationWithNotes>>,
  ) => {
    const applicationId = parseInt(req.params.applicationId);
    const jobId = parseInt(req.params.jobId);

    const note = req.body;

    const result = await this.organizationService.createJobApplicationNote(
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

    const applicationNotes =
      await this.organizationService.getNotesForJobApplication(organizationId);

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
    res: Response<ApiResponse<JobApplicationsResponseSchema>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const jobId = parseInt(req.params.jobId);

    const applications =
      await this.organizationService.getJobApplicationsForOrganization(
        organizationId,
        jobId,
      );

    if (applications.isSuccess) {
      return this.sendSuccess<JobApplicationsResponseSchema>(
        res,
        applications.value,
        "Job applications retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, applications.error);
    }
  };
}
