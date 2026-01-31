import { BaseService, Result } from "./base.service";
import { JobInsightsRepository } from "@/repositories/jobInsights.repository";
import { JobRepository } from "@/repositories/job.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { TypesenseService } from "@/infrastructure/typesense.service/typesense.service";
import { UserRepository } from "@/repositories/user.repository";
import { QUEUE_NAMES, queueService } from "@/infrastructure/queue.service";

import {
  NewJobApplication,
  Job,
  UpdateJob,
  UpdateJobApplication,
  JobWithSkills,
  CreateJobSchema,
  JobWithEmployer,
} from "@/validations/job.validation";

import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  DatabaseError,
} from "@/utils/errors";
import { SecurityUtils } from "@/utils/security";
import { AppError } from "@/utils/errors";

import { SearchParams } from "@/validations/base.validation";
import { TypesenseQueryBuilder } from "@/utils/typesense-queryBuilder";
import { StorageFolder } from "@/workers/file-upload-worker";
import { FileUploadJobData } from "@/validations/file.validation";

import { fail, ok } from "./base.service";
import logger from "@/logger";

/**
 * Service class for managing job-related operations, including CRUD for jobs and applications.
 */
export class JobService extends BaseService {
  private jobRepository: JobRepository;
  private organizationRepository: OrganizationRepository;
  private jobInsightsRepository: JobInsightsRepository;
  private typesenseService: TypesenseService;
  private userRepository: UserRepository;

  /**
   * Creates an instance of JobService and initializes repositories and services.
   */
  constructor() {
    super();
    this.jobRepository = new JobRepository();
    this.organizationRepository = new OrganizationRepository();
    this.jobInsightsRepository = new JobInsightsRepository();
    this.typesenseService = new TypesenseService();
    this.userRepository = new UserRepository();
  }

  /**
   * Retrieves all active jobs with optional pagination.
   * @param userId The ID of the user making the request (optional).
   * @param options Pagination options including page and limit.
   * @returns A Result containing the list of active jobs or a DatabaseError.
   */
  async getAllActiveJobs(
    userId: number | undefined,
    options: { page?: number; limit?: number } = {},
  ) {
    try {
      const activeJobs = await this.jobRepository.findActiveJobs(options);

      if (!userId || activeJobs.items.length === 0) {
        const enrichedJobs = activeJobs.items.map((job) => ({
          ...job,
          hasApplied: false,
        }));
        return ok({ ...activeJobs, items: enrichedJobs });
      }

      // Check which jobs the user has applied to
      const jobIds = activeJobs.items.map((job) => job.job.id);

      // Fetch applications by user for these job IDs
      const applications = await this.jobRepository.findApplicationsByUser(
        userId,
        jobIds,
      );

      const appliedJobIds = new Set(
        applications.items
          .map((app) => app.job?.id)
          .filter((id): id is number => id !== undefined),
      );

      const enrichedJobs = activeJobs.items.map((job) => ({
        ...job,
        hasApplied: appliedJobIds.has(job.job.id),
      }));

      return ok({ ...activeJobs, items: enrichedJobs });
    } catch {
      return fail(new DatabaseError("Failed to fetch active jobs"));
    }
  }

  /**
   * Retrieves active jobs posted by a specific organization.
   * @param organizationId The ID of the organization.
   * @returns A Result containing the list of active jobs or a DatabaseError.
   */
  async getActiveJobsByOrganization(
    organizationId: number,
  ): Promise<Result<Job[], Error>> {
    try {
      const allJobs = await this.jobRepository.findJobsByEmployer(
        organizationId,
        { limit: 10 },
      );
      const activeJobs = allJobs.items.filter((job) => job.isActive);
      return ok(activeJobs);
    } catch {
      return fail(
        new DatabaseError("Failed to fetch active jobs for organization"),
      );
    }
  }

  /**
   * Searches for jobs based on various filters using Typesense.
   * @param filters Search parameters including query, location, skills, etc.
   * @returns A Result containing the search results or an AppError.
   */
  async searchJobs(filters: SearchParams["query"]) {
    try {
      const {
        q,
        page = 1,
        limit = 10,
        includeRemote,
        city,
        state,
        country,
        zipcode,
        skills,
        jobType,
        ...rest
      } = filters;
      const offset = (page - 1) * limit;

      const skillsArray = Array.isArray(skills)
        ? skills
        : skills
          ? [skills]
          : [];

      const jobTypeArray = Array.isArray(jobType)
        ? jobType
        : jobType
          ? [jobType]
          : [];

      const queryBuilder = new TypesenseQueryBuilder()
        .addLocationFilters({ city, state, country, zipcode }, includeRemote)
        .addSkillFilters(skillsArray, true) // AND logic
        .addArrayFilter("jobType", jobTypeArray, true) // OR logic
        .addSingleFilter("status", rest.status)
        .addSingleFilter("isActive", rest.isActive)
        .addSingleFilter("experience", rest.experience);

      const filterQuery = queryBuilder.build();

      const parts: string[] = [];
      if (filterQuery) parts.push(filterQuery);
      const filterString = parts.join("&");

      const results = await this.typesenseService.searchJobsCollection(
        q,
        filterString,
        {
          limit,
          offset,
          page,
        },
      );
      return ok(results);
    } catch (error) {
      logger.error(error);
      return fail(new AppError("Failed to fetch active jobs for organization"));
    }
  }

  /**
   * Retrieves a job by its ID and increments the view count.
   * @param id The ID of the job.
   * @param userId The ID of the user making the request (optional).
   * @returns A Result containing the job with employer details or an error.
   */
  async getJobById(
    id: number,
    userId?: number | undefined,
  ): Promise<Result<JobWithEmployer, Error>> {
    try {
      const job = await this.jobRepository.findJobById(id);

      if (!job) {
        return fail(new NotFoundError("Job", id));
      }

      // Increment view count
      await this.incrementJobViews(id);

      if (!userId) {
        return ok({ ...job, hasApplied: false });
      }

      const hasApplied = await this.jobRepository.hasUserAppliedToJob(
        userId,
        id,
      );

      return ok({ ...job, hasApplied });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch job by ID"));
    }
  }

  /**
   * Increments the view count for a job.
   * @param jobId The ID of the job.
   * @returns A Result indicating success or an error.
   */
  async incrementJobViews(jobId: number): Promise<Result<null, Error>> {
    try {
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        return fail(new NotFoundError("Job", jobId));
      }
      await this.jobInsightsRepository.incrementJobViews(jobId);

      return ok(null);
    } catch {
      return fail(new DatabaseError("Failed to fetch job by ID"));
    }
  }

  /**
   * Retrieves jobs posted by a specific employer with optional filters.
   * @param employerId The ID of the employer (organization).
   * @param options Pagination and search options.
   * @returns A Result containing the jobs or a DatabaseError.
   */
  async getJobsByEmployer(
    employerId: number,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      q?: string;
      order?: string;
    } = {},
  ) {
    try {
      const jobsByEmployer = await this.jobRepository.findJobsByEmployer(
        employerId,
        options,
      );
      return ok(jobsByEmployer);
    } catch {
      return fail(new DatabaseError("Failed to fetch jobs by employer"));
    }
  }

  /**
   * Creates a new job posting.
   * @param jobData The data for the new job, including employer ID.
   * @returns A Result containing the created job with skills or an error.
   */
  async createJob(
    jobData: CreateJobSchema["body"] & { employerId: number },
  ): Promise<Result<JobWithSkills, Error>> {
    try {
      // Validate employer exists
      const employer = await this.organizationRepository.findById(
        jobData.employerId,
      );

      if (!employer) {
        return fail(new NotFoundError("Organization", jobData.employerId));
      }

      // Sanitize and process job data
      const sanitizedData = {
        ...jobData,
        title: SecurityUtils.sanitizeInput(jobData.title),
        description: SecurityUtils.sanitizeInput(jobData.description),
        city: SecurityUtils.sanitizeInput(jobData.city),
        country: SecurityUtils.sanitizeInput(jobData.country),
        experience: jobData.experience
          ? SecurityUtils.sanitizeInput(jobData.experience)
          : null,
        applicationDeadline: jobData.applicationDeadline
          ? new Date(jobData.applicationDeadline)
          : null,
      };

      const jobWithSkills = await this.jobRepository.createJob(sanitizedData);

      if (!jobWithSkills) {
        return fail(new DatabaseError("Failed to retrieve created job"));
      }

      // Enqueue job for indexing in Typesense
      await queueService.addJob(
        QUEUE_NAMES.TYPESENSE_QUEUE,
        "indexJob",
        jobWithSkills,
      );

      return ok(jobWithSkills);
    } catch {
      return fail(new DatabaseError("Failed to retrieve created job"));
    }
  }

  /**
   * Updates an existing job posting.
   * @param id The ID of the job to update.
   * @param updateData The data to update.
   * @param requesterId The ID of the user making the request.
   * @returns A Result containing the updated job or an error.
   */
  async updateJob(
    id: number,
    updateData: UpdateJob,
    requesterId: number,
  ): Promise<Result<Job, Error>> {
    try {
      const job = await this.getJobById(id);

      if (!job.isSuccess) {
        return fail(new NotFoundError("Job", id));
      }

      // Authorization check - only admin or employer who posted the job can update
      const organization =
        await this.organizationRepository.findByContact(requesterId);

      if (!organization) {
        return fail(
          new ForbiddenError("You do not belong to any organization"),
        );
      }

      if (job.value.job.employerId !== organization.id) {
        return fail(
          new ForbiddenError(
            "You can only update jobs posted by your organization",
          ),
        );
      }

      // Sanitize update data
      const sanitizedData = {
        ...updateData,
        title: updateData.title
          ? SecurityUtils.sanitizeInput(updateData.title)
          : undefined,
        description: updateData.description
          ? SecurityUtils.sanitizeInput(updateData.description)
          : undefined,
        city: updateData.city
          ? SecurityUtils.sanitizeInput(updateData.city)
          : undefined,
        state: updateData.state
          ? this.processSkillsArray(updateData.state)
          : undefined,
      };

      const success = await this.jobRepository.updateJob(sanitizedData, id);
      if (!success) {
        return fail(new DatabaseError("Failed to update job"));
      }

      const updatedJob = await this.jobRepository.findJobByIdWithSkills(id);

      if (!updatedJob) {
        return fail(new DatabaseError("Failed to retrieve updated job"));
      }

      // Update job indexes in Typesense
      await queueService.addJob(QUEUE_NAMES.TYPESENSE_QUEUE, "updateJobIndex", {
        id,
        updatedJob,
      });

      return ok(updatedJob);
    } catch {
      return fail(new DatabaseError("Failed to update job"));
    }
  }

  /**
   * Deletes a job posting if it has no applications.
   * @param id The ID of the job to delete.
   * @param requesterId The ID of the user making the request.
   * @param organizationId The ID of the organization.
   * @returns A Result indicating success or an error.
   */
  async deleteJob(
    id: number,
    requesterId: number,
    organizationId: number,
  ): Promise<Result<null, Error>> {
    try {
      const job = await this.getJobById(id);

      if (!job.isSuccess) {
        return fail(new NotFoundError("Job", id));
      }

      const applications = await this.jobRepository.findApplicationsByJob(id);

      if (applications.items.length > 0) {
        return fail(
          new ForbiddenError("Cannot delete job with existing applications"),
        );
      }

      const success = await this.jobRepository.delete(id);
      if (!success) {
        return fail(new DatabaseError("Failed to delete job"));
      }

      await queueService.addJob(QUEUE_NAMES.TYPESENSE_QUEUE, "deleteJobIndex", {
        id,
      });

      const user = await this.userRepository.findById(requesterId);
      if (user) {
        await queueService.addJob(
          QUEUE_NAMES.EMAIL_QUEUE,
          "sendJobDeletionEmail",
          {
            userEmail: user.email,
            userName: user.fullName,
            jobTitle: job.value.job.title,
            jobId: id,
            organizationId,
          },
        );
      }

      return ok(null);
    } catch {
      return fail(new DatabaseError("Failed to delete job"));
    }
  }

  // Job Application Methods
  /**
   * Allows a user to apply for a job.
   * @param applicationData The application data including job ID and applicant ID.
   * @returns A Result containing the application ID and message or an error.
   */
  async applyForJob(
    applicationData: NewJobApplication & { resume?: Express.Multer.File },
    correlationId: string,
  ): Promise<Result<{ applicationId: number; message: string }, Error>> {
    try {
      // Check if job exists and is active
      const job = await this.getJobById(applicationData.jobId);

      if (!job.isSuccess) {
        return fail(new NotFoundError("Job", applicationData.jobId));
      }
      if (!job.value.job.isActive) {
        return fail(
          new ValidationError("This job is no longer accepting applications"),
        );
      }

      // Check application deadline
      if (
        job.value.job.applicationDeadline &&
        new Date() > new Date(job.value.job.applicationDeadline)
      ) {
        return fail(new ValidationError("The application deadline has passed"));
      }

      // Check if user has already applied
      const hasApplied = await this.jobRepository.hasUserAppliedToJob(
        applicationData.applicantId,
        applicationData.jobId,
      );

      if (hasApplied) {
        return fail(new ConflictError("You have already applied for this job"));
      }

      // Sanitize application data
      const sanitizedData = {
        ...applicationData,
        coverLetter: SecurityUtils.sanitizeInput(
          applicationData.coverLetter ?? "",
        ),
      };

      const applicationId =
        await this.jobRepository.createApplication(sanitizedData);

      if (!applicationId) {
        return fail(new DatabaseError("Failed to submit application"));
      }

      // Enqueue resume upload if provided
      if (applicationData.resume) {
        await queueService.addJob<FileUploadJobData>(
          QUEUE_NAMES.FILE_UPLOAD_QUEUE,
          "uploadFile",
          {
            entityType: "job",
            entityId: applicationId.toString(),
            folder: StorageFolder.RESUMES,
            mergeWithExisting: false,
            tempFiles: [
              {
                originalname: applicationData.resume.originalname,
                tempPath: applicationData.resume.path,
                size: applicationData.resume.size,
                mimetype: applicationData.resume.mimetype,
              },
            ],
            userId: applicationData.applicantId.toString(),
            correlationId,
          },
        );
      }

      // Fetch user details for email notification
      const applicant = await this.userRepository.findById(
        applicationData.applicantId,
      );

      if (applicant) {
        // Enqueue email notification
        await queueService.addJob(
          QUEUE_NAMES.EMAIL_QUEUE,
          "sendJobApplicationConfirmation",
          {
            userId: applicationData.applicantId,
            email: applicant.email,
            fullName: applicant.fullName,
            jobTitle: job.value.job.title,
            jobId: applicationData.jobId,
          },
        );
      }

      return ok({
        applicationId,
        message: "Application submitted successfully",
      });
    } catch (error) {
      logger.error(error);
      return fail(new DatabaseError("Failed to submit application"));
    }
  }

  /**
   * Retrieves applications for a specific job, with authorization checks.
   * @param jobId The ID of the job.
   * @param query Search parameters including page, limit, status.
   * @param requesterId The ID of the user making the request.
   * @returns A Result containing the applications or an error.
   */
  async getJobApplications(
    jobId: number,
    { page, limit, status }: SearchParams["query"],
    requesterId: number,
  ) {
    try {
      // Authorization check - only admin or employer who posted the job can view applications
      const [job, organization] = await Promise.all([
        this.getJobById(jobId),
        this.organizationRepository.findByContact(requesterId),
      ]);

      if (!job.isSuccess) {
        return fail(new NotFoundError("Job", jobId));
      }

      if (!organization) {
        return fail(
          new ForbiddenError("You do not belong to any organization"),
        );
      }

      if (job.value.job.employerId !== organization.id) {
        return fail(
          new ForbiddenError(
            "You can only view applications for jobs posted by your organization",
          ),
        );
      }

      const result = await this.jobRepository.findApplicationsByJob(jobId, {
        page,
        limit,
        status,
      });

      return ok(result);
    } catch {
      return fail(new DatabaseError("Failed to fetch job applications"));
    }
  }

  /**
   * Retrieves applications submitted by a specific user.
   * @param userId The ID of the user.
   * @param query Search parameters including page, limit, status.
   * @returns A Result containing the user's applications or an error.
   */
  async getUserApplications(
    userId: number,
    { page, limit, status }: SearchParams["query"],
  ) {
    try {
      const userApplications = await this.jobRepository.findApplicationsByUser(
        userId,
        [],
        {
          page,
          limit,
          status,
        },
      );
      return ok(userApplications);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch user applications"));
    }
  }

  /**
   * Updates the status of a job application.
   * @param applicationId The ID of the application.
   * @param data The update data including new status.
   * @param requesterId The ID of the user making the request.
   * @returns A Result containing a success message or an error.
   */
  async updateApplicationStatus(
    applicationId: number,
    data: UpdateJobApplication,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>> {
    try {
      const application =
        await this.jobRepository.findApplicationById(applicationId);

      if (!application) {
        return fail(new NotFoundError("Application", applicationId));
      }

      const [job, organization] = await Promise.all([
        this.getJobById(application.job.id),
        this.organizationRepository.findByContact(requesterId),
      ]);

      if (!job.isSuccess) {
        return fail(new NotFoundError("Job", application.job.id));
      }

      if (!organization) {
        return fail(
          new ForbiddenError("You do not belong to any organization"),
        );
      }

      if (organization.id !== job.value.job.employerId) {
        return fail(
          new ForbiddenError(
            "You can only update applications for jobs posted by your organization",
          ),
        );
      }

      // const updateData: any = { status };
      //
      // if (status === "reviewed" && !application?.application?.reviewedAt) {
      //   updateData.reviewedAt = new Date();
      //   updateData.reviewedBy = requesterId;
      // }
      //
      // if (additionalData?.notes) {
      //   updateData.notes = SecurityUtils.sanitizeInput(additionalData.notes);
      // }
      //
      // if (additionalData?.rating) {
      //   updateData.rating = Math.min(5, Math.max(1, additionalData.rating));
      // }

      const success = await this.jobRepository.updateApplicationStatus(
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

  /**
   * Allows a user to withdraw their job application.
   * @param applicationId The ID of the application.
   * @param userId The ID of the user withdrawing the application.
   * @returns A Result containing a success message or an error.
   */
  async withdrawApplication(
    applicationId: number,
    userId: number,
  ): Promise<Result<{ message: string }, Error>> {
    try {
      const application =
        await this.jobRepository.findApplicationById(applicationId);

      if (!application) {
        return fail(new NotFoundError("Application", applicationId));
      }

      if (["hired", "rejected"].includes(application.application.status)) {
        return fail(
          new ValidationError("Cannot withdraw application with final status"),
        );
      }

      const success = await this.jobRepository.updateApplicationStatus(
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

  /**
   * Deletes all job applications for a specific user.
   * @param userId The ID of the user.
   * @returns A Result indicating success or an error.
   */
  async deleteJobApplicationsByUserId(
    userId: number,
  ): Promise<Result<null, Error>> {
    try {
      await this.jobRepository.deleteJobApplicationsByUserId(userId);

      return ok(null);
    } catch (error) {
      return fail(
        new DatabaseError("Failed to delete application application"),
      );
    }
  }

  // Dashboard and Statistics Methods

  /**
   * Retrieves job statistics for an employer organization.
   * @param organizationId The ID of the organization.
   * @returns A Result containing the job insights or a DatabaseError.
   */
  async getEmployerJobStats(organizationId: number) {
    try {
      const jobInsights =
        await this.jobInsightsRepository.getJobInsightByOrganizationId(
          organizationId,
        );
      return ok(jobInsights);
    } catch {
      return fail(
        new DatabaseError("Failed to fetch job statistics for organization"),
      );
    }
  }

  /**
   * Processes a skills string, converting comma-separated values to JSON array if needed.
   * @param skills The skills string.
   * @returns The processed skills string.
   */
  private processSkillsArray(skills: string): string {
    try {
      // Validate if it's a JSON string
      JSON.parse(skills);
      return skills;
    } catch {
      // Convert comma-separated string to JSON array
      const skillsArray = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
      return JSON.stringify(skillsArray);
    }
  }

  // async getUserDashboard(userId: number) {
  //   const user = await this.userRepository.findByIdWithProfile(userId);
  //   if (!user) {
  //     return this.handleError(new NotFoundError("User", userId));
  //   }
  //
  //   const applicationsResult =
  //     await this.jobRepository.findApplicationsByUser(userId);
  //   const applications = applicationsResult.items;
  //   const recentApplications = applications.slice(0, 5);
  //
  //   // Get application statistics
  //   const applicationStats = {
  //     total: applications.length,
  //     pending: applications.filter(
  //       (app) => app.application.status === "pending",
  //     ).length,
  //     reviewed: applications.filter(
  //       (app) => app.application.status === "reviewed",
  //     ).length,
  //     shortlisted: applications.filter(
  //       (app) => app.application.status === "shortlisted",
  //     ).length,
  //     interviewing: applications.filter(
  //       (app) => app.application.status === "interviewing",
  //     ).length,
  //     hired: applications.filter((app) => app.application.status === "hired")
  //       .length,
  //     rejected: applications.filter(
  //       (app) => app.application.status === "rejected",
  //     ).length,
  //   };
  //
  //   return {
  //     user,
  //     applications: recentApplications,
  //     stats: applicationStats,
  //   };
  // }

  //   // Get recent applications across all jobs
  //   const allApplications = await Promise.all(
  //     jobs.items.map((job) => this.jobRepository.findApplicationsByJob(job.id)),
  //   );
  //
  //   const flatApplications = allApplications
  //     .flatMap((res) => res.items)
  //     .sort(
  //       (a, b) =>
  //         new Date(b.application.appliedAt).getTime() -
  //         new Date(a.application.appliedAt).getTime(),
  //     );
  //
  //   const recentApplications = flatApplications.slice(0, 10);
  //
  //   return {
  //     organization,
  //     jobs: recentJobs,
  //     applications: recentApplications,
  //     stats: jobStats,
  //   };
  // }

  // async getAdminDashboard() {
  //   try {
  //     const jobStats = await this.jobRepository.getJobStatistics();
  //     const userStats = await this.getUserCounts();
  //     const organizationStats = await this.getOrganizationCounts();
  //
  //     // Get recent activities
  //     const recentJobs = await this.jobRepository.findActiveJobs({ limit: 10 });
  //     const recentApplications = await (
  //       this.jobRepository as any
  //     ).getRecentApplications({ limit: 20 });
  //
  //     return {
  //       stats: {
  //         jobs: jobStats,
  //         users: userStats,
  //         organizations: organizationStats,
  //       },
  //       recentActivities: {
  //         jobs: recentJobs.items,
  //         applications: recentApplications,
  //       },
  //     };
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }
}
