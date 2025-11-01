import { BaseService, Result } from "./base.service";
import { JobInsightsRepository } from "@/repositories/jobInsights.repository";
import { JobRepository } from "@/repositories/job.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { TypesenseService } from "@/services/typesense.service/typesense.service";

import {
  NewJobApplication,
  Job,
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
  DatabaseError,
} from "@/utils/errors";
import { SecurityUtils } from "@/utils/security";
import { AppError, ErrorCode } from "@/utils/errors";

import { SearchParams } from "@/validations/base.validation";
import { jobIndexerQueue } from "@/utils/bullmq.utils";
import { TypesenseQueryBuilder } from "@/utils/typesense-queryBuilder";

import { fail, ok } from "./base.service";

export class JobService extends BaseService {
  private jobRepository: JobRepository;
  private organizationRepository: OrganizationRepository;
  private jobInsightsRepository: JobInsightsRepository;
  private typesenseService: TypesenseService;

  constructor() {
    super();
    this.jobRepository = new JobRepository();
    this.organizationRepository = new OrganizationRepository();
    this.jobInsightsRepository = new JobInsightsRepository();
    this.typesenseService = new TypesenseService();
  }

  async getAllActiveJobs(options: { page?: number; limit?: number } = {}) {
    try {
      const activeJobs = await this.jobRepository.findActiveJobs(options);
      return ok(activeJobs);
    } catch {
      return fail(new DatabaseError("Failed to fetch active jobs"));
    }
  }

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
    } catch {
      return fail(new AppError("Failed to fetch active jobs for organization"));
    }
  }

  async getJobById(id: number): Promise<Result<Job, Error>> {
    try {
      const job = await this.jobRepository.findById(id);

      if (!job) {
        return fail(new NotFoundError("Job", id));
      }

      // Increment view count
      await this.incrementJobViews(id);

      return ok(job);
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.message.includes("Failed to find")
      ) {
        return fail(new NotFoundError("Job", id));
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
    } catch {
      return fail(new DatabaseError("Failed to fetch job by ID"));
    }
  }

  async getJobsByEmployer(
    employerId: number,
    options: { page?: number; limit?: number } = {},
    requesterId: number,
  ) {
    try {
      // Todo: Additional check for employers - they can only see their own organization's jobs
      const organization =
        await this.organizationRepository.findByContact(requesterId);
      if (!organization) {
        return fail(
          new ForbiddenError("You do not belong to any organization"),
        );
      }

      if (organization.id !== employerId) {
        return fail(
          new ForbiddenError("You can only view jobs for your organization"),
        );
      }

      const jobsByEmployer = await this.jobRepository.findJobsByEmployer(
        employerId,
        options,
      );
      return ok(jobsByEmployer);
    } catch {
      return fail(new DatabaseError("Failed to fetch jobs by employer"));
    }
  }

  async createJob(
    jobData: CreateJobSchema["body"],
  ): Promise<Result<JobWithSkills, Error>> {
    try {
      // Todo Fetch this from organizationMembers table
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
      await jobIndexerQueue.add("indexJob", jobWithSkills);

      return ok(jobWithSkills);
    } catch {
      return fail(new DatabaseError("Failed to retrieve created job"));
    }
  }

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

      if (job.value.employerId !== organization.id) {
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
      await jobIndexerQueue.add("updateJobIndex", { id, updatedJob });

      return ok(updatedJob);
    } catch {
      return fail(new DatabaseError("Failed to update job"));
    }
  }

  async deleteJob(
    id: number,
    requesterId: number,
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
          new ForbiddenError("You do not belong to any organization"),
        );
      }

      if (job.value.employerId !== organization.id) {
        throw new ForbiddenError(
          "You can only delete jobs posted by your organization",
        );
      }

      // Check if job has applications - if so, prevent deletion
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

      // Delete job indexes in Typesense
      await jobIndexerQueue.add("deleteJobIndex", { id });
      return ok(null);
    } catch {
      return fail(new DatabaseError("Failed to delete job"));
    }
  }

  // Job Application Methods
  async applyForJob(
    applicationData: NewJobApplication,
  ): Promise<Result<{ applicationId: number; message: string }, Error>> {
    try {
      // Check if job exists and is active
      const job = await this.getJobById(applicationData.jobId);

      if (!job.isSuccess) {
        return fail(new NotFoundError("Job", applicationData.jobId));
      }
      if (!job.value.isActive) {
        return fail(
          new ValidationError("This job is no longer accepting applications"),
        );
      }

      // Check application deadline
      if (
        job.value.applicationDeadline &&
        new Date() > new Date(job.value.applicationDeadline)
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

      return ok({
        applicationId,
        message: "Application submitted successfully",
      });
    } catch {
      return fail(new DatabaseError("Failed to retrieve application"));
    }
  }

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

      if (job.value.employerId !== organization.id) {
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

  async getUserApplications(
    userId: number,
    { page, limit, status }: SearchParams["query"],
  ) {
    try {
      const userApplications = await this.jobRepository.findApplicationsByUser(
        userId,
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

  async updateApplicationStatus(
    applicationId: number,
    data: UpdateJobApplication,
    requesterId: number,
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
          new ForbiddenError("You do not belong to any organization"),
        );
      }

      if (organization.id !== job.value.employerId) {
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

      // Check if user owns this application
      if ((application as any).applicantId !== userId) {
        return fail(
          new ForbiddenError("You can only withdraw your own applications"),
        );
      }

      // Check if application can be withdrawn
      if (["hired", "rejected"].includes((application as any).status)) {
        return fail(
          new ValidationError("Cannot withdraw application with final status"),
        );
      }

      const success = await this.jobRepository.updateApplicationStatus(
        applicationId,
        {
          status: "withdrawn",
        } as any,
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
}
