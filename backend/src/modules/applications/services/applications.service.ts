import { Result, fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  DatabaseError,
  AppError,
} from "@shared/errors";
import { SecurityUtils } from "@shared/utils/security";
import { StorageFolder } from "@shared/constants/storage-folders";
import logger from "@shared/logger";
import { statusRegressionGuard } from "@/utils/update-status-guard";

import type { ApplicationsServicePort } from "@/modules/applications";
import type { ApplicationsRepositoryPort } from "@/modules/applications";
import type { JobDetailsQueryPort } from "@/modules/applications/ports/job-details-query.port";
import type { OrgMembershipQueryPort } from "@/modules/applications/ports/org-membership-query.port";
import type { ApplicantQueryPort } from "@/modules/applications/ports/applicant-query.port";
import type { EventBusPort } from "@shared/events";
import { createApplicationSubmittedEvent } from "@/modules/applications/events/application-submitted.event";

import type {
  NewJobApplication,
  UpdateJobApplication,
} from "@/validations/job.validation";
import type { ApplicationQueryParams } from "@/validations/jobApplications.validation";
import type { FileUploadJobData } from "@/validations/file.validation";
import type { CreateJobApplicationNoteInputSchema } from "@/validations/organization.validation";

export class ApplicationsService
  extends BaseService
  implements ApplicationsServicePort
{
  constructor(
    private applicationsRepository: ApplicationsRepositoryPort,
    private jobDetailsQuery: JobDetailsQueryPort,
    private orgMembershipQuery: OrgMembershipQueryPort,
    private applicantQuery: ApplicantQueryPort,
    private eventBus: EventBusPort,
  ) {
    super();
  }

  async applyForJob(
    applicationData: NewJobApplication & {
      resume?: Express.Multer.File;
      coverLetterFile?: Express.Multer.File;
    },
    correlationId: string,
  ): Promise<Result<{ applicationId: number; message: string }, Error>> {
    try {
      const jobData = await this.jobDetailsQuery.getJobForApplication(
        applicationData.jobId,
      );

      if (!jobData) {
        return fail(new NotFoundError("Job", applicationData.jobId));
      }
      if (!jobData.isActive) {
        return fail(
          new ValidationError("This job is no longer accepting applications"),
        );
      }

      if (
        jobData.applicationDeadline &&
        new Date() > new Date(jobData.applicationDeadline)
      ) {
        return fail(new ValidationError("The application deadline has passed"));
      }

      const hasApplied = await this.applicationsRepository.hasUserAppliedToJob(
        applicationData.applicantId,
        applicationData.jobId,
      );

      if (hasApplied) {
        return fail(new ConflictError("You have already applied for this job"));
      }

      const { resume, coverLetterFile, customAnswers, ...dbData } =
        applicationData as typeof applicationData & {
          customAnswers?: string;
        };
      const sanitizedData = {
        ...dbData,
        notes: customAnswers
          ? SecurityUtils.sanitizeInput(customAnswers)
          : undefined,
      };

      const applicationId =
        await this.applicationsRepository.createApplication(sanitizedData);

      if (!applicationId) {
        return fail(new DatabaseError("Failed to submit application"));
      }

      // Publish domain event — job insights counter will be incremented asynchronously
      await this.eventBus.publish(
        createApplicationSubmittedEvent(
          {
            applicationId,
            jobId: applicationData.jobId,
            applicantId: applicationData.applicantId,
          },
          correlationId,
        ),
      );

      const tempFiles: Array<{
        originalname: string;
        tempPath: string;
        size: number;
        mimetype: string;
        fieldName: string;
      }> = [];

      if (resume) {
        tempFiles.push({
          originalname: resume.originalname,
          tempPath: resume.path,
          size: resume.size,
          mimetype: resume.mimetype,
          fieldName: "resume",
        });
      }

      if (coverLetterFile) {
        tempFiles.push({
          originalname: coverLetterFile.originalname,
          tempPath: coverLetterFile.path,
          size: coverLetterFile.size,
          mimetype: coverLetterFile.mimetype,
          fieldName: "coverLetter",
        });
      }

      if (tempFiles.length > 0) {
        await queueService.addJob<FileUploadJobData>(
          QUEUE_NAMES.FILE_UPLOAD_QUEUE,
          "uploadFile",
          {
            entityType: "job",
            entityId: applicationId.toString(),
            folder: StorageFolder.RESUMES,
            mergeWithExisting: false,
            tempFiles,
            userId: applicationData.applicantId.toString(),
            correlationId,
          },
        );
      }

      const applicant = await this.applicantQuery.findById(
        applicationData.applicantId,
      );

      if (applicant) {
        await queueService.addJob(
          QUEUE_NAMES.EMAIL_QUEUE,
          "sendJobApplicationConfirmation",
          {
            userId: applicationData.applicantId,
            email: applicant.email,
            fullName: applicant.fullName,
            jobTitle: jobData.title,
            jobId: applicationData.jobId,
          },
        );
      }

      return ok({
        applicationId,
        message: "Application submitted successfully",
      });
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error);
      }
      logger.error(error);
      return fail(new DatabaseError("Failed to submit application"));
    }
  }

  async getJobApplications(
    jobId: number,
    { page, limit, status }: ApplicationQueryParams,
    requesterId: number,
  ) {
    try {
      const jobData = await this.jobDetailsQuery.getJobWithEmployerId(jobId);

      if (!jobData) {
        return fail(new NotFoundError("Job", jobId));
      }

      const organization = await this.orgMembershipQuery.findByContact(
        requesterId,
        jobData.employerId,
      );

      if (!organization) {
        return fail(
          new ForbiddenError("You do not belong to any organization"),
        );
      }

      if (jobData.employerOrgId !== organization.id) {
        return fail(
          new ForbiddenError(
            "You can only view applications for jobs posted by your organization",
          ),
        );
      }

      const result = await this.applicationsRepository.findApplicationsByJob(
        jobId,
        { page, limit, status },
      );

      return ok(result);
    } catch {
      return fail(new DatabaseError("Failed to fetch job applications"));
    }
  }

  async getUserApplications(
    userId: number,
    { page, limit, status }: ApplicationQueryParams,
  ) {
    try {
      const userApplications =
        await this.applicationsRepository.findApplicationsByUser(userId, [], {
          page,
          limit,
          status,
        });
      return ok(userApplications);
    } catch {
      return fail(new DatabaseError("Failed to fetch user applications"));
    }
  }

  async updateApplicationStatus(
    applicationId: number,
    data: UpdateJobApplication,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>> {
    try {
      const application =
        await this.applicationsRepository.findApplicationById(applicationId);

      if (!application) {
        return fail(new NotFoundError("Application", applicationId));
      }

      const jobData = await this.jobDetailsQuery.getJobWithEmployerId(
        application.job.id,
      );

      if (!jobData) {
        return fail(new NotFoundError("Job", application.job.id));
      }

      const organization = await this.orgMembershipQuery.findByContact(
        requesterId,
        jobData.employerId,
      );

      if (!organization) {
        return fail(
          new ForbiddenError("You do not belong to any organization"),
        );
      }

      if (organization.id !== jobData.employerOrgId) {
        return fail(
          new ForbiddenError(
            "You can only update applications for jobs posted by your organization",
          ),
        );
      }

      const success = await this.applicationsRepository.updateApplicationStatus(
        applicationId,
        data,
      );
      if (!success) {
        return fail(new DatabaseError("Failed to update application status"));
      }

      return ok({ message: "Application status updated successfully" });
    } catch {
      return fail(new DatabaseError("Failed to update application status"));
    }
  }

  async withdrawApplication(
    applicationId: number,
    userId: number,
  ): Promise<Result<{ message: string }, Error>> {
    try {
      const application =
        await this.applicationsRepository.findApplicationById(applicationId);

      if (!application) {
        return fail(new NotFoundError("Application", applicationId));
      }

      if (["hired", "rejected"].includes(application.application.status)) {
        return fail(
          new ValidationError("Cannot withdraw application with final status"),
        );
      }

      const success = await this.applicationsRepository.updateApplicationStatus(
        applicationId,
        {
          status: "withdrawn",
        },
      );

      if (!success) {
        return fail(new DatabaseError("Failed to withdraw application"));
      }

      const applicant = await this.applicantQuery.findById(userId);

      if (applicant) {
        await queueService.addJob(
          QUEUE_NAMES.EMAIL_QUEUE,
          "sendApplicationWithdrawalConfirmation",
          {
            userId,
            email: applicant.email,
            fullName: applicant.fullName,
            jobTitle: application.job.title,
            applicationId: applicationId,
          },
        );
      }

      return ok({ message: "Application withdrawn successfully" });
    } catch {
      return fail(new DatabaseError("Failed to withdraw application"));
    }
  }

  async deleteJobApplicationsByUserId(
    userId: number,
  ): Promise<Result<null, Error>> {
    try {
      await this.applicationsRepository.deleteJobApplicationsByUserId(userId);

      return ok(null);
    } catch {
      return fail(new DatabaseError("Failed to delete job applications"));
    }
  }

  // ─── Employer/Organization-scoped application methods ─────────────

  async getJobApplicationForOrganization(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ) {
    try {
      const jobApplications =
        await this.applicationsRepository.getJobApplicationForOrganization(
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

  async updateOrgJobApplicationStatus(
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
        await this.applicationsRepository.updateOrgJobApplicationStatus(
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

      // Notify applicant of status change via email queue
      await this.notifyApplicantOfStatusChange(
        applicationId,
        application.value.status,
        updateStatus,
        updatedApplication.jobTitle,
      );

      return ok(updatedApplication);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update job application status"));
    }
  }

  private async notifyApplicantOfStatusChange(
    applicationId: number,
    oldStatus: string,
    newStatus: string,
    jobTitle: string,
  ): Promise<void> {
    try {
      const applicationWithApplicant =
        await this.applicationsRepository.findApplicationById(applicationId);

      if (!applicationWithApplicant?.applicant) {
        return;
      }

      if (oldStatus === newStatus) {
        return;
      }

      await queueService.addJob(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendApplicationStatusUpdate",
        {
          email: applicationWithApplicant.applicant.email,
          fullName: applicationWithApplicant.applicant.fullName,
          jobTitle,
          oldStatus,
          newStatus,
          applicationId,
        },
      );
    } catch (error) {
      // Log error but don't fail the status update if notification fails
      logger.error(error, "Error Sending Application Status Update Email");
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
        await this.applicationsRepository.createJobApplicationNote({
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
        await this.applicationsRepository.getNotesForJobApplication(
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
        await this.applicationsRepository.getJobApplicationsForOrganization(
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
        await this.applicationsRepository.getApplicationsForOrganization(
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
