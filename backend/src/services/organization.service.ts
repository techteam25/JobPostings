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

  async createOrganization(
    organizationData: NewOrganization,
    sessionUserId: number,
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

      // Todo: upload logo to cloud storage if provided in organizationData.logo

      const createdOrganization =
        await this.organizationRepository.createOrganization(
          organizationData,
          sessionUserId,
        );

      if (!createdOrganization) {
        return fail(new DatabaseError("Failed to create organization"));
      }

      return ok(createdOrganization);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to create organization"));
    }
  }

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
}
