import type { JobBoardRepositoryPort } from "@/modules/job-board/ports/job-board-repository.port";
import type { JobDetailsQueryPort } from "@/modules/applications/ports/job-details-query.port";

/**
 * Adapter bridging the job-board repository into the applications module's
 * JobDetailsQueryPort. Translates job data into the shape the applications
 * module expects for validation and authorization checks.
 */
export class JobBoardToApplicationsAdapter implements JobDetailsQueryPort {
  constructor(private readonly jobBoardRepository: JobBoardRepositoryPort) {}

  async getJobForApplication(jobId: number): Promise<{
    id: number;
    title: string;
    isActive: boolean;
    applicationDeadline: Date | null;
    employerId: number;
  } | null> {
    const jobData = await this.jobBoardRepository.findJobById(jobId);

    if (!jobData?.job) {
      return null;
    }

    return {
      id: jobData.job.id,
      title: jobData.job.title,
      isActive: jobData.job.isActive,
      applicationDeadline: jobData.job.applicationDeadline
        ? new Date(jobData.job.applicationDeadline)
        : null,
      employerId: jobData.job.employerId,
    };
  }

  async getJobWithEmployerId(jobId: number): Promise<{
    jobId: number;
    employerId: number;
    employerOrgId: number;
  } | null> {
    const jobData = await this.jobBoardRepository.findJobById(jobId);

    if (!jobData?.job) {
      return null;
    }

    return {
      jobId: jobData.job.id,
      employerId: jobData.employer?.id ?? jobData.job.employerId,
      employerOrgId: jobData.job.employerId,
    };
  }

  async doesJobExist(jobId: number): Promise<boolean> {
    const jobData = await this.jobBoardRepository.findJobById(jobId);
    return jobData?.job != null;
  }
}
