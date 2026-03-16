import { BaseService } from "@shared/base/base.service";
import { JobBoardService } from "@/modules/job-board/services/job-board.service";
import { JobBoardRepository } from "@/modules/job-board/repositories/job-board.repository";
import { JobInsightsRepository } from "@/modules/job-board";
import { ApplicationsService } from "@/modules/applications/services/applications.service";
import { ApplicationsRepository } from "@/modules/applications/repositories/applications.repository";
import { TypesenseService } from "@shared/infrastructure/typesense.service/typesense.service";
import {
  ApplicationsToJobBoardAdapter,
  JobBoardToApplicationsAdapter,
  OrganizationsToApplicationsAdapter,
  OrganizationsToJobBoardAdapter,
  IdentityToApplicationsAdapter,
  IdentityToJobBoardAdapter,
} from "@shared/adapters";
import { IdentityRepository } from "@/modules/identity/repositories/identity.repository";
import { OrganizationsRepository } from "@/modules/organizations/repositories/organizations.repository";
import { BullMqEventBus } from "@shared/events";
import type {
  CreateJobSchema,
  JobWithSkills,
  JobWithEmployer,
  Job,
  UpdateJob,
  UpdateJobApplication,
  NewJobApplication,
} from "@/validations/job.validation";
import type { SearchParams } from "@/validations/base.validation";
import type { ApplicationQueryParams } from "@/validations/jobApplications.validation";
import type { Result } from "@shared/result";

/**
 * Facade service that delegates to module-specific services.
 * Maintains backward compatibility with JobServicePort while the codebase
 * is incrementally migrated to use module services directly.
 *
 * @deprecated Use `JobBoardService` from `@/modules/job-board` and `ApplicationsService` from
 * `@/modules/applications` instead. This monolithic class will be removed once all consumers
 * have migrated to the new modular services.
 */
export class JobService extends BaseService {
  private jobBoardService: JobBoardService;
  private applicationsService: ApplicationsService;

  constructor() {
    super();

    // Job Board module
    const jobBoardRepository = new JobBoardRepository();
    const jobInsightsRepository = new JobInsightsRepository();
    const typesenseService = new TypesenseService();
    const applicationsRepository = new ApplicationsRepository();
    const applicationStatusAdapter = new ApplicationsToJobBoardAdapter(
      applicationsRepository,
    );
    const organizationsRepository = new OrganizationsRepository();
    const orgMembershipForJobAdapter = new OrganizationsToJobBoardAdapter(
      organizationsRepository,
    );
    const identityRepository = new IdentityRepository();
    const userContactAdapter = new IdentityToJobBoardAdapter(
      identityRepository,
    );

    this.jobBoardService = new JobBoardService(
      jobBoardRepository,
      jobInsightsRepository,
      typesenseService,
      applicationStatusAdapter,
      orgMembershipForJobAdapter,
      userContactAdapter,
    );

    // Applications module (with cross-module adapters — reuses repos from above)
    const jobDetailsAdapter = new JobBoardToApplicationsAdapter(
      jobBoardRepository,
    );
    const orgMembershipAdapter = new OrganizationsToApplicationsAdapter(
      organizationsRepository,
    );
    const applicantAdapter = new IdentityToApplicationsAdapter(
      identityRepository,
    );

    this.applicationsService = new ApplicationsService(
      applicationsRepository,
      jobDetailsAdapter,
      orgMembershipAdapter,
      applicantAdapter,
      new BullMqEventBus(),
    );
  }

  // ─── Job Board Methods (delegate to JobBoardService) ────────────────

  async getAllActiveJobs(
    userId: number | undefined,
    options: { page?: number; limit?: number } = {},
  ) {
    return this.jobBoardService.getAllActiveJobs(userId, options);
  }

  async getActiveJobsByOrganization(
    organizationId: number,
  ): Promise<Result<Job[], Error>> {
    return this.jobBoardService.getActiveJobsByOrganization(organizationId);
  }

  async searchJobs(filters: SearchParams["query"]) {
    return this.jobBoardService.searchJobs(filters);
  }

  async getJobById(
    id: number,
    userId?: number | undefined,
  ): Promise<Result<JobWithEmployer, Error>> {
    return this.jobBoardService.getJobById(id, userId);
  }

  async incrementJobViews(jobId: number): Promise<Result<null, Error>> {
    return this.jobBoardService.incrementJobViews(jobId);
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
    return this.jobBoardService.getJobsByEmployer(employerId, options);
  }

  async createJob(
    jobData: CreateJobSchema["body"] & { employerId: number },
  ): Promise<Result<JobWithSkills, Error>> {
    return this.jobBoardService.createJob(jobData);
  }

  async updateJob(
    id: number,
    updateData: UpdateJob,
    requesterId: number,
  ): Promise<Result<Job, Error>> {
    return this.jobBoardService.updateJob(id, updateData, requesterId);
  }

  async deleteJob(
    id: number,
    requesterId: number,
  ): Promise<Result<null, Error>> {
    return this.jobBoardService.deleteJob(id, requesterId);
  }

  async getEmployerJobStats(organizationId: number) {
    return this.jobBoardService.getEmployerJobStats(organizationId);
  }

  // ─── Application Methods (delegate to ApplicationsService) ──────────

  async applyForJob(
    applicationData: NewJobApplication & {
      resume?: Express.Multer.File;
      coverLetterFile?: Express.Multer.File;
    },
    correlationId: string,
  ): Promise<Result<{ applicationId: number; message: string }, Error>> {
    return this.applicationsService.applyForJob(applicationData, correlationId);
  }

  async getJobApplications(
    jobId: number,
    query: ApplicationQueryParams,
    requesterId: number,
  ) {
    return this.applicationsService.getJobApplications(
      jobId,
      query,
      requesterId,
    );
  }

  async getUserApplications(userId: number, query: ApplicationQueryParams) {
    return this.applicationsService.getUserApplications(userId, query);
  }

  async updateApplicationStatus(
    applicationId: number,
    data: UpdateJobApplication,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>> {
    return this.applicationsService.updateApplicationStatus(
      applicationId,
      data,
      requesterId,
    );
  }

  async withdrawApplication(
    applicationId: number,
    userId: number,
  ): Promise<Result<{ message: string }, Error>> {
    return this.applicationsService.withdrawApplication(applicationId, userId);
  }

  async deleteJobApplicationsByUserId(
    userId: number,
  ): Promise<Result<null, Error>> {
    return this.applicationsService.deleteJobApplicationsByUserId(userId);
  }
}
