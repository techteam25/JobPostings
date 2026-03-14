import { eq } from "drizzle-orm";
import {
  jobApplications,
  jobsDetails,
  organizations,
  user,
} from "@/db/schema";
import { db } from "@shared/db/connection";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import { BaseRepository } from "@shared/base/base.repository";
import { JobBoardRepository } from "@/modules/job-board/repositories/job-board.repository";
import { ApplicationsRepository } from "@/modules/applications/repositories/applications.repository";
import type { JobRepositoryPort } from "@/ports/job-repository.port";
import type {
  JobSkills,
  JobWithSkills,
  NewJob,
  NewJobApplication,
  UpdateJob,
  UpdateJobApplication,
} from "@/validations/job.validation";

/**
 * Facade repository that delegates to module-specific repositories.
 * Maintains backward compatibility with JobRepositoryPort while the codebase
 * is incrementally migrated to use module repositories directly.
 *
 * @deprecated Use `JobBoardRepository` from `@/modules/job-board` and `ApplicationsRepository`
 * from `@/modules/applications` instead. This monolithic class will be removed once all consumers
 * have migrated to the new modular repositories.
 */
export class JobRepository
  extends BaseRepository<typeof jobsDetails>
  implements JobRepositoryPort
{
  private jobBoardRepository: JobBoardRepository;
  private applicationsRepository: ApplicationsRepository;

  constructor() {
    super(jobsDetails, "Job");

    this.jobBoardRepository = new JobBoardRepository();
    this.applicationsRepository = new ApplicationsRepository();
  }

  // ─── Job Board Methods (delegate to JobBoardRepository) ─────────────

  async createJob(
    jobData: NewJob & { skills: JobSkills["name"][] },
  ): Promise<JobWithSkills> {
    return this.jobBoardRepository.createJob(jobData);
  }

  async updateJob(jobData: UpdateJob, jobId: number): Promise<JobWithSkills> {
    return this.jobBoardRepository.updateJob(jobData, jobId);
  }

  async findJobById(id: number) {
    return this.jobBoardRepository.findJobById(id);
  }

  async findActiveJobs(options: { page?: number; limit?: number } = {}) {
    return this.jobBoardRepository.findActiveJobs(options);
  }

  async findJobsByEmployer(
    employerId: number,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      q?: string;
      order?: string;
    } = {},
  ) {
    return this.jobBoardRepository.findJobsByEmployer(employerId, options);
  }

  async findJobByIdWithSkills(jobId: number) {
    return this.jobBoardRepository.findJobByIdWithSkills(jobId);
  }

  // ─── Application Methods (delegate to ApplicationsRepository) ───────

  async createApplication(applicationData: NewJobApplication) {
    return this.applicationsRepository.createApplication(applicationData);
  }

  async findApplicationsByJob(
    jobId: number,
    options: { page?: number; limit?: number; status?: string } = {},
  ) {
    return this.applicationsRepository.findApplicationsByJob(jobId, options);
  }

  async findApplicationsByUser(
    userId: number,
    appliedJobIds?: number[],
    options: {
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
    } = {},
  ) {
    return this.applicationsRepository.findApplicationsByUser(
      userId,
      appliedJobIds,
      options,
    );
  }

  async updateApplicationStatus(
    applicationId: number,
    updateData: UpdateJobApplication,
  ) {
    return this.applicationsRepository.updateApplicationStatus(
      applicationId,
      updateData,
    );
  }

  async findApplicationById(applicationId: number) {
    return this.applicationsRepository.findApplicationById(applicationId);
  }

  async hasUserAppliedToJob(userId: number, jobId: number): Promise<boolean> {
    return this.applicationsRepository.hasUserAppliedToJob(userId, jobId);
  }

  async deleteJobApplicationsByUserId(userId: number): Promise<void> {
    return this.applicationsRepository.deleteJobApplicationsByUserId(userId);
  }

  // ─── Dead Code (no callers — kept for port compliance) ───────────────

  async findJobWithApplications(jobId: number) {
    // This method has zero callers in the codebase. It exists only to satisfy
    // the JobRepositoryPort interface. Retained inline since neither module
    // repository exposes this cross-domain join.
    return withDbErrorHandling(
      async () =>
        await db
          .select({
            job: jobsDetails,
            employer: organizations,
            applications: jobApplications,
            applicant: {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
            },
          })
          .from(jobsDetails)
          .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
          .leftJoin(jobApplications, eq(jobsDetails.id, jobApplications.jobId))
          .leftJoin(user, eq(jobApplications.applicantId, user.id))
          .where(eq(jobsDetails.id, jobId)),
    );
  }
}
