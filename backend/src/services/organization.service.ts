import { OrganizationRepository } from "@/repositories/organization.repository";
import { BaseService } from "./base.service";
import {
  CreateJobApplicationNoteInputSchema,
  NewOrganization,
  OrganizationJobApplicationsResponse,
} from "@/validations/organization.validation";
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

  async isRolePermittedToRejectApplications(
    userId: number,
    organizationId: number,
  ) {
    return await this.organizationRepository.canRejectJobApplications(
      userId,
      organizationId,
    );
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

  async getJobApplicationForOrganization(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<OrganizationJobApplicationsResponse> {
    try {
      return await this.organizationRepository.getJobApplicationForOrganization(
        organizationId,
        jobId,
        applicationId,
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateJobApplicationStatus(
    organizationId: number,
    jobId: number,
    applicationId: number,
    status:
      | "pending"
      | "reviewed"
      | "shortlisted"
      | "interviewing"
      | "rejected"
      | "hired"
      | "withdrawn",
  ) {
    try {
      const updateStatusProgressionMap = {
        pending: ["reviewed", "withdrawn"],
        reviewed: ["shortlisted", "rejected", "withdrawn"],
        shortlisted: ["interviewing", "rejected", "withdrawn"],
        interviewing: ["hired", "rejected", "withdrawn"],
        rejected: [] as string[],
        hired: [] as string[],
        withdrawn: [] as string[],
      };

      const application = await this.getJobApplicationForOrganization(
        organizationId,
        jobId,
        applicationId,
      );

      const allowedNextStatuses =
        updateStatusProgressionMap[application.status];

      if (!allowedNextStatuses.includes(status)) {
        return this.handleError(
          new ConflictError(
            `Invalid status transition from ${application.status} to ${status}`,
          ),
        );
      }

      return this.organizationRepository.updateJobApplicationStatus(
        organizationId,
        jobId,
        applicationId,
        status,
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async createJobApplicationNote(
    applicationId: number,
    userId: number,
    body: CreateJobApplicationNoteInputSchema["body"],
  ) {
    try {
      const { note } = body;
      return this.organizationRepository.createJobApplicationNote({
        applicationId,
        userId,
        note,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getNotesForJobApplication(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ) {
    try {
      return this.organizationRepository.getNotesForJobApplication(
        organizationId,
        jobId,
        applicationId,
      );
    } catch (error) {
      this.handleError(error);
    }
  }
}
