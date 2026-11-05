import type { ApplicationsRepositoryPort } from "@/modules/applications";
import type { ApplicationStatusQueryPort } from "@/modules/job-board";

/**
 * Adapter bridging the applications repository into the job-board module's
 * ApplicationStatusQueryPort. Translates application data into the shape
 * the job-board module expects.
 */
export class ApplicationsToJobBoardAdapter implements ApplicationStatusQueryPort {
  constructor(
    private readonly applicationsRepository: ApplicationsRepositoryPort,
  ) {}

  async getAppliedJobIds(
    userId: number,
    jobIds: number[],
  ): Promise<Set<number>> {
    if (jobIds.length === 0) {
      return new Set();
    }

    const applications =
      await this.applicationsRepository.findApplicationsByUser(userId, jobIds);

    return new Set(
      applications.items
        .map((app) => app.job?.id)
        .filter((id): id is number => id !== undefined),
    );
  }

  async hasUserApplied(userId: number, jobId: number): Promise<boolean> {
    return this.applicationsRepository.hasUserAppliedToJob(userId, jobId);
  }

  async hasApplicationsForJob(jobId: number): Promise<boolean> {
    const applications =
      await this.applicationsRepository.findApplicationsByJob(jobId);
    return applications.items.length > 0;
  }
}
