import { BaseService, Result } from "./base.service";
import { JobInsightsRepository } from "@/repositories/jobInsights.repository";
import { JobRepository } from "@/repositories/job.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { TypesenseService } from "@/services/typesense.service/typesense.service";
import { UserRepository } from "@/repositories/user.repository";

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
import { emailSenderQueue, jobIndexerQueue } from "@/utils/bullmq.utils";
import { TypesenseQueryBuilder } from "@/utils/typesense-queryBuilder";

import { fail, ok } from "./base.service";
import logger from "@/logger";

export class JobService extends BaseService {
  private jobRepository: JobRepository;
  private organizationRepository: OrganizationRepository;
  private jobInsightsRepository: JobInsightsRepository;
  private typesenseService: TypesenseService;
  private userRepository: UserRepository;

  constructor() {
    super();
    this.jobRepository = new JobRepository();
    this.organizationRepository = new OrganizationRepository();
    this.jobInsightsRepository = new JobInsightsRepository();
    this.typesenseService = new TypesenseService();
    this.userRepository = new UserRepository();
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

  async getJobById(
    id: number,
  ): Promise<Result<JobWithEmployer[number], Error>> {
    try {
      const job = await this.jobRepository.findJobById(id);

      if (!job) {
        return fail(new NotFoundError("Job", id));
      }

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
    } catch {
      return fail(new DatabaseError("Failed to fetch job by ID"));
    }
  }

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
      await jobIndexerQueue.add("updateJobIndex", { id, updatedJob });

      return ok(updatedJob);
    } catch {
      return fail(new DatabaseError("Failed to update job"));
    }
  }

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

      await jobIndexerQueue.add("deleteJobIndex", { id });

      const user = await this.userRepository.findById(requesterId);
      if (user) {
        await emailSenderQueue.add("sendJobDeletionEmail", {
          userEmail: user.email,
          userName: user.fullName,
          jobTitle: job.value.job.title,
          jobId: id,
          organizationId,
        });
      }

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

      // Fetch user details for email notification
      const applicant = await this.userRepository.findById(
        applicationData.applicantId,
      );

      if (applicant) {
        // Enqueue email notification
        await emailSenderQueue.add("sendJobApplicationConfirmation", {
          email: applicant.email,
          fullName: applicant.fullName,
          jobTitle: job.value.job.title,
          jobId: applicationData.jobId,
        });
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
        await emailSenderQueue.add("sendApplicationWithdrawalConfirmation", {
          email: applicant.email,
          fullName: applicant.fullName,
          jobTitle: application.job.title,
          applicationId: applicationId,
        });
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
