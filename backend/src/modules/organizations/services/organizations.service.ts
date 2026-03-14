import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";

import {
  AppError,
  ConflictError,
  DatabaseError,
  ForbiddenError,
  NotFoundError,
} from "@shared/errors";
import { StorageFolder } from "@/workers/file-upload-worker";
import type { FileUploadJobData } from "@/validations/file.validation";
import type { NewOrganization } from "@/validations/organization.validation";
import type { OrganizationsServicePort } from "../ports/organizations-service.port";
import type { OrganizationsRepositoryPort } from "../ports/organizations-repository.port";

/**
 * Service class for managing organization CRUD and membership operations.
 * Does NOT include invitation or employer-facing application methods
 * (those belong to their respective modules).
 */
export class OrganizationsService
  extends BaseService
  implements OrganizationsServicePort
{
  constructor(
    private organizationsRepository: OrganizationsRepositoryPort,
  ) {
    super();
  }

  /**
   * Retrieves all organizations with optional pagination and search.
   * @param options Pagination and search options including page, limit, and searchTerm.
   * @returns A Result containing the organizations or an error.
   */
  async getAllOrganizations(
    options: { page?: number; limit?: number; searchTerm?: string } = {},
  ) {
    try {
      const { searchTerm = "", ...paginationOptions } = options;

      const results =
        await this.organizationsRepository.searchOrganizations(
          searchTerm,
          paginationOptions,
        );

      return ok(results);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch organizations"));
    }
  }

  /**
   * Retrieves an organization by its ID, including members.
   * @param id The ID of the organization.
   * @returns A Result containing the organization or an error.
   */
  async getOrganizationById(id: number) {
    try {
      const organization =
        await this.organizationsRepository.findByIdIncludingMembers(id);
      if (!organization) {
        return fail(new NotFoundError("Organization not found"));
      }

      return ok(organization);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch organization"));
    }
  }

  /**
   * Creates a new organization.
   * @param organizationData The data for the new organization.
   * @param sessionUserId The ID of the user creating the organization.
   * @param correlationId A correlation ID for tracking.
   * @returns A Result containing the created organization or an error.
   */
  async createOrganization(
    organizationData: NewOrganization,
    sessionUserId: number,
    correlationId: string,
  ) {
    try {
      // Check if organization with same name exists
      const existingOrg = await this.organizationsRepository.findByName(
        organizationData.name,
      );
      if (existingOrg) {
        return fail(
          new ConflictError("Organization with this name already exists"),
        );
      }

      const createdOrganization =
        await this.organizationsRepository.createOrganization(
          organizationData,
          sessionUserId,
        );

      if (!createdOrganization) {
        return fail(new DatabaseError("Failed to create organization"));
      }

      // Upload logo to cloud storage if provided in organizationData
      if (organizationData.logo) {
        await queueService.addJob<FileUploadJobData>(
          QUEUE_NAMES.FILE_UPLOAD_QUEUE,
          "uploadFile",
          {
            entityType: "organization",
            entityId: createdOrganization.id.toString(),
            mergeWithExisting: false,
            tempFiles: [
              {
                originalname: organizationData.logo.originalname,
                tempPath: organizationData.logo.path,
                size: organizationData.logo.size,
                mimetype: organizationData.logo.mimetype,
              },
            ],
            userId: sessionUserId.toString(),
            folder: StorageFolder.ORGANIZATION_LOGOS,
            correlationId,
          },
        );
      }

      return ok(createdOrganization);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to create organization"));
    }
  }

  /**
   * Uploads a logo for an organization.
   * @param userId The ID of the user uploading the logo.
   * @param organizationId The ID of the organization.
   * @param logoFile The logo file to upload.
   * @param correlationId A correlation ID for tracking.
   * @returns A Result indicating success or failure.
   */
  async uploadOrganizationLogo(
    userId: number,
    organizationId: number,
    logoFile: Express.Multer.File,
    correlationId: string,
  ) {
    try {
      await queueService.addJob<FileUploadJobData>(
        QUEUE_NAMES.FILE_UPLOAD_QUEUE,
        "uploadFile",
        {
          entityType: "organization",
          entityId: organizationId.toString(),
          mergeWithExisting: true,
          tempFiles: [
            {
              originalname: logoFile.originalname,
              tempPath: logoFile.path,
              size: logoFile.size,
              mimetype: logoFile.mimetype,
            },
          ],
          userId: userId.toString(),
          folder: StorageFolder.ORGANIZATION_LOGOS,
          correlationId,
        },
      );

      return ok({ message: "Logo upload initiated" });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to upload organization logo"));
    }
  }

  /**
   * Updates an existing organization.
   * @param id The ID of the organization to update.
   * @param updateData The data to update.
   * @returns A Result containing the updated organization or an error.
   */
  async updateOrganization(id: number, updateData: Partial<NewOrganization>) {
    try {
      const success = await this.organizationsRepository.update(id, updateData);
      if (!success) {
        return fail(new DatabaseError("Failed to update organization"));
      }

      return await this.getOrganizationById(id);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update organization"));
    }
  }

  /**
   * Deletes an organization.
   * @param id The ID of the organization to delete.
   * @returns A Result containing a success message or an error.
   */
  async deleteOrganization(id: number) {
    try {
      const success = await this.organizationsRepository.delete(id);
      if (!success) {
        return fail(new Error("Failed to delete organization"));
      }

      return ok({ message: "Organization deleted successfully" });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to delete organization"));
    }
  }

  /**
   * Checks if a user has permission to post jobs.
   * @param userId The ID of the user.
   * @returns A Result containing the permission status or an error.
   */
  async isRolePermitted(userId: number) {
    try {
      return ok(await this.organizationsRepository.canPostJobs(userId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(
        new DatabaseError("Failed to verify permission to post jobs"),
      );
    }
  }

  /**
   * Checks if a user has permission to reject applications for an organization.
   * @param userId The ID of the user.
   * @param organizationId The ID of the organization.
   * @returns A Result containing the permission status or an error.
   */
  async isRolePermittedToRejectApplications(
    userId: number,
    organizationId: number,
  ) {
    try {
      const canReject =
        await this.organizationsRepository.canRejectJobApplications(
          userId,
          organizationId,
        );

      if (!canReject) {
        return fail(
          new ForbiddenError(
            "User does not have permission to reject applications",
          ),
        );
      }

      return ok(canReject);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(
        new DatabaseError(
          "Failed to verify permission to reject applications",
        ),
      );
    }
  }

  /**
   * Retrieves organization members by their role.
   * @param organizationId The ID of the organization.
   * @param role The role to filter by (owner, admin, recruiter).
   * @returns A Result containing the members or an error.
   */
  async getOrganizationMembersByRole(
    organizationId: number,
    role: "owner" | "admin" | "recruiter",
  ) {
    try {
      const members =
        await this.organizationsRepository.getOrganizationMembersByRole(
          organizationId,
          role,
        );

      if (!members) {
        return fail(
          new NotFoundError("No members found with the specified role"),
        );
      }
      return ok(members);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch organization members"));
    }
  }

  /**
   * Retrieves the organization member for a given user.
   * @param sessionUserId The ID of the user.
   * @param organizationId The ID of the organization.
   * @returns A Result containing the member or an error.
   */
  async getOrganizationMember(sessionUserId: number, organizationId: number) {
    try {
      const member = await this.organizationsRepository.findByContact(
        sessionUserId,
        organizationId,
      );
      if (!member) {
        return fail(new NotFoundError("Organization member not found"));
      }
      return ok(member);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch organization member"));
    }
  }

  /**
   * Retrieves the first active organization membership for a user.
   * @param userId The ID of the user.
   * @returns A Result containing the member or an error.
   */
  async getFirstOrganizationForUser(userId: number) {
    try {
      const member =
        await this.organizationsRepository.findMemberByUserId(userId);
      if (!member) {
        return fail(new NotFoundError("Organization member not found"));
      }
      return ok(member);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch organization member"));
    }
  }

  /**
   * Retrieves all active organizations for a user.
   * @param userId The ID of the user.
   * @returns A Result containing the memberships or an error.
   */
  async getUserOrganizations(userId: number) {
    try {
      const memberships =
        await this.organizationsRepository.getUserOrganizations(userId);
      return ok(memberships);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch user organizations"));
    }
  }

  /**
   * Checks if a user has delete permission for an organization.
   * @param userId The ID of the user.
   * @param organizationId The ID of the organization.
   * @returns A boolean indicating if the user has delete permission.
   */
  async hasDeletePermission(
    userId: number,
    organizationId: number,
  ): Promise<boolean> {
    try {
      return await this.organizationsRepository.hasDeletePermission(
        userId,
        organizationId,
      );
    } catch (error) {
      return false;
    }
  }
}
