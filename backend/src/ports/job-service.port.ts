import type { Result } from "@/services/base.service";
import type { JobService } from "@/services/job.service";
import type {
  Job,
  UpdateJob,
  UpdateJobApplication,
  JobWithSkills,
  JobWithEmployer,
  CreateJobSchema,
  NewJobApplication,
} from "@/validations/job.validation";
import type { SearchParams } from "@/validations/base.validation";

/**
 * Port interface for JobService.
 * Defines the public contract for job-related operations.
 */
export interface JobServicePort {
  getAllActiveJobs(
    userId: number | undefined,
    options?: { page?: number; limit?: number },
  ): Promise<Awaited<ReturnType<JobService["getAllActiveJobs"]>>>;

  getActiveJobsByOrganization(
    organizationId: number,
  ): Promise<Result<Job[], Error>>;

  searchJobs(
    filters: SearchParams["query"],
  ): Promise<Awaited<ReturnType<JobService["searchJobs"]>>>;

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
  ): Promise<Awaited<ReturnType<JobService["getJobsByEmployer"]>>>;

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
    query: SearchParams["query"],
    requesterId: number,
  ): Promise<Awaited<ReturnType<JobService["getJobApplications"]>>>;

  getUserApplications(
    userId: number,
    query: SearchParams["query"],
  ): Promise<Awaited<ReturnType<JobService["getUserApplications"]>>>;

  updateApplicationStatus(
    applicationId: number,
    data: UpdateJobApplication,
    requesterId: number,
  ): Promise<Result<{ message: string }, Error>>;

  withdrawApplication(
    applicationId: number,
    userId: number,
  ): Promise<Result<{ message: string }, Error>>;

  deleteJobApplicationsByUserId(
    userId: number,
  ): Promise<Result<null, Error>>;

  getEmployerJobStats(
    organizationId: number,
  ): Promise<Awaited<ReturnType<JobService["getEmployerJobStats"]>>>;
}
