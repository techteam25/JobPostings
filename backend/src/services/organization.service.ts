import { OrganizationRepository } from '../repositories/organization.repository';
import { BaseService } from './base.service';
import { NewOrganization } from '../db/schema/organizations';

export class OrganizationService extends BaseService {
  private organizationRepository: OrganizationRepository;

  constructor() {
    super();
    this.organizationRepository = new OrganizationRepository();
  }

  async getAllOrganizations(options: { page?: number; limit?: number; searchTerm?: string } = {}) {
    try {
      const { searchTerm, ...paginationOptions } = options;

      if (searchTerm) {
        return await this.organizationRepository.searchOrganizations(searchTerm, paginationOptions);
      }

      return await this.organizationRepository.findAll(paginationOptions);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getOrganizationById(id: number) {
    try {
      const organization = await this.organizationRepository.findById(id);
      if (!organization) {
        throw new Error('Organization not found');
      }

      return organization;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createOrganization(organizationData: NewOrganization) {
    try {
      // Check if organization with same name exists
      const existingOrg = await this.organizationRepository.findByName(organizationData.name);
      if (existingOrg) {
        throw new Error('Organization with this name already exists');
      }

      const organizationId = await this.organizationRepository.create(organizationData);
      return await this.getOrganizationById(Number(organizationId));
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateOrganization(id: number, updateData: Partial<NewOrganization>) {
    try {
      const success = await this.organizationRepository.update(id, updateData);
      if (!success) {
        throw new Error('Failed to update organization');
      }

      return await this.getOrganizationById(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteOrganization(id: number) {
    try {
      const success = await this.organizationRepository.delete(id);
      if (!success) {
        throw new Error('Failed to delete organization');
      }

      return { message: 'Organization deleted successfully' };
    } catch (error) {
      this.handleError(error);
    }
  }
}
