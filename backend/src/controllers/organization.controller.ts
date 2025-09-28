import { Request, Response } from 'express';
import { OrganizationService } from '../services/organization.service';
import { BaseController } from './base.controller';
import { AppError, ErrorCode } from '../utils/errors';

export class OrganizationController extends BaseController {
  private organizationService: OrganizationService;

  constructor() {
    super();
    this.organizationService = new OrganizationService();
  }

  getAllOrganizations = async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = req.query;
      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        searchTerm: search as string,
      };

      const result = await this.organizationService.getAllOrganizations(options);
      this.sendPaginatedResponse(res, result.items, result.pagination, 'Organizations retrieved successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to retrieve organizations');
    }
  };

  getOrganizationById = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        throw new AppError('Organization ID is required', 400, ErrorCode.VALIDATION_ERROR);
      }
      const id = parseInt(req.params.id);
      const organization = await this.organizationService.getOrganizationById(id);
      this.sendSuccess(res, organization, 'Organization retrieved successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to retrieve organization');
    }
  };

  createOrganization = async (req: Request, res: Response) => {
    try {
      const organizationData = req.body;
      const organization = await this.organizationService.createOrganization(organizationData);
      this.sendSuccess(res, organization, 'Organization created successfully', 201);
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to create organization', 400);
    }
  };

  updateOrganization = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        throw new AppError('Organization ID is required', 400, ErrorCode.VALIDATION_ERROR);
      }
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const organization = await this.organizationService.updateOrganization(id, updateData);
      this.sendSuccess(res, organization, 'Organization updated successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to update organization');
    }
  };

  deleteOrganization = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        throw new AppError('Organization ID is required', 400, ErrorCode.VALIDATION_ERROR);
      }
      const id = parseInt(req.params.id);
      const result = await this.organizationService.deleteOrganization(id);
      this.sendSuccess(res, result, 'Organization deleted successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to delete organization');
    }
  };
}