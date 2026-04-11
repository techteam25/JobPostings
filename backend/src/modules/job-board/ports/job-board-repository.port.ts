import type { BaseRepositoryPort } from "@shared/ports/base-repository.port";
import type { jobsDetails } from "@/db/schema";
import type {
  Job,
  JobSkills,
  JobWithEmployer,
  JobWithSkills,
  NewJob,
  UpdateJob,
} from "@/validations/job.validation";
import type { PaginationMeta } from "@shared/types";

type JobSelect = typeof jobsDetails.$inferSelect;
type JobInsert = typeof jobsDetails.$inferInsert;

export interface JobBoardRepositoryPort extends BaseRepositoryPort<
  JobSelect,
  JobInsert
> {
  createJob(
    jobData: NewJob & { skills: JobSkills["name"][] },
  ): Promise<JobWithSkills>;

  updateJob(jobData: UpdateJob, jobId: number): Promise<JobWithSkills>;

  findJobById(
    id: number,
  ): Promise<{ job: Job; employer: JobWithEmployer["employer"] }>;

  findActiveJobs(options?: { page?: number; limit?: number }): Promise<{
    items: Omit<JobWithEmployer, "hasApplied" | "hasSaved">[];
    pagination: PaginationMeta;
  }>;

  findJobsByEmployer(
    employerId: number,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      q?: string;
      order?: string;
    },
  ): Promise<{ items: Job[]; pagination: PaginationMeta }>;

  findJobByIdWithSkills(jobId: number): Promise<JobWithSkills>;
}
