import { Result, fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import { QUEUE_NAMES, queueService } from "@shared/infrastructure/queue.service";
import {
  NotFoundError,
  ForbiddenError,
  DatabaseError,
  AppError,
} from "@shared/errors";
import { SecurityUtils } from "@shared/utils/security";
import { TypesenseQueryBuilder } from "@shared/infrastructure/typesense.service/typesense-queryBuilder";
import logger from "@shared/logger";

import type { JobBoardServicePort } from "@/modules/job-board";
import type { JobBoardRepositoryPort } from "@/modules/job-board";
import type { JobInsightsRepositoryPort } from "@/modules/job-board";
import type { OrganizationRepositoryPort } from "@/ports/organization-repository.port";
import type { TypesenseServicePort } from "@/ports/typesense-service.port";
import type { UserRepositoryPort } from "@/ports/user-repository.port";
import type { ApplicationStatusQueryPort } from "@/modules/job-board/ports/application-status-query.port";

import type {
  JobWithEmployer,
  JobWithSkills,
  CreateJobSchema,
  UpdateJob,
  Job,
} from "@/validations/job.validation";
import type { SearchParams } from "@/validations/base.validation";

export class JobBoardService extends BaseService implements JobBoardServicePort {
  constructor(
    private jobBoardRepository: JobBoardRepositoryPort,
    private organizationRepository: OrganizationRepositoryPort,
    private jobInsightsRepository: JobInsightsRepositoryPort,
    private typesenseService: TypesenseServicePort,
    private userRepository: UserRepositoryPort,
    private applicationStatusQuery: ApplicationStatusQueryPort,
  ) {
    super();
  }

  async getAllActiveJobs(
    userId: number | undefined,
    options: { page?: number; limit?: number } = {},
  ) {
    try {
      const activeJobs = await this.jobBoardRepository.findActiveJobs(options);

      if (!userId || activeJobs.items.length === 0) {
        const enrichedJobs = activeJobs.items.map((job) => ({
          ...job,
          hasApplied: false,
        }));
        return ok({ ...activeJobs, items: enrichedJobs });
      }

      const jobIds = activeJobs.items.map((job) => job.job.id);

      const appliedJobIds =
        await this.applicationStatusQuery.getAppliedJobIds(userId, jobIds);

      const enrichedJobs = activeJobs.items.map((job) => ({
        ...job,
        hasApplied: appliedJobIds.has(job.job.id),
      }));

      return ok({ ...activeJobs, items: enrichedJobs });
    } catch {
      return fail(new DatabaseError("Failed to fetch active jobs"));
    }
  }

  async getActiveJobsByOrganization(
    organizationId: number,
  ): Promise<Result<Job[], Error>> {
    try {
      const allJobs = await this.jobBoardRepository.findJobsByEmployer(
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
        .addSkillFilters(skillsArray, true)
        .addArrayFilter("jobType", jobTypeArray, true)
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
    userId?: number | undefined,
  ): Promise<Result<JobWithEmployer, Error>> {
    try {
      const job = await this.jobBoardRepository.findJobById(id);

      if (!job) {
        return fail(new NotFoundError("Job", id));
      }

      await this.incrementJobViews(id);

      if (!userId) {
        return ok({ ...job, hasApplied: false });
      }

      const hasApplied =
        await this.applicationStatusQuery.hasUserApplied(userId, id);

      return ok({ ...job, hasApplied });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to fetch job by ID"));
    }
  }

  async incrementJobViews(jobId: number): Promise<Result<null, Error>> {
    try {
      const job = await this.jobBoardRepository.findById(jobId);
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
      const jobsByEmployer =
        await this.jobBoardRepository.findJobsByEmployer(employerId, options);
      return ok(jobsByEmployer);
    } catch {
      return fail(new DatabaseError("Failed to fetch jobs by employer"));
    }
  }

  async createJob(
    jobData: CreateJobSchema["body"] & { employerId: number },
  ): Promise<Result<JobWithSkills, Error>> {
    try {
      const employer = await this.organizationRepository.findById(
        jobData.employerId,
      );

      if (!employer) {
        return fail(new NotFoundError("Organization", jobData.employerId));
      }

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

      const jobWithSkills =
        await this.jobBoardRepository.createJob(sanitizedData);

      if (!jobWithSkills) {
        return fail(new DatabaseError("Failed to retrieve created job"));
      }

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

  async updateJob(
    id: number,
    updateData: UpdateJob,
    requesterId: number,
  ): Promise<Result<Job, Error>> {
    try {
      const job = await this.jobBoardRepository.findJobById(id);

      if (!job) {
        return fail(new NotFoundError("Job", id));
      }

      const organization = await this.organizationRepository.findByContact(
        requesterId,
        job.employer!.id,
      );

      if (!organization) {
        return fail(
          new ForbiddenError("You do not belong to any organization"),
        );
      }

      if (job.job.employerId !== organization.id) {
        return fail(
          new ForbiddenError(
            "You can only update jobs posted by your organization",
          ),
        );
      }

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
          ? SecurityUtils.sanitizeInput(updateData.state)
          : undefined,
      };

      const success = await this.jobBoardRepository.updateJob(
        sanitizedData,
        id,
      );
      if (!success) {
        return fail(new DatabaseError("Failed to update job"));
      }

      const updatedJob =
        await this.jobBoardRepository.findJobByIdWithSkills(id);

      if (!updatedJob) {
        return fail(new DatabaseError("Failed to retrieve updated job"));
      }

      await queueService.addJob(QUEUE_NAMES.TYPESENSE_QUEUE, "updateJobIndex", {
        id,
        updatedJob,
      });

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
      const job = await this.jobBoardRepository.findJobById(id);

      if (!job) {
        return fail(new NotFoundError("Job", id));
      }

      const hasApplications =
        await this.applicationStatusQuery.hasApplicationsForJob(id);

      if (hasApplications) {
        return fail(
          new ForbiddenError("Cannot delete job with existing applications"),
        );
      }

      const success = await this.jobBoardRepository.delete(id);
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
            userId: requesterId,
            email: user.email,
            fullName: user.fullName,
            jobTitle: job.job.title,
            jobId: id,
          },
        );
      }

      return ok(null);
    } catch {
      return fail(new DatabaseError("Failed to delete job"));
    }
  }

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
}
