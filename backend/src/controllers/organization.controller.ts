import { Request, Response } from 'express';
import { OrganizationService } from '../services/organization.service';
import { BaseController } from './base.controller';

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
      const message = error instanceof Error ? error.message : 'Failed to retrieve organizations';
      this.sendError(res, message);
    }
  };

  getOrganizationById = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'Organization ID is required', 400);
      }
      const id = parseInt(req.params.id);
      const organization = await this.organizationService.getOrganizationById(id);
      this.sendSuccess(res, organization, 'Organization retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve organization';
      const statusCode = message === 'Organization not found' ? 404 : 500;
      this.sendError(res, message, statusCode);
    }
  };

  createOrganization = async (req: Request, res: Response) => {
    try {
      const organizationData = req.body;
      const organization = await this.organizationService.createOrganization(organizationData);
      this.sendSuccess(res, organization, 'Organization created successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization';
      this.sendError(res, message, 400);
    }
  };

  updateOrganization = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'Organization ID is required', 400);
      }
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const organization = await this.organizationService.updateOrganization(id, updateData);
      this.sendSuccess(res, organization, 'Organization updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update organization';
      this.sendError(res, message);
    }
  };

  deleteOrganization = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'Organization ID is required', 400);
      }
      const id = parseInt(req.params.id);
      const result = await this.organizationService.deleteOrganization(id);
      this.sendSuccess(res, result, 'Organization deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete organization';
      this.sendError(res, message);
    }
  };
}
