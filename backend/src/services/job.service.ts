import { JobRepository } from "@/repositories/job.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { BaseService } from "./base.service";
import {
  NewJob,
  NewJobApplication,
  Job,
  JobApplication,
  UpdateJob,
  UpdateJobApplication,
} from "@/validations/job.validation";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "@/utils/errors";
import { SecurityUtils } from "@/utils/security";
import { AppError, ErrorCode } from "@/utils/errors";
import { JobInsightsRepository } from "@/repositories/jobInsights.repository";
import { SearchParams } from "@/validations/base.validation";

export class JobService extends BaseService {
  private jobRepository: JobRepository;
  private organizationRepository: OrganizationRepository;
  private jobInsightsRepository: JobInsightsRepository;

  constructor() {
    super();
    this.jobRepository = new JobRepository();
    this.organizationRepository = new OrganizationRepository();
    this.jobInsightsRepository = new JobInsightsRepository();
  }

  async getAllActiveJobs(options: { page?: number; limit?: number } = {}) {
    try {
      return await this.jobRepository.findActiveJobs(options);
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
      return await this.jobRepository.searchJobs(filters);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getJobById(id: number): Promise<Job> {
    const job = await this.jobRepository.findById(id);

    if (!job) {
      return this.handleError(new NotFoundError("Job", id));
    }
    return job;
  }

  async incrementJobViews(jobId: number): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      return this.handleError(new NotFoundError("Job", jobId));
    }
    await this.jobInsightsRepository.incrementJobViews(jobId);
  }

  async getJobsByEmployer(
    employerId: number,
    options: { page?: number; limit?: number } = {},
    requesterId: number
  ) {
    // Todo: Additional check for employers - they can only see their own organization's jobs
    const organization =
      await this.organizationRepository.findByContact(requesterId);
    if (!organization) {
      return this.handleError(
        new ForbiddenError("You do not belong to any organization")
      );
    }

    if (organization.id !== employerId) {
      return this.handleError(
        new ForbiddenError("You can only view jobs for your organization")
      );
    }

    return await this.jobRepository.findJobsByEmployer(employerId, options);
  }

  async createJob(jobData: NewJob): Promise<Job> {
    // Todo Fetch this from organizationMembers table
    // Validate employer exists
    const employer = await this.organizationRepository.findById(
      jobData.employerId
    );

    if (!employer) {
      return this.handleError(
        new NotFoundError("Organization", jobData.employerId)
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
    return await this.getJobById(jobId);
  }

  async updateJob(
    id: number,
    updateData: UpdateJob,
    requesterId: number
  ): Promise<Job> {
    const job = await this.getJobById(id);

    if (!job) {
      throw new NotFoundError("Job", id);
    }

    // Authorization check - only admin or employer who posted the job can update
    const organization =
      await this.organizationRepository.findByContact(requesterId);

    if (!organization) {
      throw new ForbiddenError("You do not belong to any organization");
    }

    if (job.employerId !== organization.id) {
      throw new ForbiddenError(
        "You can only update jobs posted by your organization"
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
      location: updateData.location
        ? SecurityUtils.sanitizeInput(updateData.location)
        : undefined,
      requiredSkills: updateData.skills
        ? this.processSkillsArray(updateData.skills)
        : undefined,
    };

    const success = await this.jobRepository.update(id, sanitizedData);
    if (!success) {
      throw new AppError("Failed to update job", 500, ErrorCode.DATABASE_ERROR);
    }

    return await this.getJobById(id);
  }

  async deleteJob(id: number, requesterId: number): Promise<void> {
    const job = await this.getJobById(id);

    if (!job) {
      throw new NotFoundError("Job", id);
    }

    // Authorization check - only admin or employer who posted the job can delete
    const organization =
      await this.organizationRepository.findByContact(requesterId);

    if (!organization) {
      throw new ForbiddenError("You do not belong to any organization");
    }

    if (job.employerId !== organization.id) {
      throw new ForbiddenError(
        "You can only delete jobs posted by your organization"
      );
    }

    // Check if job has applications - if so, prevent deletion
    const applications = await this.jobRepository.findApplicationsByJob(id);

    if (applications.items.length > 0) {
      throw new ForbiddenError("Cannot delete job with existing applications");
    }

    const success = await this.jobRepository.delete(id);
    if (!success) {
      throw new AppError("Failed to delete job", 500, ErrorCode.DATABASE_ERROR);
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
    requesterId: number
  ) {
    // Authorization check - only admin or employer who posted the job can view applications
    const [job, organization] = await Promise.all([
      this.getJobById(jobId),
      this.organizationRepository.findByContact(requesterId),
    ]);

    if (!organization) {
      return this.handleError(
        new ForbiddenError("You do not belong to any organization")
      );
    }

    if (job.employerId !== organization.id) {
      return this.handleError(
        new ForbiddenError(
          "You can only view applications for jobs posted by your organization"
        )
      );
    }

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

    // Authorization check - only admin or employer who posted the job can delete
    const [job, organization] = await Promise.all([
      this.getJobById(application.job.id),
      this.organizationRepository.findByContact(requesterId),
    ]);

    if (!organization) {
      return this.handleError(
        new ForbiddenError("You do not belong to any organization")
      );
    }

    if (organization.id !== job.employerId) {
      return this.handleError(
        new ForbiddenError(
          "You can only update applications for jobs posted by your organization"
        )
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
  const [applicationData] = await this.jobRepository.findApplicationById(
    applicationId
  );

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
}
