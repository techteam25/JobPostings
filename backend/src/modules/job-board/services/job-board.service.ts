import { Result, fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
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
import type { TypesenseJobServicePort } from "@shared/ports/typesense-service.port";
import type { ApplicationStatusQueryPort } from "@/modules/job-board/ports/application-status-query.port";
import type { SavedJobsStatusQueryPort } from "@/modules/job-board/ports/saved-jobs-status-query.port";
import type { OrgMembershipForJobPort } from "@/modules/job-board/ports/org-membership-for-job.port";
import type { UserContactQueryPort } from "@/modules/job-board/ports/user-contact-query.port";

import type {
  JobWithEmployer,
  JobWithSkills,
  CreateJobSchema,
  UpdateJob,
  Job,
} from "@/validations/job.validation";
import type { SearchParams } from "@/validations/base.validation";

const DATE_POSTED_MS: Record<string, number> = {
  "last-24-hours": 86_400_000,
  "last-7-days": 604_800_000,
  "last-14-days": 1_209_600_000,
};

export class JobBoardService
  extends BaseService
  implements JobBoardServicePort
{
  constructor(
    private jobBoardRepository: JobBoardRepositoryPort,
    private jobInsightsRepository: JobInsightsRepositoryPort,
    private typesenseService: TypesenseJobServicePort,
    private applicationStatusQuery: ApplicationStatusQueryPort,
    private savedJobsStatusQuery: SavedJobsStatusQueryPort,
    private orgMembershipForJob: OrgMembershipForJobPort,
    private userContactQuery: UserContactQueryPort,
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
          hasSaved: false,
        }));
        return ok({ ...activeJobs, items: enrichedJobs });
      }

      const jobIds = activeJobs.items.map((job) => job.job.id);

      const [appliedJobIds, savedJobIds] = await Promise.all([
        this.applicationStatusQuery.getAppliedJobIds(userId, jobIds),
        this.savedJobsStatusQuery.getSavedJobIds(userId, jobIds),
      ]);

      const enrichedJobs = activeJobs.items.map((job) => ({
        ...job,
        hasApplied: appliedJobIds.has(job.job.id),
        hasSaved: savedJobIds.has(job.job.id),
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
        sortBy,
        datePosted,
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

      if (datePosted && DATE_POSTED_MS[datePosted]) {
        const threshold = Date.now() - DATE_POSTED_MS[datePosted];
        queryBuilder.addRangeFilter("createdAt", ">=", threshold);
      }

      const filterQuery = queryBuilder.build();

      const parts: string[] = [];
      if (filterQuery) parts.push(filterQuery);
      const filterString = parts.join("&");

      // Map frontend sort values to Typesense sort params:
      // "relevant" + real query → omit sort_by (Typesense uses text relevance)
      // "recent" or no sortBy or no real query → sort by createdAt:desc
      const hasTextQuery = !!q && q.trim() !== "" && q.trim() !== "*";
      const useRelevanceSort = sortBy === "relevant" && hasTextQuery;

      const results = await this.typesenseService.searchJobsCollection(
        q,
        filterString,
        {
          limit,
          offset,
          page,
          sortBy: useRelevanceSort ? undefined : "createdAt",
          sortDirection: "desc",
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
        return ok({ ...job, hasApplied: false, hasSaved: false });
      }

      const [hasApplied, hasSaved] = await Promise.all([
        this.applicationStatusQuery.hasUserApplied(userId, id),
        this.savedJobsStatusQuery.hasUserSavedJob(userId, id),
      ]);

      return ok({ ...job, hasApplied, hasSaved });
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
      const jobsByEmployer = await this.jobBoardRepository.findJobsByEmployer(
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
      const employerExists = await this.orgMembershipForJob.organizationExists(
        jobData.employerId,
      );

      if (!employerExists) {
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
        QUEUE_NAMES.TYPESENSE_JOB_QUEUE,
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

      const membership = await this.orgMembershipForJob.findByContact(
        requesterId,
        job.employer!.id,
      );

      if (!membership) {
        return fail(
          new ForbiddenError("You do not belong to any organization"),
        );
      }

      if (job.job.employerId !== membership.organizationId) {
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

      // Enqueue the bare JobWithSkills so the indexer worker sees the same
      // shape it does in the `indexJob` path — it destructures the job's
      // own fields (employer, skills, ...), not an outer wrapper.
      await queueService.addJob(
        QUEUE_NAMES.TYPESENSE_JOB_QUEUE,
        "updateJobIndex",
        updatedJob,
      );

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

      await queueService.addJob(
        QUEUE_NAMES.TYPESENSE_JOB_QUEUE,
        "deleteJobIndex",
        {
          id,
        },
      );

      const userContact =
        await this.userContactQuery.getUserContactInfo(requesterId);
      if (userContact) {
        await queueService.addJob(
          QUEUE_NAMES.EMAIL_QUEUE,
          "sendJobDeletionEmail",
          {
            userId: requesterId,
            email: userContact.email,
            fullName: userContact.fullName,
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
