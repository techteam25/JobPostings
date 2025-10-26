import { JobRepository } from "@/repositories/job.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { UserRepository } from "@/repositories/user.repository";
import { EmailService } from "@/services/email.service";
import { BaseService } from "./base.service";
import {
  NewJob,
  NewJobApplication,
  Job,
  JobWithEmployer,
  JobApplication,
  UpdateJob,
  UpdateJobApplication,
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
import { JobInsightsRepository } from "@/repositories/jobInsights.repository";
import { SearchParams } from "@/validations/base.validation";
import { OrganizationService } from "./organization.service";
import Redis from "ioredis";

// Initialize Redis client using REDIS_URL
const redis = new Redis(process.env.REDIS_URL || "");

export class JobService extends BaseService {
  private jobRepository: JobRepository;
  private organizationRepository: OrganizationRepository;
  private userRepository: UserRepository;
  private jobInsightsRepository: JobInsightsRepository;
  private organizationService: OrganizationService;
  private emailService: EmailService;

  constructor() {
    super();
    this.jobRepository = new JobRepository();
    this.organizationRepository = new OrganizationRepository();
    this.userRepository = new UserRepository();
    this.jobInsightsRepository = new JobInsightsRepository();
    this.organizationService = new OrganizationService();
    this.emailService = new EmailService();
  }

  async getAllActiveJobs(options: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const cacheKey = `jobs:active:${page}:${limit}`;

      // Check cache
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      // Fetch from database
      const result = await this.jobRepository.findActiveJobs(options);

      // Cache result for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(result));

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

  async searchJobs(filters: {
    page?: number;
    limit?: number;
    q?: string;
    jobType?: string;
    sortBy?: string;
    location?: string;
    isRemote?: boolean;
    order?: "asc" | "desc";
    status?: string;
  }) {
    const { q: searchTerm, ...rest } = filters;
    return await this.jobRepository.searchJobs({
      searchTerm,
      ...rest,
    });
  }

  async getJobById(organizationId: number): Promise<Job> {
    const cacheKey = `job:${organizationId}`;

    // Check cache
    const cachedJob = await redis.get(cacheKey);
    if (cachedJob) {
      return JSON.parse(cachedJob);
    }

    const job = await this.jobRepository.findById(organizationId);

    if (!job) {
      return this.handleError(new NotFoundError("Job", organizationId));
    }

    // Cache job for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(job));

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

  async createJob(jobData: NewJob, userId: number): Promise<Job> {
    // Todo Fetch this from organizationMembers table
    // Validate employer exists
    const organization = await this.organizationRepository.findById(
      jobData.employerId
    );
    if (!organization) {
      return this.handleError(
        new NotFoundError("Organization", jobData.employerId)
      );
    }
    if (organization.status !== "active") {
      return this.handleError(new ForbiddenError("Organization is not active"));
    }
    if (organization.subscriptionStatus === "expired") {
      return this.handleError(
        new ForbiddenError("Organization subscription has expired")
      );
    }
    const activeJobCount = await this.jobRepository.countActiveJobsByEmployer(
      jobData.employerId
    );
    if (
      organization.jobPostingLimit !== null &&
      activeJobCount >= organization.jobPostingLimit
    ) {
      return this.handleError(
        new ForbiddenError("Organization has reached its job posting limit")
      );
    }
    const membership = await this.organizationRepository.findByContact(userId);
    if (!membership || membership.id !== jobData.employerId) {
      return this.handleError(
        new ForbiddenError("You are not a member of this organization")
      );
    }
    const canPostJobs = await this.organizationService.isRolePermitted(userId);
    if (!canPostJobs) {
      return this.handleError(
        new ForbiddenError("You do not have permission to create jobs")
      );
    }

    // Sanitize and process job data
    const sanitizedData = {
      ...jobData,
      title: SecurityUtils.sanitizeInput(jobData.title),
      description: SecurityUtils.sanitizeInput(jobData.description),
      location: SecurityUtils.sanitizeInput(jobData.location),
      skills: jobData.skills ? this.processSkillsArray(jobData.skills) : null,
      experience: jobData.experience
        ? SecurityUtils.sanitizeInput(jobData.experience)
        : null,
    };

    const jobId = await this.jobRepository.create(sanitizedData);

    // Invalidate active jobs cache
    await this.invalidateActiveJobsCache();

    return await this.getJobById(jobId);
  }

  async updateJob(
    jobId: number,
    updateData: UpdateJob,
    userId: number
  ): Promise<Job> {
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
      location: updateData.location
        ? SecurityUtils.sanitizeInput(updateData.location)
        : undefined,
      requiredSkills: updateData.skills
        ? this.processSkillsArray(updateData.skills)
        : undefined,
    };

    const updatedJob = await this.jobRepository.update(jobId, sanitizedData);
    if (!updatedJob) {
      return this.handleError(
        new AppError("Failed to update job", 500, ErrorCode.DATABASE_ERROR)
      );
    }

    // Invalidate caches
    await redis.del(`job:${jobId}`);
    await this.invalidateActiveJobsCache();

    return await this.getJobById(jobId);
  }

  async deleteJob(jobId: number, userId: number): Promise<void> {
    const job = await this.getJobById(jobId);

    if (!job) {
      return this.handleError(new NotFoundError("Job", jobId));
    }

    // Fetch user and organization details for email notification
    const [user, organization] = await Promise.all([
      this.userRepository.findById(userId),
      this.organizationRepository.findById(job.employerId),
    ]);

    if (!user) {
      return this.handleError(new NotFoundError("User", userId));
    }
    if (!organization) {
      return this.handleError(new NotFoundError("Organization", job.employerId));
    }

    // Check if job has applications - if so, prevent deletion
    const applications = await this.jobRepository.findApplicationsByJob(jobId);

    if (applications.items.length > 0) {
      return this.handleError(
        new ForbiddenError("Cannot delete job with existing applications")
      );
    }

    const success = await this.jobRepository.delete(jobId);
    if (!success) {
      return this.handleError(
        new AppError("Failed to delete job", 500, ErrorCode.DATABASE_ERROR)
      );
    }

    // Invalidate caches
    await redis.del(`job:${jobId}`);
    await this.invalidateActiveJobsCache();

    // Send email notification
    try {
      const firstName = user.fullName?.split(" ")[0] || "User";
      await this.emailService.sendJobDeletionConfirmation(
        user.email,
        firstName,
        job.title,
        organization.name || "Company"
      );
    } catch (error) {
      // Log email error but don't fail the deletion
      console.error("Failed to send job deletion email:", error);
    }
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

  async withdrawApplication(
    applicationId: number,
    userId: number
  ): Promise<{
    message: string;
    applicationDetails: {
      userEmail: string;
      userFirstName: string;
      jobTitle: string;
      companyName: string;
    };
  }> {
    const [applicationData] =
      await this.jobRepository.findApplicationById(applicationId);

    if (!applicationData) {
      return this.handleError(new NotFoundError("Application", applicationId));
    }

    const { application, job, applicant, employer } = applicationData;

    // Check for non-withdrawable statuses
    if (["hired", "rejected"].includes(application.status)) {
      return this.handleError(
        new ValidationError("Cannot withdraw application with final status")
      );
    }
    if (applicationData.application.applicantId !== userId) {
      return this.handleError(
        new ForbiddenError("You can only withdraw your own applications")
      );
    }

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

    // Return typed response
    return {
      message: "Application withdrawn successfully",
      applicationDetails: {
        userEmail: applicant.email,
        userFirstName: applicant.fullName?.split(" ")[0] ?? "",
        jobTitle: job.title,
        companyName: employer?.name ?? "Company",
      },
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
    // Invalidate all active jobs cache
    const keys = await redis.keys("jobs:active:*");
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }
}
