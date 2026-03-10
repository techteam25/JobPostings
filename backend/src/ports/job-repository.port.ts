import type { BaseRepositoryPort } from "./base-repository.port";
import type { jobsDetails } from "@/db/schema";
import type {
  JobSkills,
  JobWithSkills,
  NewJob,
  NewJobApplication,
  UpdateJob,
  UpdateJobApplication,
} from "@/validations/job.validation";
import type { JobRepository } from "@/repositories/job.repository";

type JobSelect = typeof jobsDetails.$inferSelect;
type JobInsert = typeof jobsDetails.$inferInsert;

export interface JobRepositoryPort
  extends BaseRepositoryPort<JobSelect, JobInsert> {
  /**
   * Creates a new job with associated skills.
   */
  createJob(
    jobData: NewJob & { skills: JobSkills["name"][] },
  ): Promise<JobWithSkills>;

  /**
   * Updates an existing job with associated skills.
   */
  updateJob(jobData: UpdateJob, jobId: number): Promise<JobWithSkills>;

  /**
   * Finds a job by its ID, including employer details.
   */
  findJobById(
    id: number,
  ): Promise<
    Awaited<ReturnType<InstanceType<typeof JobRepository>["findJobById"]>>
  >;

  /**
   * Finds active jobs with pagination.
   */
  findActiveJobs(
    options?: { page?: number; limit?: number },
  ): Promise<
    Awaited<ReturnType<InstanceType<typeof JobRepository>["findActiveJobs"]>>
  >;

  /**
   * Finds jobs by employer with optional filters and pagination.
   */
  findJobsByEmployer(
    employerId: number,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      q?: string;
      order?: string;
    },
  ): Promise<
    Awaited<
      ReturnType<InstanceType<typeof JobRepository>["findJobsByEmployer"]>
    >
  >;

  /**
   * Finds a job with its applications and employer details.
   */
  findJobWithApplications(
    jobId: number,
  ): Promise<
    Awaited<
      ReturnType<InstanceType<typeof JobRepository>["findJobWithApplications"]>
    >
  >;

  /**
   * Creates a new job application and increments job view count.
   */
  createApplication(
    applicationData: NewJobApplication,
  ): Promise<
    Awaited<
      ReturnType<InstanceType<typeof JobRepository>["createApplication"]>
    >
  >;

  /**
   * Finds applications for a specific job with pagination and optional status filter.
   */
  findApplicationsByJob(
    jobId: number,
    options?: { page?: number; limit?: number; status?: string },
  ): Promise<
    Awaited<
      ReturnType<InstanceType<typeof JobRepository>["findApplicationsByJob"]>
    >
  >;

  /**
   * Finds applications submitted by a specific user with pagination and optional status filter.
   */
  findApplicationsByUser(
    userId: number,
    appliedJobIds?: number[],
    options?: {
      page?: number;
      limit?: number;
      status?:
        | "pending"
        | "reviewed"
        | "shortlisted"
        | "interviewing"
        | "rejected"
        | "hired"
        | "withdrawn";
    },
  ): Promise<
    Awaited<
      ReturnType<InstanceType<typeof JobRepository>["findApplicationsByUser"]>
    >
  >;

  /**
   * Updates the status of a job application.
   */
  updateApplicationStatus(
    applicationId: number,
    updateData: UpdateJobApplication,
  ): Promise<boolean>;

  /**
   * Finds a job application by its ID, including job and applicant details.
   */
  findApplicationById(
    applicationId: number,
  ): Promise<
    Awaited<
      ReturnType<InstanceType<typeof JobRepository>["findApplicationById"]>
    >
  >;

  /**
   * Checks if a user has applied to a specific job.
   */
  hasUserAppliedToJob(userId: number, jobId: number): Promise<boolean>;

  /**
   * Deletes all job applications for a specific user.
   */
  deleteJobApplicationsByUserId(userId: number): Promise<void>;

  /**
   * Finds a job by its ID, including associated skills.
   */
  findJobByIdWithSkills(
    jobId: number,
  ): Promise<
    Awaited<
      ReturnType<InstanceType<typeof JobRepository>["findJobByIdWithSkills"]>
    >
  >;
}
