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
import { DatabaseError } from "@/utils/errors";

export class OrganizationController extends BaseController {
  private organizationService: OrganizationService;

  constructor() {
    super();
    this.organizationService = new OrganizationService();
  }

  getAllOrganizations = async (
    req: Request,
    res: Response<PaginatedResponse<Organization[]>>,
  ) => {
    try {
      const { page, limit, search } = req.query;
      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        searchTerm: search as string,
      };

      const { items, pagination } =
        await this.organizationService.getAllOrganizations(options);

      return res.json({
        success: true,
        message: "Organizations retrieved successfully",
        data: items,
        pagination,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to retrieve organizations",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  getOrganizationById = async (
    req: Request<GetOrganizationSchema["params"]>,
    res: Response<ApiResponse<Organization>>,
  ) => {
    try {
      const id = parseInt(req.params.organizationId);
      const organization =
        await this.organizationService.getOrganizationById(id);

      return res.json({
        success: true,
        message: "Organization retrieved successfully",
        data: organization,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to retrieve organization",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  createOrganization = async (
    req: Request<{}, {}, CreateOrganizationSchema["body"]>,
    res: Response<
      ApiResponse<Organization & { members: OrganizationMember[] }>
    >,
  ) => {
    try {
      const organizationData = req.body;
      const userId = req.userId;
      const organization = await this.organizationService.createOrganization(
        organizationData,
        userId!,
      );

      return res.status(201).json({
        success: true,
        message: "Organization created successfully",
        data: organization,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to create organization",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
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
    try {
      const id = parseInt(req.params.organizationId);
      const updateData = req.body;
      const organization = await this.organizationService.updateOrganization(
        id,
        updateData,
      );

      if (!organization) {
        return res.status(400).json({
          success: false,
          status: "error",
          message: "Failed to update organization",
          timestamp: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        message: "Organization updated successfully",
        data: organization,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to update organization",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  deleteOrganization = async (
    req: Request<DeleteOrganizationSchema["params"]>,
    res: Response<ApiResponse<void>>,
  ) => {
    try {
      const id = parseInt(req.params.organizationId);
      const result = await this.organizationService.deleteOrganization(id);
      return res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete organization",
        status: "error",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
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

    try {
      const application =
        await this.organizationService.getJobApplicationForOrganization(
          organizationId,
          jobId,
          applicationId,
        );

      return res.json({
        success: true,
        message: "Job application retrieved successfully",
        data: application,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.message === "Job application not found for organization"
      ) {
        return res.status(404).json({
          success: false,
          status: "error",
          message: "Job application not found",
          error: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to retrieve job application",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
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

    try {
      const application =
        await this.organizationService.updateJobApplicationStatus(
          organizationId,
          jobId,
          applicationId,
          req.body.status,
        );

      return res.json({
        success: true,
        message: "Job application status updated successfully",
        data: application,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to update job application status",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
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

    try {
      const result = await this.organizationService.createJobApplicationNote(
        applicationId,
        jobId,
        note,
      );

      return res.status(201).json({
        success: true,
        data: result,
        message: "Note added to job application successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to create job application note",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  getNotesForJobApplication = async (
    req: Request<JobApplicationManagementSchema["params"]>,
    res: Response<ApiResponse<{ note: string; createdAt: Date }[]>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const applicationId = parseInt(req.params.applicationId);
    const jobId = parseInt(req.params.jobId);

    try {
      const applicationNotes =
        await this.organizationService.getNotesForJobApplication(
          organizationId,
          jobId,
          applicationId,
        );

      return res.json({
        success: true,
        message: "Job application notes retrieved successfully",
        data: applicationNotes,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof DatabaseError) {
        return res.status(404).json({
          success: false,
          status: "error",
          message: error.message,
          error: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to retrieve job application notes",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  getJobApplicationsForOrganization = async (
    req: Request<JobApplicationsManagementSchema["params"]>,
    res: Response<ApiResponse<JobApplicationsResponseSchema>>,
  ) => {
    const organizationId = parseInt(req.params.organizationId);
    const jobId = parseInt(req.params.jobId);

    try {
      const applications =
        await this.organizationService.getJobApplicationsForOrganization(
          organizationId,
          jobId,
        );

      return res.json({
        success: true,
        message: "Job applications retrieved successfully",
        data: applications,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.message === "Organization not found"
      ) {
        return res.status(404).json({
          success: false,
          status: "error",
          message: "Organization not found",
          timestamp: new Date().toISOString(),
        });
      }
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Failed to retrieve job applications",
        timestamp: new Date().toISOString(),
      });
    }
  };
}
