import { BaseService } from "./base.service";
import { JobInsightsRepository } from "@/repositories/jobInsights.repository";
import { JobRepository } from "@/repositories/job.repository";
import { UserRepository } from "@/repositories/user.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { OrganizationService } from "@/services/organization.service";
import { TypesenseService } from "@/services/typesense.service/typesense.service";
import { redisClient } from "@/config/redis";
import { EmailService } from "@/services/email.service";

import {
  NewJobApplication,
  Job,
  JobWithEmployer,
  JobApplication,
  UpdateJob,
  UpdateJobApplication,
  JobWithSkills,
  CreateJobSchema,
} from "@/validations/job.validation";

import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  AppError,
  ErrorCode,
} from "@/utils/errors";
import { SecurityUtils } from "@/utils/security";

import { SearchParams } from "@/validations/base.validation";
import { jobIndexerQueue } from "@/utils/bullmq.utils";
import { TypesenseQueryBuilder } from "@/utils/typesense-queryBuilder";

export class JobService extends BaseService {
  private jobRepository: JobRepository;
  private organizationRepository: OrganizationRepository;
  private userRepository: UserRepository;
  private jobInsightsRepository: JobInsightsRepository;
  private typesenseService: TypesenseService;
  private emailService: EmailService;

  constructor() {
    super();
    this.jobRepository = new JobRepository();
    this.organizationRepository = new OrganizationRepository();
    this.userRepository = new UserRepository();
    this.jobInsightsRepository = new JobInsightsRepository();
    this.typesenseService = new TypesenseService();
    this.emailService = new EmailService();
  }

  async getAllActiveJobs(options: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const cacheKey = `jobs:active:${page}:${limit}`;

      // Check cache
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      // Fetch from database
      const result = await this.jobRepository.findActiveJobs(options);

      // Cache result for 5 minutes
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getActiveJobsByOrganization(organizationId: number): Promise<Job[]> {
    try {
      const allJobs = await this.jobRepository.findJobsByEmployer(
        organizationId,
        { limit: 10000 }
      );
      return allJobs.items.filter((job) => job.isActive);
    } catch (error) {
      return this.handleError(error);
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
        skills,
        jobType,
        ...rest
      } = filters;
      const offset = (page - 1) * limit;

      const queryBuilder = new TypesenseQueryBuilder()
        .addLocationFilters({ city, state, country }, includeRemote)
        .addSkillFilters(skills, true) // AND logic
        .addArrayFilter("jobType", jobType, true) // OR logic
        .addSingleFilter("status", rest.status)
        .addSingleFilter("experience", rest.experience);

      const filterQuery = queryBuilder.build();

      const parts: string[] = [];
      if (filterQuery) parts.push(`filter_by=${filterQuery}`);
      const filterString = parts.join("&");

      return await this.typesenseService.searchJobsCollection(q, filterString, {
        limit,
        offset,
        page,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getJobById(organizationId: number): Promise<Job> {
    const cacheKey = `job:${organizationId}`;

    // Check cache
    const cachedJob = await redisClient.get(cacheKey);
    if (cachedJob) {
      return JSON.parse(cachedJob);
    }

    const job = await this.jobRepository.findById(organizationId);

    if (!job) {
      return this.handleError(new NotFoundError("Job", organizationId));
    }

    // Cache job for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(job));

    return job;
  }

  async incrementJobViews(jobId: number): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      return this.handleError(new NotFoundError("Job", jobId));
    }
    // Only increment views for active jobs
    if (job.isActive) {
      await this.jobInsightsRepository.incrementJobViews(jobId);
    }
  }

  async getJobsByEmployer(
    employerId: number,
    options: { page?: number; limit?: number },
    userId: number
  ) {
    // Done: Additional check for employers - they can only see their own organization's jobs
    const organization = await this.organizationRepository.findById(employerId);
    if (!organization) {
      return this.handleError(new NotFoundError("Organization", employerId));
    }
    const isMember = await this.organizationRepository.findByContact(userId);
    if (!isMember || isMember.id !== employerId) {
      return this.handleError(
        new ForbiddenError(
          "You are not authorized to view jobs for this organization"
        )
      );
    }
    return await this.jobRepository.findJobsByEmployer(employerId, options);
  }

  async createJob(jobData: CreateJobSchema["body"]): Promise<JobWithSkills> {
    // Todo Fetch this from organizationMembers table

    const { employerId } = jobData;

    // Sanitize and process job data
    const sanitizedData = {
      ...jobData,
      employerId,
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
      throw new AppError(
        "Failed to retrieve created job",
        500,
        ErrorCode.DATABASE_ERROR
      );
    }

    // Enqueue job for indexing in Typesense
    await jobIndexerQueue.add("indexJob", jobWithSkills);

    return jobWithSkills;
  }

  async updateJob(jobId: number, updateData: UpdateJob): Promise<Job> {
    const job = await this.getJobById(jobId);

    if (!job) {
      throw new NotFoundError("Job", jobId);
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
      location: updateData.city
        ? SecurityUtils.sanitizeInput(updateData.city)
        : undefined,
      requiredSkills: updateData.state
        ? this.processSkillsArray(updateData.state)
        : undefined,
    };

    const success = await this.jobRepository.updateJob(sanitizedData, jobId);
    if (!success) {
      throw new AppError("Failed to update job", 500, ErrorCode.DATABASE_ERROR);
    }

    const updatedJob = await this.jobRepository.findJobByIdWithSkills(jobId);

    if (!updatedJob) {
      throw new AppError(
        "Failed to retrieve created job",
        500,
        ErrorCode.DATABASE_ERROR
      );
    }

    // Update job indexes in Typesense
    await jobIndexerQueue.add("updateJobIndex", { id: jobId, updatedJob });

    return updatedJob;
  }

  async deleteJob(jobId: number, requesterId: number): Promise<void> {
    const job = await this.getJobById(jobId);
    if (!job) throw new NotFoundError("Job", jobId);

    const organization =
      await this.organizationRepository.findByContact(requesterId);
    if (!organization)
      throw new ForbiddenError("You do not belong to any organization");
    if (job.employerId !== organization.id) {
      throw new ForbiddenError(
        "You can only delete jobs posted by your organization"
      );
    }

    const [user, orgDetails] = await Promise.all([
      this.userRepository.findById(requesterId),
      this.organizationRepository.findById(job.employerId),
    ]);

    if (!user) throw new NotFoundError("User", requesterId);
    if (!orgDetails) throw new NotFoundError("Organization", job.employerId);

    const applications = await this.jobRepository.findApplicationsByJob(jobId);
    if (applications.items.length > 0) {
      throw new ForbiddenError("Cannot delete job with existing applications");
    }

    const success = await this.jobRepository.delete(jobId);
    if (!success) {
      throw new AppError("Failed to delete job", 500, ErrorCode.DATABASE_ERROR);
    }

    await redisClient.del(`job:${jobId}`);
    await this.invalidateActiveJobsCache();

    try {
      const firstName = user.fullName?.split(" ")[0] || "User";
      await this.emailService.sendJobDeletionConfirmation(
        user.email,
        firstName,
        job.title,
        orgDetails.name || "Company"
      );
    } catch (error) {
      console.error("Failed to send job deletion email:", error);
    }

    await jobIndexerQueue.add("deleteJobIndex", { id: jobId });
  }

  // Job Application Methods
  async applyForJob(
    applicationData: NewJobApplication
  ): Promise<{ applicationId: number; message: string }> {
    // Check if job exists and is active
    const job = await this.getJobById(applicationData.jobId);
    if (!job.isActive) {
      return this.handleError(
        new ValidationError("This job is no longer accepting applications")
      );
    }

    // Check application deadline
    if (
      job.applicationDeadline &&
      new Date() > new Date(job.applicationDeadline)
    ) {
      return this.handleError(
        new ValidationError("The application deadline has passed")
      );
    }

    // Check if user has already applied
    const hasApplied = await this.jobRepository.hasUserAppliedToJob(
      applicationData.applicantId,
      applicationData.jobId
    );

    if (hasApplied) {
      return this.handleError(
        new ConflictError("You have already applied for this job")
      );
    }

    // Sanitize application data
    const sanitizedData = {
      ...applicationData,
      coverLetter: SecurityUtils.sanitizeInput(
        applicationData.coverLetter ?? ""
      ),
    };

    const applicationId =
      await this.jobRepository.createApplication(sanitizedData);

    if (!applicationId) {
      return this.handleError(
        new AppError(
          "Failed to submit application",
          500,
          ErrorCode.DATABASE_ERROR
        )
      );
    }

    return {
      applicationId,
      message: "Application submitted successfully",
    };
  }

  async getJobApplications(
    jobId: number,
    { page, limit, status }: SearchParams["query"],
    userId: number
  ) {
    return await this.jobRepository.findApplicationsByJob(jobId, {
      page,
      limit,
      status,
    });
  }

  async getUserApplications(
    userId: number,
    { page, limit, status }: SearchParams["query"]
  ) {
    try {
      return await this.jobRepository.findApplicationsByUser(userId, {
        page,
        limit,
        status,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateApplicationStatus(
    applicationId: number,
    data: UpdateJobApplication,
    requesterId: number
  ): Promise<{ message: string }> {
    // Get application details
    const [application] =
      await this.jobRepository.findApplicationById(applicationId);

    if (!application) {
      return this.handleError(new NotFoundError("Application", applicationId));
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
      data
    );
    if (!success) {
      return this.handleError(
        new AppError(
          "Failed to update application status",
          500,
          ErrorCode.DATABASE_ERROR
        )
      );
    }

    return { message: "Application status updated successfully" };
  }

  async withdrawApplication(applicationId: number): Promise<{
    user: { email: string; fullName: string | null };
    job: { title: string };
    employer: { name: string } | null;
  }> {
    // Update status
    const success = await this.jobRepository.updateApplicationStatus(
      applicationId,
      { status: "withdrawn" }
    );

    if (!success) {
      return this.handleError(
        new AppError(
          "Failed to withdraw application",
          500,
          ErrorCode.DATABASE_ERROR
        )
      );
    }

    // Fetch and return domain data only
    const [applicationData] =
      await this.jobRepository.findApplicationById(applicationId);

    if (!applicationData) {
      return this.handleError(new NotFoundError("Application", applicationId));
    }

    // Return raw domain data
    return {
      user: applicationData.user,
      job: applicationData.job,
      employer: applicationData.employer,
    };
  }

  async deleteJobApplicationsByUserId(userId: number): Promise<void> {
    try {
      await this.jobRepository.deleteJobApplicationsByUserId(userId);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Dashboard and Statistics Methods
  // async getJobStatistics() {
  //   try {
  //     return await this.jobRepository.getJobStatistics();
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

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

  // async getEmployerDashboard(organizationId: number) {
  //   const organization =
  //     await this.organizationRepository.findById(organizationId);
  //   if (!organization) {
  //     return this.handleError(
  //       new NotFoundError("Organization", organizationId),
  //     );
  //   }
  //
  //   const jobs = await this.jobRepository.findJobsByEmployer(organizationId, {
  //     limit: 1000,
  //   });
  //   const jobInsights =
  //     await this.jobInsightsRepository.getJobInsightByOrganizationId(
  //       organizationId,
  //     );
  //   const recentJobs = jobs.items.slice(0, 5);
  //
  //   // Get job statistics
  //   const jobStats = {
  //     total: jobs.items.length,
  //     active: jobs.items.filter((job) => job.isActive).length,
  //     inactive: jobs.items.filter((job) => !job.isActive).length,
  //     totalViews: jobs.items.reduce(
  //       (sum, job) => sum + (jobInsights?.viewCount || 0),
  //       0,
  //     ),
  //     totalApplications: jobs.items.reduce(
  //       (sum, job) => sum + (jobInsights?.applicationCount || 0),
  //       0,
  //     ),
  //   };
  //
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

  private async invalidateActiveJobsCache(): Promise<void> {
    try {
      const keys = await redisClient.keys("jobs:active:*");
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error("Failed to invalidate active jobs cache:", error);
    }
  }
}
