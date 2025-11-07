import { BaseService, Result } from "./base.service";
import { JobInsightsRepository } from "@/repositories/jobInsights.repository";
import { JobRepository } from "@/repositories/job.repository";
import { UserRepository } from "@/repositories/user.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { TypesenseService } from "@/services/typesense.service/typesense.service";
import { CacheService } from "@/services/cache.service";
import { EmailService } from "@/services/email.service";
import { StorageService } from "@/services/storage.service";
import { CacheKeys, CachePatterns } from "@/types/cache.types";
import { Paginated } from "@/types";
import {
  NewJobApplication,
  Job,
  JobWithEmployer,
  UpdateJob,
  UpdateJobApplication,
  JobWithSkills,
  CreateJobSchema,
  JobApplicationWithRelations,
} from "@/validations/job.validation";

import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  DatabaseError,
  AppError,
} from "@/utils/errors";
import { SecurityUtils } from "@/utils/security";

import { SearchParams } from "@/validations/base.validation";
import { jobIndexerQueue } from "@/utils/bullmq.utils";
import { TypesenseQueryBuilder } from "@/utils/typesense-queryBuilder";

import { fail, ok } from "./base.service";
import logger from "@/logger";

export class JobService extends BaseService {
  private jobRepository: JobRepository;
  private organizationRepository: OrganizationRepository;
  private userRepository: UserRepository;
  private jobInsightsRepository: JobInsightsRepository;
  private typesenseService: TypesenseService;
  private cacheService: CacheService;
  private emailService: EmailService;
  private storageService: StorageService;

  constructor() {
    super();
    this.jobRepository = new JobRepository();
    this.organizationRepository = new OrganizationRepository();
    this.userRepository = new UserRepository();
    this.jobInsightsRepository = new JobInsightsRepository();
    this.typesenseService = new TypesenseService();
    this.cacheService = new CacheService();
    this.emailService = new EmailService();
    this.storageService = new StorageService();
  }

  async getAllActiveJobs(
    options: { page?: number; limit?: number } = {}
  ): Promise<Result<Paginated<JobWithEmployer>, Error>> {
    const { page = 1, limit = 10 } = options;
    const cacheKey = CacheKeys.jobs.active(page, limit);

    try {
      const cachedJobs = await this.cacheService.get<Paginated<JobWithEmployer>>(
        cacheKey
      );
      if (cachedJobs) {
        return ok(cachedJobs);
      }

      const activeJobs = await this.jobRepository.findActiveJobs(options);

      await this.cacheService.set(cacheKey, activeJobs, 3600); // Cache for 1 hour

      return ok(activeJobs);
    } catch (error) {
      logger.error({ error, options }, "Failed to fetch active jobs");
      return fail(new DatabaseError("Failed to fetch active jobs"));
    }
  }

  async getActiveJobsByOrganization(
    organizationId: number
  ): Promise<Result<Job[], Error>> {
    try {
      const allJobs = await this.jobRepository.findJobsByEmployer(
        organizationId,
        { limit: 10 }
      );
      const activeJobs = allJobs.items
        .filter((j) => j.job.isActive)
        .map((j) => j.job);
      return ok(activeJobs);
    } catch {
      return fail(
        new DatabaseError("Failed to fetch active jobs for organization")
      );
    }
  }

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
        }
      );
      return ok(results);
    } catch (error) {
      logger.error(error);
      return fail(new AppError("Failed to fetch active jobs for organization"));
    }
  }

  async getJobById(id: number): Promise<Result<Job, Error>> {
    const cacheKey = CacheKeys.jobs.detail(id);
    try {
      const cachedJob = await this.cacheService.get<Job>(cacheKey);
      if (cachedJob) {
        return ok(cachedJob);
      }

      const job = await this.jobRepository.findById(id);

      if (!job) {
        return fail(new NotFoundError("Job", id));
      }

      await this.cacheService.set(cacheKey, job, 3600); // Cache for 1 hour

      // Increment view count
      await this.incrementJobViews(id);

      return ok(job);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch job by ID"));
    }
  }

  async incrementJobViews(jobId: number): Promise<Result<null, Error>> {
    try {
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        return fail(new NotFoundError("Job", jobId));
      }
      await this.jobInsightsRepository.incrementJobViews(jobId);

      return ok(null);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch job by ID"));
    }
  }

  async getJobsByEmployer(
    employerId: number,
    options: { page?: number; limit?: number } = {},
    requesterId: number
  ) {
    const { page = 1, limit = 10 } = options;
    const cacheKey = CacheKeys.jobs.byEmployer(employerId, page, limit);

    try {
      const cachedJobs = await this.cacheService.get<Paginated<Job>>(
        cacheKey
      );
      if (cachedJobs) {
        return ok(cachedJobs);
      }

      // Todo: Additional check for employers - they can only see their own organization\'s jobs
      const organization =
        await this.organizationRepository.findByContact(requesterId);
      if (!organization) {
        return fail(
          new ForbiddenError("You do not belong to any organization")
        );
      }

      if (organization.id !== employerId) {
        return fail(
          new ForbiddenError("You can only view jobs for your organization")
        );
      }

      const jobsByEmployer = await this.jobRepository.findJobsByEmployer(
        employerId,
        options
      );

      await this.cacheService.set(cacheKey, jobsByEmployer, 3600); // Cache for 1 hour

      return ok(jobsByEmployer);
    } catch {
      return fail(new DatabaseError("Failed to fetch jobs by employer"));
    }
  }

  async createJob(
    jobData: CreateJobSchema["body"]
  ): Promise<Result<JobWithSkills, Error>> {
    try {
      // Todo Fetch this from organizationMembers table
      // Validate employer exists
      const employer = await this.organizationRepository.findById(
        jobData.employerId
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
      await jobIndexerQueue.add("indexJob", jobWithSkills);

      // Invalidate cache
      await this.cacheService.invalidate(CachePatterns.jobs.all);
      await this.cacheService.invalidate(CachePatterns.jobs.active);

      return ok(jobWithSkills);
    } catch {
      return fail(new DatabaseError("Failed to retrieve created job"));
    }
  }

  async updateJob(
    id: number,
    updateData: UpdateJob,
    requesterId: number
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
          new ForbiddenError("You do not belong to any organization")
        );
      }

      if (job.value.employerId !== organization.id) {
        return fail(
          new ForbiddenError(
            "You can only update jobs posted by your organization"
          )
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
      await jobIndexerQueue.add("updateJobIndex", { id, updatedJob });

      // Invalidate cache
      await this.cacheService.invalidate(CachePatterns.jobs.all);
      await this.cacheService.invalidate(CachePatterns.jobs.active);
      await this.cacheService.delete(CacheKeys.jobs.detail(id));

      return ok(updatedJob);
    } catch {
      return fail(new DatabaseError("Failed to update job"));
    }
  }

  async deleteJob(
    id: number,
    requesterId: number
  ): Promise<Result<null, Error>> {
    try {
      const job = await this.getJobById(id);

      if (!job.isSuccess) {
        return fail(new NotFoundError("Job", id));
      }

      // Authorization check - only admin or employer who posted the job can delete
      const organization =
        await this.organizationRepository.findByContact(requesterId);

      if (!organization) {
        return fail(
          new ForbiddenError("You do not belong to any organization")
        );
      }

      if (job.value.employerId !== organization.id) {
        return fail(
          new ForbiddenError(
            "You can only delete jobs posted by your organization"
          )
        );
      }

      // Check if job has applications - if so, prevent deletion
      const applications = await this.jobRepository.findApplicationsByJob(id);

      if (applications.items.length > 0) {
        return fail(
          new ForbiddenError("Cannot delete job with existing applications")
        );
      }

      const success = await this.jobRepository.deleteById(id);
      if (!success) {
        return fail(new DatabaseError("Failed to delete job"));
      }

      // Delete job indexes in Typesense
      await jobIndexerQueue.add("deleteJobIndex", { id });

      // Invalidate cache
      await this.cacheService.invalidate(CachePatterns.jobs.all);
      await this.cacheService.invalidate(CachePatterns.jobs.active);
      await this.cacheService.delete(CacheKeys.jobs.detail(id));

      return ok(null);
    } catch {
      return fail(new DatabaseError("Failed to delete job"));
    }
  }

  // Job Application Methods
  async applyForJob(
    applicationData: NewJobApplication & {
      resumeFile?: Express.Multer.File;
      coverLetterFile?: Express.Multer.File;
    }
  ): Promise<Result<{ applicationId: number; message: string }, Error>> {
    try {
      const { resumeFile, coverLetterFile, applicantId, jobId } =
        applicationData;

      // 1. Validate Job
      const jobResult = await this.getJobById(jobId);
      if (!jobResult.isSuccess) {
        return fail(new NotFoundError("Job", jobId));
      }
      const job = jobResult.value;

      if (!job.isActive) {
        return fail(
          new ValidationError("This job is no longer accepting applications")
        );
      }

      if (
        job.applicationDeadline &&
        new Date() > new Date(job.applicationDeadline)
      ) {
        return fail(new ValidationError("The application deadline has passed"));
      }

      // 2. Check Duplicate Application
      const hasApplied = await this.jobRepository.hasUserAppliedToJob(
        applicantId,
        jobId
      );
      if (hasApplied) {
        return fail(new ConflictError("You have already applied for this job"));
      }

      // 3. Upload Files to Firebase
      let resumeUrl = applicationData.resumeUrl;
      let coverLetterContent = applicationData.coverLetter;

      if (resumeFile) {
        const upload = await this.storageService.uploadFile(
          resumeFile,
          applicantId,
          "resumes"
        );
        resumeUrl = upload.url;
      }

      if (coverLetterFile) {
        const upload = await this.storageService.uploadFile(
          coverLetterFile,
          applicantId,
          "cover-letters"
        );
        coverLetterContent = upload.url;
      }

      // 4. Sanitize Text Data
      const sanitizedCoverLetter = coverLetterContent
        ? SecurityUtils.sanitizeInput(coverLetterContent)
        : undefined;

      // 5. Create Application in DB
      const dbData = {
        ...applicationData,
        resumeUrl,
        coverLetter: sanitizedCoverLetter,
      };

      const applicationId = await this.jobRepository.createApplication(dbData);
      if (!applicationId) {
        return fail(new DatabaseError("Failed to submit application"));
      }

      return ok({
        applicationId,
        message: "Application submitted successfully",
      });
    } catch (error) {
      logger.error(
        { error, applicantId: applicationData.applicantId },
        "applyForJob failed"
      );
      return fail(new AppError("Failed to process application", 500));
    }
  }

  async getJobApplications(
    jobId: number,
    { page, limit, status }: SearchParams["query"],
    requesterId: number
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
          new ForbiddenError("You do not belong to any organization")
        );
      }

      if (job.value.employerId !== organization.id) {
        return fail(
          new ForbiddenError(
            "You can only view applications for jobs posted by your organization"
          )
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

  async getUserApplications(
    userId: number,
    { page, limit, status }: SearchParams["query"]
  ): Promise<Result<Paginated<JobApplicationWithRelations>, Error>> {
    try {
      const userApplications = await this.jobRepository.findApplicationsByUser(
        userId,
        {
          page,
          limit,
          status,
        }
      );
      return ok(userApplications);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch user applications"));
    }
  }

  async updateApplicationStatus(
    applicationId: number,
    data: UpdateJobApplication,
    requesterId: number
  ): Promise<Result<{ message: string }, Error>> {
    try {
      // Get application details
      const [application] =
        await this.jobRepository.findApplicationById(applicationId);

      if (!application) {
        return fail(new NotFoundError("Application", applicationId));
      }

      // Authorization check - only admin or employer who posted the job can update application status
      const [job, organization] = await Promise.all([
        this.getJobById(application.job.id),
        this.organizationRepository.findByContact(requesterId),
      ]);

      if (!job.isSuccess) {
        return fail(new NotFoundError("Job", application.job.id));
      }

      if (!organization) {
        return fail(
          new ForbiddenError("You do not belong to any organization")
        );
      }

      if (organization.id !== job.value.employerId) {
        return fail(
          new ForbiddenError(
            "You can only update applications for jobs posted by your organization"
          )
        );
      }

      const success = await this.jobRepository.updateApplicationStatus(
        applicationId,
        data
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
    userId: number
  ): Promise<Result<{ message: string }, Error>> {
    try {
      const [application] =
        await this.jobRepository.findApplicationById(applicationId);
      if (!application) {
        return fail(new NotFoundError("Application", applicationId));
      }

      // Check if user owns this application
      if (application.application.applicantId !== userId) {
        return fail(
          new ForbiddenError("You can only withdraw your own applications")
        );
      }

      // Check if application can be withdrawn
      if (["hired", "rejected"].includes(application.application.status)) {
        return fail(
          new ValidationError("Cannot withdraw application with final status")
        );
      }

      const success = await this.jobRepository.updateApplicationStatus(
        applicationId,
        {
          status: "withdrawn",
        }
      );

      if (!success) {
        return fail(new DatabaseError("Failed to withdraw application"));
      }

      return ok({ message: "Application withdrawn successfully" });
    } catch {
      return fail(new DatabaseError("Failed to withdraw application"));
    }
  }

  async deleteJobApplicationsByUserId(
    userId: number
  ): Promise<Result<null, Error>> {
    try {
      await this.jobRepository.deleteJobApplicationsByUserId(userId);

      return ok(null);
    } catch (error) {
      return fail(
        new DatabaseError("Failed to delete application application")
      );
    }
  }

  private processSkillsArray(skills: string): string {
    try {
      // Validate if it\'s a JSON string
      JSON.parse(skills);
      return skills;
    }
    catch {
      // Convert comma-separated string to JSON array
      const skillsArray = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
      return JSON.stringify(skillsArray);
    }
  }

  private async invalidateActiveJobsCache(): Promise<void> {
    await this.cacheService.invalidate(CachePatterns.jobs.active);
  }
}