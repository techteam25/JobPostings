import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import {
  type ApiResponse,
  type EmptyBody,
  type PaginatedResponse,
} from "@shared/types";
import { AppError, ErrorCode } from "@shared/errors";
import type {
  CreateOrganizationSchema,
  DeleteOrganizationSchema,
  GetOrganizationSchema,
  UpdateOrganizationSchema,
  UploadOrganizationLogoSchema,
  Organization,
  OrganizationMember,
} from "@/validations/organization.validation";
import type { GetUserSchema } from "@/validations/user.validation";
import type { SearchParams } from "@/validations/base.validation";
import type { OrganizationsServicePort } from "../ports/organizations-service.port";

/**
 * Controller class for handling organization CRUD API endpoints.
 * Does NOT handle invitation or employer-facing application endpoints
 * (those belong to their respective module controllers).
 */
export class OrganizationsController extends BaseController {
  constructor(private organizationsService: OrganizationsServicePort) {
    super();
  }

  /**
   * Retrieves all organizations with pagination and search.
   * @param req The Express request object with query parameters.
   * @param res The Express response object.
   */
  getAllOrganizations = async (
    req: Request<EmptyBody, EmptyBody, EmptyBody, SearchParams["query"]>,
    res: Response<PaginatedResponse<Organization>>,
  ) => {
    const { page, limit, q: search } = req.query;
    const options = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      searchTerm: search,
    };

    const result = await this.organizationsService.getAllOrganizations(options);

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
    const organization =
      await this.organizationsService.getOrganizationById(id);

    if (organization.isSuccess) {
      return this.sendSuccess(
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
      await this.organizationsService.getFirstOrganizationForUser(memberId);

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
    req: Request<EmptyBody, EmptyBody, CreateOrganizationSchema["body"]>,
    res: Response<
      ApiResponse<Organization & { members: OrganizationMember[] }>
    >,
  ) => {
    const organizationData = { ...req.body, logo: req.file };

    const userId = req.userId;
    const organization = await this.organizationsService.createOrganization(
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
      EmptyBody,
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

    const result = await this.organizationsService.uploadOrganizationLogo(
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
      EmptyBody,
      UpdateOrganizationSchema["body"]
    >,
    res: Response<ApiResponse<Organization>>,
  ) => {
    const id = parseInt(req.params.organizationId);
    const updateData = req.body;
    const organization = await this.organizationsService.updateOrganization(
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
    const result = await this.organizationsService.deleteOrganization(id);

    if (result.isSuccess) {
      return this.sendSuccess(res, null, result.value.message, 204);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
