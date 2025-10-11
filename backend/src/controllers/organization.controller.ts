import { Request, Response } from "express";
import { OrganizationService } from "@/services/organization.service";
import { BaseController } from "./base.controller";
import {
  CreateOrganizationSchema,
  DeleteOrganizationSchema,
  GetOrganizationSchema,
  UpdateOrganizationSchema,
} from "@/validations/organization.validation";
import { ApiResponse, PaginatedResponse } from "@/types";
import { Organization } from "@/db/schema";

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
    res: Response<ApiResponse<Organization>>,
  ) => {
    try {
      const organizationData = req.body;
      const organization =
        await this.organizationService.createOrganization(organizationData);

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
}
