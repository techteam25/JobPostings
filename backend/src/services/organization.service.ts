import { OrganizationRepository } from "@/repositories/organization.repository";
import { BaseService } from "./base.service";
import { NewOrganization } from "@/validations/organization.validation";
import { ConflictError, NotFoundError } from "@/utils/errors";

export class OrganizationService extends BaseService {
  private organizationRepository: OrganizationRepository;

  constructor() {
    super();
    this.organizationRepository = new OrganizationRepository();
  }

  async getAllOrganizations(
    options: { page?: number; limit?: number; searchTerm?: string } = {},
  ) {
    try {
      const { searchTerm, ...paginationOptions } = options;

      if (searchTerm) {
        return await this.organizationRepository.searchOrganizations(
          searchTerm,
          paginationOptions,
        );
      }

      return await this.organizationRepository.findAll(paginationOptions);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getOrganizationById(id: number) {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    return organization;
  }

  async createOrganization(
    organizationData: NewOrganization,
    sessionUserId: number,
  ) {
    // Check if organization with same name exists
    const existingOrg = await this.organizationRepository.findByName(
      organizationData.name,
    );
    if (existingOrg) {
      throw new ConflictError("Organization with this name already exists");
    }

    const createdOrganization =
      await this.organizationRepository.createOrganization(
        organizationData,
        sessionUserId,
      );

    if (!createdOrganization) {
      throw new Error("Failed to create organization");
    }

    return createdOrganization;
  }

  async updateOrganization(id: number, updateData: Partial<NewOrganization>) {
    const success = await this.organizationRepository.update(id, updateData);
    if (!success) {
      throw new Error("Failed to update organization");
    }

    return await this.getOrganizationById(id);
  }

  async deleteOrganization(id: number) {
    const success = await this.organizationRepository.delete(id);
    if (!success) {
      throw new Error("Failed to delete organization");
    }

    return { message: "Organization deleted successfully" };
  }

  async isRolePermitted(userId: number) {
    return await this.organizationRepository.canPostJobs(userId);
  }

  async getOrganizationMembersByRole(
    organizationId: number,
    role: "owner" | "admin" | "recruiter",
  ) {
    try {
      return await this.organizationRepository.getOrganizationMembersByRole(
        organizationId,
        role,
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async getOrganizationMember(sessionUserId: number) {
    try {
      return await this.organizationRepository.findByContact(sessionUserId);
    } catch (error) {
      this.handleError(error);
    }
  }
}
