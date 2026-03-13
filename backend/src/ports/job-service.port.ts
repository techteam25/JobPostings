import type { Result } from "@shared/result";
import {
  Job,
  UpdateJob,
  UpdateJobApplication,
  JobWithSkills,
  JobWithEmployer,
  CreateJobSchema,
  NewJobApplication,
  OrganizationJobInsightInterface,
} from "@/validations/job.validation";
import { JobDocumentType, SearchParams } from "@/validations/base.validation";
import type { PaginationMeta } from "@shared/types";
import { SearchResponse } from "typesense/lib/Typesense/Documents";
import {
  type ApplicationQueryParams,
  ApplicationsByJobInterface,
  ApplicationsByUserInterface,
} from "@/validations/jobApplications.validation";

/**
 * Port interface for JobService.
 * Defines the public contract for job-related operations.
 */
export interface JobServicePort {
  getAllActiveJobs(
    userId: number | undefined,
    options?: Partial<Pick<PaginationMeta, "limit" | "page">>,
  ): Promise<
    Result<
      {
        items: JobWithEmployer[];
        pagination: PaginationMeta;
      },
      Error
    >
  >;

  getActiveJobsByOrganization(
    organizationId: number,
  ): Promise<Result<Job[], Error>>;

  searchJobs(
    filters: SearchParams["query"],
  ): Promise<Result<SearchResponse<JobDocumentType>, Error>>;

  getJobById(
    id: number,
    userId?: number | undefined,
  ): Promise<Result<JobWithEmployer, Error>>;

  incrementJobViews(jobId: number): Promise<Result<null, Error>>;

  getJobsByEmployer(
    employerId: number,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      q?: string;
      order?: string;
    },
  ): Promise<Result<{ items: Job[]; pagination: PaginationMeta }, Error>>;

  createJob(
    jobData: CreateJobSchema["body"] & { employerId: number },
  ): Promise<Result<JobWithSkills, Error>>;

  updateJob(
    id: number,
    updateData: UpdateJob,
    requesterId: number,
  ): Promise<Result<Job, Error>>;

  deleteJob(
    id: number,
    requesterId: number,
    organizationId: number,
  ): Promise<Result<null, Error>>;

  applyForJob(
    applicationData: NewJobApplication & {
      resume?: Express.Multer.File;
      coverLetterFile?: Express.Multer.File;
    },
    correlationId: string,
  ): Promise<Result<{ applicationId: number; message: string }, Error>>;

  getJobApplications(
    jobId: number,
    query: ApplicationQueryParams,
    requesterId: number,
  ): Promise<Result<ApplicationsByJobInterface, Error>>;

  getUserApplications(
    userId: number,
    query: ApplicationQueryParams,
  ): Promise<Result<ApplicationsByUserInterface, Error>>;

  updateApplicationStatus(
    applicationId: number,
    data: UpdateJobApplication,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>>;

  withdrawApplication(
    applicationId: number,
    userId: number,
  ): Promise<Result<{ message: string }, Error>>;

  deleteJobApplicationsByUserId(userId: number): Promise<Result<null, Error>>;

  getEmployerJobStats(
    organizationId: number,
  ): Promise<Result<OrganizationJobInsightInterface, Error>>;
}
