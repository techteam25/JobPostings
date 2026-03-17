import type { ApplicationInsightsPort } from "@shared/ports/application-insights.port";
import type { JobInsightsRepositoryPort } from "@/modules/job-board";

/**
 * Adapter that bridges the shared ApplicationInsightsPort to the
 * job-board module's JobInsightsRepository.
 *
 * Used by the domain-event worker to increment application counts
 * without importing job-board internals directly.
 */
export class JobBoardToSharedInsightsAdapter implements ApplicationInsightsPort {
  constructor(
    private readonly jobInsightsRepository: Pick<
      JobInsightsRepositoryPort,
      "incrementJobApplications"
    >,
  ) {}

  async incrementJobApplications(jobId: number): Promise<void> {
    await this.jobInsightsRepository.incrementJobApplications(jobId);
  }
}
