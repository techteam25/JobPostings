import { BaseService, fail, ok, Result } from "./base.service";
import { OrganizationRepository } from "@/repositories/organization.repository";

import { statusRegressionGuard } from "@/utils/update-status-guard";

import {
  CreateJobApplicationNoteInputSchema,
  NewOrganization,
  OrganizationJobApplicationsResponse,
} from "@/validations/organization.validation";

import {
  AppError,
  ConflictError,
  DatabaseError,
  ForbiddenError,
  NotFoundError,
} from "@/utils/errors";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";
import { StorageFolder } from "@/workers/file-upload-worker";
import { FileUploadJobData } from "@/validations/file.validation";

/**
 * Service class for managing organization-related operations, including CRUD for organizations and their members.
 */
export class OrganizationService extends BaseService {
  private organizationRepository: OrganizationRepository;

  /**
   * Creates an instance of OrganizationService and initializes the repository.
   */
  constructor() {
    super();
    this.organizationRepository = new OrganizationRepository();
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

      const results = await this.organizationRepository.searchOrganizations(
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
        await this.organizationRepository.findByIdIncludingMembers(id);
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
      const existingOrg = await this.organizationRepository.findByName(
        organizationData.name,
      );
      if (existingOrg) {
        return fail(
          new ConflictError("Organization with this name already exists"),
        );
      }

      const createdOrganization =
        await this.organizationRepository.createOrganization(
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

  /**   * Uploads a logo for an organization.
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
      const success = await this.organizationRepository.update(id, updateData);
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
      const success = await this.organizationRepository.delete(id);
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
      return ok(await this.organizationRepository.canPostJobs(userId));
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
        await this.organizationRepository.canRejectJobApplications(
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
        new DatabaseError("Failed to verify permission to reject applications"),
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
        await this.organizationRepository.getOrganizationMembersByRole(
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
   * @returns A Result containing the member or an error.
   */
  async getOrganizationMember(sessionUserId: number) {
    try {
      const member =
        await this.organizationRepository.findByContact(sessionUserId);
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
   * Retrieves a specific job application for an organization.
   * @param organizationId The ID of the organization.
   * @param jobId The ID of the job.
   * @param applicationId The ID of the application.
   * @returns A Result containing the job application or an error.
   */
  async getJobApplicationForOrganization(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ): Promise<Result<OrganizationJobApplicationsResponse, AppError>> {
    try {
      const jobApplications =
        await this.organizationRepository.getJobApplicationForOrganization(
          organizationId,
          jobId,
          applicationId,
        );

      if (!jobApplications) {
        return fail(new NotFoundError("Job application not found"));
      }

      return ok(jobApplications);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch job application"));
    }
  }

  /**
   * Updates the status of a job application.
   * @param organizationId The ID of the organization.
   * @param jobId The ID of the job.
   * @param applicationId The ID of the application.
   * @param status The new status for the application.
   * @returns A Result containing the updated application or an error.
   */
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
      const application = await this.getJobApplicationForOrganization(
        organizationId,
        jobId,
        applicationId,
      );

      if (application.isFailure) {
        return this.handleError(application.error);
      }

      const updateStatus = statusRegressionGuard(
        application.value.status,
        status,
      );

      const updatedApplication =
        await this.organizationRepository.updateJobApplicationStatus(
          organizationId,
          jobId,
          applicationId,
          updateStatus,
        );

      if (!updatedApplication) {
        return fail(
          new DatabaseError("Failed to update job application status"),
        );
      }

      return ok(updatedApplication);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update job application status"));
    }
  }

  /**
   * Creates a note for a job application.
   * @param applicationId The ID of the application.
   * @param userId The ID of the user creating the note.
   * @param body The body containing the note.
   * @returns A Result containing the application with notes or an error.
   */
  async createJobApplicationNote(
    applicationId: number,
    userId: number,
    body: CreateJobApplicationNoteInputSchema["body"],
  ) {
    try {
      const { note } = body;
      const applicationWithNotes =
        await this.organizationRepository.createJobApplicationNote({
          applicationId,
          userId,
          note,
        });

      if (!applicationWithNotes) {
        return fail(new DatabaseError("Failed to create job application note"));
      }
      return ok(applicationWithNotes);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to create job application note"));
    }
  }

  /**
   * Retrieves notes for a specific job application.
   * @param organizationId The ID of the organization.
   * @param jobId The ID of the job.
   * @param applicationId The ID of the application.
   * @returns A Result containing the notes or an error.
   */
  async getNotesForJobApplication(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ) {
    try {
      const notesForApplications =
        await this.organizationRepository.getNotesForJobApplication(
          organizationId,
          jobId,
          applicationId,
        );

      if (!notesForApplications) {
        return fail(new NotFoundError("No notes found for job application"));
      }
      return ok(notesForApplications);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(
        new DatabaseError("Failed to fetch notes for job application"),
      );
    }
  }

  /**
   * Retrieves job applications for a specific job in an organization.
   * @param organizationId The ID of the organization.
   * @param jobId The ID of the job.
   * @returns A Result containing the applications or an error.
   */
  async getJobApplicationsForOrganization(
    organizationId: number,
    jobId: number,
  ) {
    try {
      const applications =
        await this.organizationRepository.getJobApplicationsForOrganization(
          organizationId,
          jobId,
        );
      if (!applications) {
        return fail(new NotFoundError("No applications found for this job"));
      }
      return ok(applications);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(
        new DatabaseError("Failed to fetch applications for this job"),
      );
    }
  }

  /**
   * Retrieves all applications for an organization with pagination.
   * @param organizationId The ID of the organization.
   * @param options Pagination options including page and limit.
   * @returns A Result containing the applications or an error.
   */
  async getApplicationsForOrganization(
    organizationId: number,
    options: { page?: number; limit?: number },
  ) {
    try {
      const applications =
        await this.organizationRepository.getApplicationsForOrganization(
          organizationId,
          options,
        );
      if (!applications) {
        return fail(
          new NotFoundError("No applications found for this organization"),
        );
      }
      return ok(applications);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(
        new DatabaseError("Failed to fetch applications for this organization"),
      );
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
      return await this.organizationRepository.hasDeletePermission(
        userId,
        organizationId,
      );
    } catch (error) {
      return false;
    }
  }
}
