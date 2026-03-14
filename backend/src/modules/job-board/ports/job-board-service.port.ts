import type { Result } from "@shared/result";
import type {
  Job,
  JobWithEmployer,
  JobWithSkills,
  CreateJobSchema,
  UpdateJob,
  OrganizationJobInsightInterface,
} from "@/validations/job.validation";
import type { JobDocumentType, SearchParams } from "@/validations/base.validation";
import type { PaginationMeta } from "@shared/types";
import type { SearchResponse } from "typesense/lib/Typesense/Documents";

export interface JobBoardServicePort {
  getAllActiveJobs(
    userId: number | undefined,
    options?: Partial<Pick<PaginationMeta, "limit" | "page">>,
  ): Promise<
    Result<{ items: JobWithEmployer[]; pagination: PaginationMeta }, Error>
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

  getEmployerJobStats(
    organizationId: number,
  ): Promise<Result<OrganizationJobInsightInterface, Error>>;
}
