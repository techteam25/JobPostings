import { Result, fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import { QUEUE_NAMES, queueService } from "@shared/infrastructure/queue.service";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  DatabaseError,
  AppError,
} from "@shared/errors";
import { SecurityUtils } from "@shared/utils/security";
import { StorageFolder } from "@/workers/file-upload-worker";
import logger from "@shared/logger";

import type { ApplicationsServicePort } from "@/modules/applications";
import type { ApplicationsRepositoryPort } from "@/modules/applications";
import type { JobDetailsQueryPort } from "@/modules/applications/ports/job-details-query.port";
import type { OrganizationRepositoryPort } from "@/ports/organization-repository.port";
import type { UserRepositoryPort } from "@/ports/user-repository.port";
import type { EventBusPort } from "@shared/events";
import { createApplicationSubmittedEvent } from "@/modules/applications/events/application-submitted.event";

import type { NewJobApplication, UpdateJobApplication } from "@/validations/job.validation";
import type { ApplicationQueryParams } from "@/validations/jobApplications.validation";
import type { FileUploadJobData } from "@/validations/file.validation";

export class ApplicationsService
  extends BaseService
  implements ApplicationsServicePort
{
  constructor(
    private applicationsRepository: ApplicationsRepositoryPort,
    private jobDetailsQuery: JobDetailsQueryPort,
    private organizationRepository: OrganizationRepositoryPort,
    private userRepository: UserRepositoryPort,
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

      const applicant = await this.userRepository.findById(
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

      const organization = await this.organizationRepository.findByContact(
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

      const organization = await this.organizationRepository.findByContact(
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

      const applicant = await this.userRepository.findById(userId);

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
      return fail(
        new DatabaseError("Failed to delete job applications"),
      );
    }
  }
}
