import { Request, Response } from "express";
import { OrganizationService } from "@/services/organization.service";
import { BaseController } from "./base.controller";
import {
  CreateJobApplicationNoteInputSchema,
  CreateOrganizationSchema,
  CreateOrganizationInvitationInput,
  DeleteOrganizationSchema,
  GetOrganizationSchema,
  JobApplicationManagementSchema,
  JobApplicationsManagementSchema,
  JobApplicationsResponseSchema,
  OrganizationJobApplications,
  OrganizationJobApplicationsResponse,
  OrganizationWithMembers,
  UpdateJobStatusInputSchema,
  UpdateOrganizationSchema,
  UploadOrganizationLogoSchema,
  GetOrganizationInvitationDetailsInput,
  AcceptOrganizationInvitationInput,
  CancelOrganizationInvitationInput,
} from "@/validations/organization.validation";
import { ApiResponse, PaginatedResponse } from "@/types";
import {
  Organization,
  OrganizationMember,
} from "@/validations/organization.validation";
import { JobApplicationWithNotes } from "@/validations/jobApplications.validation";
import { GetUserSchema } from "@/validations/user.validation";
import { SearchParams } from "@/validations/base.validation";
import { AppError, ErrorCode } from "@/utils/errors";

/**
 * Controller class for handling organization-related API endpoints.
 */
export class OrganizationController extends BaseController {
  private organizationService: OrganizationService;

  /**
   * Creates an instance of OrganizationController and initializes the required services.
   */
  constructor() {
    super();
    this.organizationService = new OrganizationService();
  }

  /**
   * Retrieves all organizations with pagination and search.
   * @param req The Express request object with query parameters.
   * @param res The Express response object.
   */
  getAllOrganizations = async (
    req: Request<{}, {}, {}, SearchParams["query"]>,
    res: Response<PaginatedResponse<Organization>>,
  ) => {
    const { page, limit, q: search } = req.query;
    const options = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      searchTerm: search,
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

  /**
   * Retrieves an organization by its ID, including members.
   * @param req The Express request object with organization ID parameters.
   * @param res The Express response object.
   */
  getOrganizationById = async (
    req: Request<GetOrganizationSchema["params"]>,
    res: Response<ApiResponse<Organization>>,
  ) => {
    const id = parseInt(req.params.organizationId);
    const organization = await this.organizationService.getOrganizationById(id);

    if (organization.isSuccess) {
      return this.sendSuccess<OrganizationWithMembers>(
        res,
        organization.value,
        "Organization retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, organization.error);
    }
  };

  /**
   * Retrieves the organization ID for a given member ID.
   * @param req The Express request object with user ID parameters.
   * @param res The Express response object.
   */
  getOrganizationIdByMemberId = async (
    req: Request<GetUserSchema["params"]>,
    res: Response<ApiResponse<OrganizationMember>>,
  ) => {
    const memberId = parseInt(req.params.id);
    const organization =
      await this.organizationService.getFirstOrganizationForUser(memberId);

    if (organization.isSuccess) {
      return this.sendSuccess<{ organizationId: number }>(
        res,
        { organizationId: organization.value.organizationId },
        "Organization retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, organization.error);
    }
  };

  /**
   * Creates a new organization.
   * @param req The Express request object with organization creation data.
   * @param res The Express response object.
   */
  createOrganization = async (
    req: Request<{}, {}, CreateOrganizationSchema["body"]>,
    res: Response<
      ApiResponse<Organization & { members: OrganizationMember[] }>
    >,
  ) => {
    const organizationData = { ...req.body, logo: req.file };

    const userId = req.userId;
    const organization = await this.organizationService.createOrganization(
      organizationData,
      userId!,
      req.correlationId!,
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

  /**
   * Uploads a logo for an organization.
   * @param req The Express request object with organization ID parameters and file upload.
   * @param res The Express response object.
   */
  uploadOrganizationLogo = async (
    req: Request<
      UploadOrganizationLogoSchema["params"],
      {},
      UploadOrganizationLogoSchema["body"]
    >,
    res: Response<ApiResponse<Organization>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const file = req.file;

    if (!file) {
      const error = new AppError(
        "No file uploaded",
        400,
        ErrorCode.BAD_REQUEST,
      );
      return this.sendError(res, error);
    }

    const result = await this.organizationService.uploadOrganizationLogo(
      req.userId!,
      organizationId,
      file,
      req.correlationId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess<{ message: string }>(
        res,
        result.value,
        "Organization logo uploaded successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Updates an existing organization.
   * @param req The Express request object with organization update data.
   * @param res The Express response object.
   */
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

  /**
   * Deletes an organization.
   * @param req The Express request object with organization ID parameters.
   * @param res The Express response object.
   */
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
  /**
   * Retrieves a specific job application for an organization.
   * @param req The Express request object with organization, job, and application ID parameters.
   * @param res The Express response object.
   */
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

  /**
   * Updates the status of a job application.
   * @param req The Express request object with organization, job, and application ID parameters and status update data.
   * @param res The Express response object.
   */
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

  /**
   * Attaches a note to a job application.
   * @param req The Express request object with organization, job, and application ID parameters and note data.
   * @param res The Express response object.
   */
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

  /**
   * Retrieves notes for a specific job application.
   * @param req The Express request object with organization, job, and application ID parameters.
   * @param res The Express response object.
   */
  getNotesForJobApplication = async (
    req: Request<JobApplicationManagementSchema["params"]>,
    res: Response<ApiResponse<{ note: string; createdAt: Date }[]>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const applicationId = parseInt(req.params.applicationId);
    const jobId = parseInt(req.params.jobId);

    const applicationNotes =
      await this.organizationService.getNotesForJobApplication(
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

  /**
   * Retrieves job applications for a specific job in an organization.
   * @param req The Express request object with organization and job ID parameters.
   * @param res The Express response object.
   */
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

  /**
   * Retrieves all applications for an organization with pagination.
   * @param req The Express request object with organization ID parameters and query parameters.
   * @param res The Express response object.
   */
  getApplicationsForOrganization = async (
    req: Request<
      GetOrganizationSchema["params"],
      {},
      {},
      GetOrganizationSchema["query"]
    >,
    res: Response<PaginatedResponse<OrganizationJobApplications>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const { page, limit } = req.query;

    const applications =
      await this.organizationService.getApplicationsForOrganization(
        organizationId,
        { page, limit },
      );

    if (applications.isSuccess) {
      const { items, pagination } = applications.value;
      return this.sendPaginatedResponse<OrganizationJobApplications>(
        res,
        items,
        pagination,
        "Job applications retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, applications.error);
    }
  };

  /**
   * Sends an invitation to join an organization.
   * @param req The Express request object with organization ID and invitation data.
   * @param res The Express response object.
   */
  sendInvitation = async (
    req: Request<
      CreateOrganizationInvitationInput["params"],
      {},
      CreateOrganizationInvitationInput["body"]
    >,
    res: Response<ApiResponse<{ invitationId: number; message: string }>>,
  ) => {
    // Note: Authentication is validated by middleware before this method is called.
    const organizationId = parseInt(req.params.organizationId);
    const { email, role } = req.body;

    const result = await this.organizationService.sendInvitation(
      organizationId,
      email,
      role,
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, result.value.message, 201);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Gets invitation details by token (public endpoint).
   * @param req The Express request object with invitation token.
   * @param res The Express response object.
   */
  getInvitationDetails = async (
    req: Request<GetOrganizationInvitationDetailsInput["params"]>,
    res: Response<
      ApiResponse<{
        organizationName: string;
        role: string;
        inviterName: string;
        expiresAt: Date;
      }>
    >,
  ) => {
    const { token, organizationId } = req.params;

    const result = await this.organizationService.getInvitationDetails(
      token,
      parseInt(organizationId),
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Invitation details retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Accepts an organization invitation (authenticated endpoint).
   * @param req The Express request object with invitation token.
   * @param res The Express response object.
   */
  acceptInvitation = async (
    req: Request<AcceptOrganizationInvitationInput["params"]>,
    res: Response<ApiResponse<{ message: string }>>,
  ) => {
    // Note: Authentication is validated by middleware before this method is called.
    const { token, organizationId } = req.params;

    const result = await this.organizationService.acceptInvitation(
      token,
      req.userId!,
      parseInt(organizationId),
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, result.value.message, 200);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Cancels an organization invitation (authenticated endpoint, admin/owner only).
   * @param req The Express request object with organization ID and invitation ID.
   * @param res The Express response object.
   */
  cancelInvitation = async (
    req: Request<CancelOrganizationInvitationInput["params"]>,
    res: Response<ApiResponse<{ message: string }>>,
  ) => {
    // Note: Authentication is validated by middleware before this method is called.
    const organizationId = parseInt(req.params.organizationId);
    const invitationId = parseInt(req.params.invitationId);

    const result = await this.organizationService.cancelInvitation(
      organizationId,
      invitationId,
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, result.value.message, 200);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
